import type { VisitorFile, VisitorFileKind } from '@prisma/client';
import prisma from '../lib/prisma';

/*
 * Berkas yang diunggah pengunjung lewat aplikasi mobile (tabel visitor_files), dibaca lewat Prisma Client.
 * `ref` = kode sewa (SG-...) untuk dokumen & bukti bayar sewa, atau kode booking (TKBJ-...) untuk tiket.
 */

const DOCUMENT_KINDS: VisitorFileKind[] = ['ktp', 'surat', 'proposal'];

export const DOCUMENT_LABELS: Record<string, string> = {
  ktp: 'KTP penanggung jawab',
  surat: 'Surat permohonan',
  proposal: 'Proposal kegiatan',
  bukti: 'Bukti pembayaran',
};

export const toVisitorFile = (f: VisitorFile, url: string) => ({
  id: f.id,
  kind: f.kind,
  label: DOCUMENT_LABELS[f.kind],
  name: f.name,
  type: f.mime,
  size: f.size,
  createdAt: f.created_at.toISOString(),
  url,
});

/** Kode booking aplikasi untuk satu pesanan tiket (null bila pesanan dibuat di luar aplikasi). */
export const bookingCodeOf = async (orderId: string) =>
  (await prisma.visitorOrder.findUnique({ where: { order_id: orderId }, select: { booking_code: true } }))?.booking_code ?? null;

/** Bukti bayar terbaru untuk kode sewa / kode booking. */
export const latestProof = (ref: string) =>
  prisma.visitorFile.findFirst({ where: { ref, kind: 'bukti' }, orderBy: { created_at: 'desc' } });

/** Dokumen pengajuan sewa (KTP, surat, proposal). */
export const rentalDocuments = (rentalId: string) =>
  prisma.visitorFile.findMany({ where: { ref: rentalId, kind: { in: DOCUMENT_KINDS } }, orderBy: { kind: 'asc' } });

/** Satu dokumen milik pengajuan sewa ini; dokumen sewa lain → null (404). */
export const findRentalDocument = (rentalId: string, fileId: string) =>
  prisma.visitorFile.findFirst({ where: { id: fileId, ref: rentalId, kind: { in: DOCUMENT_KINDS } } });
