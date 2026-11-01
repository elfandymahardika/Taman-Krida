import { randomUUID } from 'crypto';
import { Request, Response } from 'express';
import { transaction, Queryable } from '../config/db';
import { config } from '../config/env';
import { findSlot, PAYMENT_LABELS, RENTAL_DOCUMENTS, RENTAL_RATES, RENTAL_SLOTS, slotOf } from '../lib/catalog';
import { hhmm, iso, lastDay, parseMonth, rupiah, shortDate } from '../lib/format';
import { assertValid, badRequest, conflict, FieldErrors, notFound, queryText, retryOnDuplicate } from '../lib/http';
import { rentalNoticeKey, rentalStatusLabel, rentalStatusOf } from '../lib/catalog';
import { fileLabel, originalName, removeFiles, saveFile } from '../lib/storage';
import { logActivity, notifyAdmin } from '../models/adminModel';
import { eventsAtVenue } from '../models/eventModel';
import { insertFile, listFiles, toFile } from '../models/fileModel';
import { findFacilityById, rentalRateOf, toFacility } from '../models/infoModel';
import { insertNotification } from '../models/notificationModel';
import { findRentalInvoice, submitPaymentProof } from '../models/orderModel';
import {
  findVisitorRental,
  insertRental,
  lastRentalNumber,
  linkVisitorRental,
  listVisitorRentals,
  rentalsAtVenue,
  setRentalNotified,
  VisitorRental,
} from '../models/rentalModel';

type Busy = { date: string; start_time: string; end_time: string };
type Slot = (typeof RENTAL_SLOTS)[number];

/** Jadwal fasilitas yang terpakai: semua acara + sewa yang masih ditinjau / disetujui. */
const busyAt = async (venue: string, from: string, to: string, db?: Queryable): Promise<Busy[]> => [
  ...(await eventsAtVenue(venue, from, to, db)),
  ...(await rentalsAtVenue(venue, from, to, db)),
];

/** Slot terisi bila jamnya beririsan dengan acara/sewa lain di tanggal yang sama. */
const slotTaken = (busy: Busy[], date: string, slot: Slot) =>
  busy.some((b) => b.date === date && hhmm(b.start_time) < slot.end && slot.start < hhmm(b.end_time));

/** Fasilitas yang bisa disewa beserta tarifnya; selain itu 404. */
async function mustFindRentable(id: string) {
  const facility = id ? await findFacilityById(id) : null;
  const rate = facility && rentalRateOf(facility);
  if (!facility || rate === null) throw notFound('Venue sewa');
  return { facility, rate: rate! };
}

/** Baris sewa milik pengunjung → JSON untuk Status Pengajuan / Riwayat Sewa / Bukti Reservasi. */
function toRental(r: VisitorRental) {
  const status = rentalStatusOf(r);
  const start = hhmm(r.start_time);
  const end = hhmm(r.end_time);
  return {
    id: r.id,
    venue: r.venue,
    activity: r.activity,
    applicant: r.applicant,
    contact: r.contact,
    date: r.date,
    start,
    end,
    slot: slotOf(start, end) ?? undefined,
    status,
    statusLabel: rentalStatusLabel(status, r.invoice_payment),
    approval: r.approval,
    adminNote: r.admin_note ?? undefined,
    filesComplete: Boolean(r.files_ok),
    submittedAt: iso(r.submitted_at),
    decidedAt: iso(r.decided_at),
    amount: r.invoice_amount ?? RENTAL_RATES[r.venue],
    payment: r.invoice_payment ?? undefined,
    paymentLabel: r.invoice_payment ? PAYMENT_LABELS[r.invoice_payment] : undefined,
    method: r.invoice_method ?? undefined,
    /** Catatan admin pada tagihan, mis. alasan bukti transfer ditolak. */
    paymentNote: r.invoice_note ?? undefined,
    paidAt: iso(r.invoice_paid_at),
  };
}

