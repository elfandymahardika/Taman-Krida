import { Request, Response } from 'express';
import { transaction } from '../config/db';
import { RENTAL_RATES } from '../db/seeders/data';
import { logActivity, notify } from '../lib/activity';
import { hhmm, iso, shortDate } from '../lib/format';
import { conflict, likePattern, notFound, queryText, where } from '../lib/http';
import { overlappingEvents } from '../models/eventModel';
import { createRentalInvoice, findRentalInvoice } from '../models/orderModel';
import {
  createRental,
  decideRental,
  findRentalById,
  lastRentalNumber,
  listRentals,
  markRentalFilesComplete,
  overlappingRentals,
  Rental,
} from '../models/rentalModel';

interface Clash {
  type: 'Acara' | 'Sewa';
  id: string;
  name: string;
  start: string;
  end: string;
}

/** Acara dan sewa disetujui di fasilitas & tanggal yang sama dengan jam yang beririsan. */
async function findConflicts({ id, venue, date, start, end }: { id?: string; venue: string; date: string; start: string; end: string }) {
  const events = (await overlappingEvents(venue, date, start, end)).map(
    (e): Clash => ({ type: 'Acara', id: e.id, name: e.name, start: hhmm(e.start_time), end: hhmm(e.end_time) }),
  );
  const rentals = (await overlappingRentals(venue, date, start, end, id)).map(
    (r): Clash => ({ type: 'Sewa', id: r.id, name: r.applicant, start: hhmm(r.start_time), end: hhmm(r.end_time) }),
  );
  return [...events, ...rentals];
}

const describe = (c: Clash) => `${c.type === 'Acara' ? 'acara' : 'sewa'} "${c.name}" (${c.start.replace(':', '.')}–${c.end.replace(':', '.')})`;

const conflictsOf = (r: Rental) =>
  findConflicts({ id: r.id, venue: r.venue, date: r.date, start: hhmm(r.start_time), end: hhmm(r.end_time) });

async function toRental(r: Rental) {
  const invoice = await findRentalInvoice(r.id);
  return {
    id: r.id,
    applicant: r.applicant,
    venue: r.venue,
    date: r.date,
    start: hhmm(r.start_time),
    end: hhmm(r.end_time),
    activity: r.activity,
    approval: r.approval,
    file: r.file ?? undefined,
    adminNote: r.admin_note ?? undefined,
    filesComplete: Boolean(r.files_ok),
    submittedAt: iso(r.submitted_at),
    decidedAt: iso(r.decided_at),
    payment: invoice?.payment,
    amount: invoice?.amount ?? RENTAL_RATES[r.venue],
    conflicts: await conflictsOf(r),
  };
}

async function mustFind(id: string) {
  const rental = await findRentalById(id);
  if (!rental) throw notFound('Permintaan sewa');
  return rental;
}

const mustBePending = (r: Rental) => {
  if (r.approval !== 'Perlu ditinjau') throw conflict(`Permintaan ini sudah ${r.approval.toLowerCase()}.`);
};

/** Daftar permintaan sewa: ?approval=&venue=&from=&to=&q= */
export const getRentals = async (req: Request, res: Response) => {
  const [approval, venue, from, to, q] = ['approval', 'venue', 'from', 'to', 'q'].map((k) => queryText(req.query[k]));
  const filter = where([
    approval && ['approval = ?', approval],
    venue && ['venue = ?', venue],
    from && ['date >= ?', from],
    to && ['date <= ?', to],
    q && ['(id LIKE ? OR applicant LIKE ?)', likePattern(q), likePattern(q)],
  ]);
  const rows = await listRentals(filter);
  res.json(await Promise.all(rows.map(toRental)));
};

export const getRental = async (req: Request<{ id: string }>, res: Response) => {
  res.json(await toRental(await mustFind(req.params.id)));
};

/** Admin mencatat pemesanan gedung (mis. dari loket). Data sudah divalidasi validateRental. */
export const createRentalRequest = async (req: Request, res: Response) => {
  const data = req.body;
  const clash = await findConflicts(data);
  if (clash.length) throw conflict('Jadwal bentrok.', { date: `Bentrok dengan ${clash.map(describe).join(', ')}.` });

  const [y, m] = data.date.split('-');
  const id = `SG-${m}${y.slice(2)}-${String((await lastRentalNumber()) + 1).padStart(4, '0')}`;
  await createRental({ id, ...data });
  await logActivity('rental', 'Pemesanan gedung dicatat', `${res.locals.user.name} · ${data.applicant}, ${id}`);
  res.status(201).json(await toRental((await findRentalById(id))!));
};

export const approveRental = async (req: Request<{ id: string }>, res: Response) => {
  const rental = await mustFind(req.params.id);
  mustBePending(rental);
  const clash = await conflictsOf(rental);
  if (clash.length) throw conflict(`Tidak dapat disetujui: bentrok dengan ${clash.map(describe).join(', ')}.`);

  await transaction(async (conn) => {
    await decideRental(rental.id, 'Disetujui', req.body?.note || null, conn);
    // Tagihan sewa dibuat setelah disetujui; pemohon membayar lewat aplikasi.
    await createRentalInvoice({ ...rental, amount: RENTAL_RATES[rental.venue] }, conn);
    await logActivity('rental', 'Sewa gedung disetujui', `${res.locals.user.name} · ${rental.applicant}, ${shortDate(rental.date)}`, conn);
    await notify(`Sewa ${rental.id} disetujui — tagihan dikirim ke pemohon`, '/sewa', 'rental', conn);
  });
  res.json(await toRental((await findRentalById(rental.id))!));
};

export const rejectRental = async (req: Request<{ id: string }>, res: Response) => {
  const rental = await mustFind(req.params.id);
  mustBePending(rental);
  await decideRental(rental.id, 'Ditolak', req.body?.note || null);
  await logActivity('rental', 'Sewa gedung ditolak', `${res.locals.user.name} · ${rental.applicant}, ${rental.id}`);
  res.json(await toRental((await findRentalById(rental.id))!));
};

export const completeRentalFiles = async (req: Request<{ id: string }>, res: Response) => {
  const rental = await mustFind(req.params.id);
  await markRentalFilesComplete(rental.id);
  res.json(await toRental((await findRentalById(rental.id))!));
};
