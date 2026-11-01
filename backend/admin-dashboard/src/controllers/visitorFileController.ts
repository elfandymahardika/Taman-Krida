import { Request, Response } from 'express';
import type { VisitorFile } from '@prisma/client';
import { notFound } from '../lib/http';
import { findOrderById } from '../models/orderModel';
import { findRentalById } from '../models/rentalModel';
import { bookingCodeOf, findRentalDocument, latestProof, rentalDocuments, toVisitorFile } from '../models/visitorFileModel';
import { openVisitorFile } from '../services/storage.service';

/*
 * Lampiran dari aplikasi pengunjung untuk ditinjau admin: bukti bayar (menu Transaksi, butuh akses modul
 * payments) dan KTP/surat/proposal sewa (menu Sewa gedung, butuh akses modul rentals). Berkas bersifat
 * pribadi — tidak pernah disajikan statis, hanya di-stream lewat endpoint yang memeriksa peran ini.
 */

/** Kirim isi berkas untuk dibuka di tab baru (inline). */
async function sendFile(res: Response, file: VisitorFile | null, what: string) {
  const stream = file ? await openVisitorFile(file.file_key) : null;
  if (!file || !stream) throw notFound(what);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(file.name)}`);
  res.type(file.mime);
  stream.pipe(res);
}

/** GET /api/orders/:id/proof — bukti bayar terbaru yang diunggah pemesan lewat aplikasi. */
export const getOrderProof = async (req: Request<{ id: string }>, res: Response) => {
  const order = await findOrderById(req.params.id);
  if (!order) throw notFound('Transaksi');
  // Bukti sewa disimpan per kode sewa; bukti tiket per kode booking aplikasi.
  const ref = order.rental_id ?? (await bookingCodeOf(order.id));
  await sendFile(res, ref ? await latestProof(ref) : null, 'Berkas bukti transfer (bukti pada data contoh hanya berupa nama berkas)');
};

/** GET /api/rentals/:id/documents — daftar dokumen pengajuan sewa. */
export const getRentalDocuments = async (req: Request<{ id: string }>, res: Response) => {
  const rental = await findRentalById(req.params.id);
  if (!rental) throw notFound('Permintaan sewa');
  const files = await rentalDocuments(rental.id);
  res.json(files.map((f) => toVisitorFile(f, `/rentals/${rental.id}/documents/${f.id}`)));
};

/** GET /api/rentals/:id/documents/:fileId — isi satu dokumen pengajuan sewa. */
export const getRentalDocument = async (req: Request<{ id: string; fileId: string }>, res: Response) => {
  await sendFile(res, await findRentalDocument(req.params.id, req.params.fileId), 'Dokumen sewa');
};