async function rentalDetail(visitorId: number, id: string) {
  const rental = await findVisitorRental(visitorId, id);
  if (!rental) throw notFound('Pengajuan sewa');
  return { ...toRental(rental), documents: (await listFiles(visitorId, id)).map(toFile) };
}

/**
 * Kalender ketersediaan satu venue per bulan: ?facilityId=pendopo&month=2026-10.
 * Tiap slot: available | full (bentrok acara/sewa) | past (sebelum hari ini).
 */
export const getAvailability = async (req: Request, res: Response) => {
  const { facility } = await mustFindRentable(queryText(req.query.facilityId));
  const month = queryText(req.query.month) || config.today.slice(0, 7);
  const parsed = parseMonth(month);
  if (!parsed) throw badRequest('Format bulan tidak valid.', { month: 'Gunakan format YYYY-MM, mis. 2026-10.' });

  const days = lastDay(parsed.y, parsed.m);
  const busy = await busyAt(facility.name, `${month}-01`, `${month}-${days}`);
  res.json({
    facility: toFacility(facility),
    month,
    today: config.today,
    slots: RENTAL_SLOTS,
    days: Array.from({ length: days }, (_, i) => {
      const date = `${month}-${String(i + 1).padStart(2, '0')}`;
      const slots = Object.fromEntries(
        RENTAL_SLOTS.map((s) => [s.key, date < config.today ? 'past' : slotTaken(busy, date, s) ? 'full' : 'available']),
      );
      return { date, available: Object.values(slots).includes('available'), slots };
    }),
  });
};

/**
 * Ajukan sewa gedung (multipart): facilityId, date, slot, activity, applicant, contact + berkas ktp, surat, proposal.
 * Masuk antrean "Perlu ditinjau" di dashboard; tagihan dibuat dashboard saat Admin Sewa menyetujui.
 */
export const createRental = async (req: Request, res: Response) => {
  const visitor = res.locals.visitor;
  const { facilityId, date, slot: slotKey, activity, applicant, contact } = req.body;
  const files = req.files as Record<string, Express.Multer.File[]>;

  const facility = await findFacilityById(facilityId);
  const errors: FieldErrors = {};
  if (!facility || rentalRateOf(facility) === null) errors.facilityId = 'Venue ini tidak dapat disewa.';
  const maxDate = new Date(Date.parse(config.today) + 365 * 86400e3).toISOString().slice(0, 10);
  if (date < config.today) errors.date = 'Tanggal sudah lewat. Pilih tanggal lain.';
  else if (date > maxDate) errors.date = 'Sewa hanya bisa diajukan paling lambat 1 tahun ke depan.';
  assertValid(errors);

  const slot = findSlot(slotKey)!;
  const venue = facility!.name;
  const documents = RENTAL_DOCUMENTS.map((d) => ({ kind: d.key, file: files[d.key][0] }));
  const keys: string[] = [];
  let id: string;
  try {
    for (const d of documents) keys.push(await saveFile(d.file));
    id = await retryOnDuplicate(() =>
      transaction(async (conn) => {
        // Kunci baris fasilitas: pengajuan bersamaan di venue yang sama diproses bergantian, jadi cek bentrok tidak terlewat.
        await conn.execute('SELECT id FROM facilities WHERE id = ? FOR UPDATE', [facility!.id]);
        if (slotTaken(await busyAt(venue, date, date, conn), date, slot))
          throw conflict('Jadwal tidak tersedia.', { slot: `Slot ${slot.label.toLowerCase()} pada ${shortDate(date)} sudah terisi. Pilih slot atau tanggal lain.` });

        const code = `SG-${date.slice(5, 7)}${date.slice(2, 4)}-${String((await lastRentalNumber(conn)) + 1).padStart(4, '0')}`;
        const proposal = documents.find((d) => d.kind === 'proposal')!.file;
        await insertRental({ id: code, applicant, venue, date, start: slot.start, end: slot.end, activity, file: fileLabel(proposal) }, conn);
        await linkVisitorRental({ rentalId: code, visitorId: visitor.id, contact, status: 'pending|' }, conn);
        for (const [i, d] of documents.entries()) {
          await insertFile(
            { id: randomUUID(), visitor_id: visitor.id, kind: d.kind, ref: code, name: originalName(d.file), file_key: keys[i], mime: d.file.mimetype, size: d.file.size },
            conn,
          );
        }
        await logActivity('rental', 'Permintaan sewa dari aplikasi', `${applicant} · ${code}`, conn);
        await notifyAdmin(`Permintaan sewa ${code} (${venue}, ${shortDate(date)}) perlu ditinjau`, '/sewa', 'rental', conn);
        await insertNotification(
          visitor.id,
          { symbol: '📅', title: 'Pengajuan sewa terkirim', body: `${code} sedang ditinjau Admin Sewa. Kami kabari setelah diputuskan.`, target: 'rental', targetId: code },
          conn,
        );
        return code;
      }),
    );
  } catch (error) {
    // Rollback anti-file yatim: berkas dihapus bila pengajuan gagal disimpan.
    await removeFiles(keys);
    throw error;
  }
  res.status(201).json(await rentalDetail(visitor.id, id));
};

