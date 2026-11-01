import pool from '../config/db';
import { ResultSetHeader } from 'mysql2';
import { listVisitorCommunities } from '../models/communityModel';
import { insertNotification, NotificationInput } from '../models/notificationModel';
import { listVisitorOrders, VisitorOrder } from '../models/orderModel';
import { listVisitorRentals, VisitorRental } from '../models/rentalModel';
import { rentalNoticeKey, rentalStatusOf } from './catalog';
import { rupiah } from './format';

/*
 * Keputusan admin (verifikasi bayar, setujui/tolak sewa, setujui komunitas) dibuat di API dashboard,
 * yang tidak mengenal akun pengunjung. Karena itu notifikasinya dibuat di sini: status terkini dibandingkan
 * dengan `notified_status` (status terakhir yang sudah diberitahukan); bila berbeda, notifikasi ditambahkan.
 * Dipanggil saat aplikasi membuka notifikasi / akun.
 */

const orderNotice = (o: VisitorOrder): NotificationInput | null => {
  const event = o.event_short ?? o.service;
  if (o.payment === 'Lunas')
    return {
      symbol: '🎟',
      title: 'Pembayaran tiket dikonfirmasi',
      body: `E-tiket ${event} (${o.qty} tiket) sudah aktif. Tunjukkan kode booking ${o.booking_code} di loket.`,
      target: 'tickets',
      targetId: o.booking_code,
    };
  if (o.payment === 'Menunggu bayar' && o.notified_status === 'Perlu verifikasi')
    return {
      symbol: '❌',
      title: 'Bukti transfer perlu diunggah ulang',
      body: `${event} (${o.id}): ${o.note || 'bukti transfer belum sesuai dengan tagihan.'}`,
      target: 'tickets',
      targetId: o.booking_code,
    };
  return null;
};

const rentalNotice = (r: VisitorRental): NotificationInput | null => {
  const status = rentalStatusOf(r);
  const [before, beforePayment] = r.notified_status.split('|');
  const base = { target: 'rental' as const, targetId: r.id };
  if (status === 'rejected')
    return { ...base, symbol: '❌', title: 'Pengajuan sewa ditolak', body: `${r.id} · ${r.admin_note || 'Lihat catatan admin lalu ajukan ulang.'}` };
  if (status === 'paid') return { ...base, symbol: '🧾', title: 'Pembayaran sewa lunas', body: `Bukti reservasi ${r.id} di ${r.venue} sudah terbit.` };
  if (status === 'approved' && before === 'pending')
    return {
      ...base,
      symbol: '✅',
      title: 'Pengajuan sewa disetujui',
      body: `${r.id} disetujui. Selesaikan pembayaran ${rupiah(r.invoice_amount ?? 0)} dan unggah bukti transfer.`,
    };
  if (status === 'approved' && beforePayment === 'Perlu verifikasi' && r.invoice_payment === 'Menunggu bayar')
    return { ...base, symbol: '❌', title: 'Bukti transfer sewa perlu diunggah ulang', body: `${r.id}: ${r.invoice_note || 'bukti transfer belum sesuai dengan tagihan.'}` };
  return null;
};

const communityNotice = (c: { id: string; name: string; status: string; admin_note: string | null }): NotificationInput | null => {
  const base = { target: 'communities' as const, targetId: c.id };
  if (c.status === 'Aktif') return { ...base, symbol: '👥', title: 'Komunitas disetujui', body: `${c.name} kini tampil di Direktori Komunitas.` };
  if (c.status === 'Ditolak')
    return { ...base, symbol: '❌', title: 'Pendaftaran komunitas ditolak', body: `${c.name}: ${c.admin_note || 'hubungi pengelola TKBJ untuk informasi lebih lanjut.'}` };
  if (c.status === 'Nonaktif') return { ...base, symbol: '👥', title: 'Profil komunitas dinonaktifkan', body: `${c.name} sementara tidak tampil di direktori.` };
  return null;
};

const LINK_TABLES = {
  orders: ['visitor_orders', 'order_id'],
  rentals: ['visitor_rentals', 'rental_id'],
  communities: ['visitor_communities', 'community_id'],
} as const;

/**
 * Catat status baru sebagai sudah diberitahukan. Bersyarat pada status lama, sehingga bila dua permintaan
 * berjalan bersamaan hanya satu yang berhasil (notifikasi tidak ganda).
 */
async function claim(link: keyof typeof LINK_TABLES, id: string, from: string, to: string) {
  const [table, key] = LINK_TABLES[link];
  const [result] = await pool.execute<ResultSetHeader>(`UPDATE ${table} SET notified_status = ? WHERE ${key} = ? AND notified_status = ?`, [
    to,
    id,
    from,
  ]);
  return result.affectedRows === 1;
}

export async function syncStatusNotifications(visitorId: number) {
  for (const o of await listVisitorOrders(visitorId)) {
    if (o.payment === o.notified_status || !(await claim('orders', o.id, o.notified_status, o.payment))) continue;
    const notice = orderNotice(o);
    if (notice) await insertNotification(visitorId, notice);
  }
  for (const r of await listVisitorRentals(visitorId)) {
    const key = rentalNoticeKey(r);
    if (key === r.notified_status || !(await claim('rentals', r.id, r.notified_status, key))) continue;
    const notice = rentalNotice(r);
    if (notice) await insertNotification(visitorId, notice);
  }
  for (const c of await listVisitorCommunities(visitorId)) {
    if (c.status === c.notified_status || !(await claim('communities', c.id, c.notified_status, c.status))) continue;
    const notice = communityNotice(c);
    if (notice) await insertNotification(visitorId, notice);
  }
}