/** Riwayat Sewa: semua pengajuan milik pengunjung, terbaru dulu. */
export const getRentals = async (_req: Request, res: Response) => {
  res.json((await listVisitorRentals(res.locals.userId)).map(toRental));
};

/** Detail pengajuan + dokumen. Pengajuan milik orang lain → 404 (cegah IDOR). */
export const getRental = async (req: Request<{ id: string }>, res: Response) => {
  res.json(await rentalDetail(res.locals.userId, req.params.id));
};

/**
 * Bayar tagihan sewa yang sudah disetujui (multipart: file, method, sender) → "Perlu verifikasi" di menu Transaksi.
 */
export const payRental = async (req: Request<{ id: string }>, res: Response) => {
  const visitor = res.locals.visitor;
  const rental = await findVisitorRental(visitor.id, req.params.id);
  if (!rental) throw notFound('Pengajuan sewa');
  const status = rentalStatusOf(rental);
  if (status === 'pending') throw conflict('Pengajuan belum disetujui admin.');
  if (status === 'rejected') throw conflict('Pengajuan ini ditolak. Silakan ajukan ulang.');
  if (status === 'paid') throw conflict('Sewa ini sudah lunas.');
  const invoice = await findRentalInvoice(rental.id);
  if (!invoice) throw conflict('Tagihan sewa belum dibuat. Hubungi Admin Sewa.');
  if (invoice.payment === 'Perlu verifikasi') throw conflict('Bukti transfer sedang diverifikasi admin.');

  const file = req.file!;
  const key = await saveFile(file);
  try {
    await transaction(async (conn) => {
      const changed = await submitPaymentProof([invoice.id], { method: req.body.method, file: fileLabel(file), from: `a.n. ${req.body.sender || visitor.name}` }, conn);
      if (changed !== 1) throw conflict('Status tagihan baru saja berubah. Muat ulang lalu coba lagi.');
      await insertFile(
        { id: randomUUID(), visitor_id: visitor.id, kind: 'bukti', ref: rental.id, name: originalName(file), file_key: key, mime: file.mimetype, size: file.size },
        conn,
      );
      await setRentalNotified(rental.id, rentalNoticeKey({ approval: rental.approval, invoice_payment: 'Perlu verifikasi' }), conn);
      await logActivity('payment', 'Bukti transfer diunggah', `${rental.applicant} · ${invoice.id}`, conn);
      await notifyAdmin(`Bukti transfer ${invoice.id} menunggu verifikasi (${rupiah(invoice.amount)})`, '/transaksi', 'payment', conn);
    });
  } catch (error) {
    await removeFiles([key]);
    throw error;
  }
  res.json(await rentalDetail(visitor.id, rental.id));
};
