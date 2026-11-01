import assert from 'node:assert/strict';
import fs from 'node:fs';
import { AddressInfo } from 'node:net';
import { Server } from 'node:http';
import { after, before, describe, test } from 'node:test';
import jwt from 'jsonwebtoken';
import app from '../src/app';
import pool from '../src/config/db';
import { config } from '../src/config/env';
import prisma from '../src/lib/prisma';
import { expectedCopy, COPY } from '../src/db/syncSchema';
import { runSeeders } from '../src/db/seeders/run';
// API dashboard yang asli: dipakai untuk menyiapkan skema & data contoh, dan untuk keputusan admin
// (verifikasi bayar, setujui sewa/komunitas), agar alur aplikasi → dashboard → aplikasi teruji utuh.
import adminApp from '../../admin-dashboard/src/app';
import adminPool from '../../admin-dashboard/src/config/db';
import adminPrisma from '../../admin-dashboard/src/lib/prisma';
import { recreateTestDatabase } from '../../admin-dashboard/src/db/migrate';
import { runSeeders as runAdminSeeders } from '../../admin-dashboard/src/db/seeders/run';

let server: Server;
let adminServer: Server;
let base: string;
let adminBase: string;
let adminToken: string;

/** Satu baris dari query SQL murni (untuk memeriksa isi database langsung). */
const queryOne = async (sql: string, params: (string | number)[] = []) => ((await pool.execute(sql, params))[0] as any[])[0];

const listen = async (handler: typeof app) => {
  const s = handler.listen(0);
  await new Promise((r) => s.once('listening', r));
  return { server: s, url: `http://localhost:${(s.address() as AddressInfo).port}/api` };
};

before(async () => {
  // Satu skema Prisma (milik dashboard) untuk seluruh tabel: buat ulang database test, isi data contoh
  // dashboard, lalu data contoh pengunjung.
  await recreateTestDatabase();
  await runAdminSeeders();
  await runSeeders();
  ({ server, url: base } = await listen(app));
  ({ server: adminServer, url: adminBase } = await listen(adminApp));
  adminToken = (await adminCall('/auth/login', { method: 'POST', body: { username: 'admin', password: 'admin123' } })).body.token;
});

after(async () => {
  server.close();
  adminServer.close();
  await pool.end();
  await adminPool.end();
  await prisma.$disconnect();
  await adminPrisma.$disconnect();
  fs.rmSync(config.uploadsDir, { recursive: true, force: true });
});

interface CallOptions {
  token?: string;
  method?: string;
  body?: unknown;
  form?: FormData;
}

async function request(url: string, { token, method = 'GET', body, form }: CallOptions = {}): Promise<{ status: number; body: any; headers: Headers }> {
  const res = await fetch(url, {
    method: form ? 'POST' : method,
    headers: {
      ...(!form && { 'content-type': 'application/json' }),
      ...(token && { authorization: `Bearer ${token}` }),
    },
    body: form ?? (body ? JSON.stringify(body) : undefined),
  });
  const text = await res.text();
  return { status: res.status, headers: res.headers, body: text && res.headers.get('content-type')?.includes('json') ? JSON.parse(text) : text };
}

const call = (path: string, options?: CallOptions) => request(base + path, options);
const adminCall = (path: string, options: CallOptions = {}) => request(adminBase + path, { token: adminToken, ...options });

const login = async (email: string, password = 'tkbj2026'): Promise<string> =>
  (await call('/auth/login', { method: 'POST', body: { email, password } })).body.token;

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const PDF = Buffer.from('%PDF-1.4\n%contoh\n');
const file = (content: Buffer, type: string) => new Blob([new Uint8Array(content)], { type });

const proofForm = (fields: Record<string, string> = { method: 'QRIS', sender: 'Budi Santoso' }, content = PNG, type = 'image/png') => {
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) form.append(k, v);
  form.append('file', file(content, type), 'bukti-transfer.png');
  return form;
};

const rentalForm = (fields: Record<string, string>, docs = ['ktp', 'surat', 'proposal']) => {
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) form.append(k, v);
  for (const d of docs) form.append(d, file(PDF, 'application/pdf'), `${d}.pdf`);
  return form;
};

describe('Prisma & struktur auth', () => {
  test('salinan skema Prisma sama dengan skema dashboard (npm run prisma:sync)', () => {
    assert.equal(fs.readFileSync(COPY, 'utf8'), expectedCopy());
  });

  test('model auth memakai Prisma Client: akun demo terbaca dengan id number', async () => {
    const visitor = await prisma.visitor.findUnique({ where: { email: 'budi.santoso@email.com' } });
    assert.ok(visitor && typeof visitor.id === 'bigint');
    const me = await call('/auth/me', { token: await login('budi.santoso@email.com') });
    assert.equal(me.body.user.id, Number(visitor!.id));
  });
});

describe('informasi publik', () => {
  test('health, meta, dan beranda', async () => {
    assert.equal((await call('/health')).body.service, 'tkbj-mobile-api');
    const meta = await call('/meta');
    assert.deepEqual(meta.body.paymentMethods, ['QRIS', 'Virtual Account', 'E-Wallet', 'Transfer bank']);
    assert.equal(meta.body.tickets.maxPerEvent, 10);
    const home = await call('/home');
    assert.equal(home.status, 200);
    assert.equal(home.body.banner.type, 'Banner beranda');
    assert.ok(home.body.upcomingEvents.length > 0);
    assert.ok(home.body.upcomingEvents.every((e: any) => e.date >= '2026-10-02'));
  });

  test('kalender hanya berisi acara terpublikasi mulai hari ini', async () => {
    const events = (await call('/events')).body;
    assert.ok(events.length > 0);
    assert.ok(events.every((e: any) => e.date >= '2026-10-02'));
    assert.ok(!events.some((e: any) => e.id === 'festival'), 'acara Draf tidak tampil');
    assert.equal((await call('/events/festival')).status, 404);

    const topeng = (await call('/events/topeng')).body;
    assert.equal(topeng.category, 'Tari');
    assert.equal(topeng.ticketed, true);
    // Kuota 300 − 176 terjual − 4 tiket TK-1026-0127 yang sedang diverifikasi (TK-1026-0124 sudah lewat batas bayar).
    assert.equal(topeng.remaining, 120);

    const wayang = (await call('/events?category=Wayang&all=1')).body;
    assert.ok(wayang.length >= 2 && wayang.every((e: any) => e.category === 'Wayang'));
  });

  test('galeri & direktori komunitas hanya menampilkan data yang dipublikasikan/aktif', async () => {
    const gallery = (await call('/gallery')).body;
    assert.ok(gallery.length > 0 && !gallery.some((m: any) => m.id === 'm4'));
    assert.equal((await call('/gallery/m4')).status, 404);
    assert.ok((await call('/gallery/collections')).body.some((c: any) => c.name === 'Pertunjukan Oktober'));

    const communities = (await call('/communities')).body;
    assert.ok(communities.some((c: any) => c.id === 'mekar'));
    assert.ok(!communities.some((c: any) => ['arum', 'turonggo'].includes(c.id)), 'yang menunggu/nonaktif tidak tampil');
    assert.equal((await call('/communities/arum')).status, 404);
    assert.equal((await call('/communities?category=Seni musik')).body.length, 1);

    const facilities = (await call('/facilities')).body;
    assert.equal(facilities.find((f: any) => f.id === 'pendopo').rentalRate, 2500000);
    assert.equal(facilities.find((f: any) => f.id === 'loket').rentable, false);
  });
});

describe('autentikasi pengunjung', () => {
  test('registrasi memvalidasi input dan langsung masuk', async () => {
    const invalid = await call('/auth/register', { method: 'POST', body: { name: 'Al', email: 'bukan-email', phone: '12345', password: 'pendek' } });
    assert.equal(invalid.status, 400);
    assert.deepEqual(Object.keys(invalid.body.fields).sort(), ['email', 'name', 'password', 'phone']);

    const dup = await call('/auth/register', {
      method: 'POST',
      body: { name: 'Budi Lain', email: 'BUDI.santoso@email.com', phone: '081299998888', password: 'Rahasia123' },
    });
    assert.equal(dup.status, 400);
    assert.ok(dup.body.fields.email);

    const res = await call('/auth/register', {
      method: 'POST',
      body: { name: 'Rina  Kartika', email: 'rina@email.com', phone: '0812-3456-7890', password: 'Rahasia123', confirm: 'Rahasia123' },
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.user.name, 'Rina Kartika');
    const me = await call('/auth/me', { token: res.body.token });
    assert.equal(me.body.user.email, 'rina@email.com');
    assert.equal(me.body.stats.unreadNotifications, 1, 'notifikasi selamat datang');

    const row = await queryOne('SELECT password_hash FROM visitors WHERE email = ?', ['rina@email.com']);
    assert.match(row.password_hash, /^\$2[aby]\$10\$/);
  });

  test('login, token staf ditolak, dan logout mencabut sesi', async () => {
    assert.equal((await call('/auth/login', { method: 'POST', body: { email: 'budi.santoso@email.com', password: 'salah1234' } })).status, 401);
    assert.equal((await call('/tickets')).status, 401);
    // Token dashboard (tanpa klaim aud mobile) tidak berlaku di API mobile.
    assert.equal((await call('/tickets', { token: adminToken })).status, 401);
    const forged = jwt.sign({ sub: '1' }, config.jwtSecret, { jwtid: 'tidak-ada', audience: config.jwtAudience });
    assert.equal((await call('/tickets', { token: forged })).status, 401);

    const token = await login('budi.santoso@email.com');
    const me = await call('/auth/me', { token });
    assert.equal(me.body.user.name, 'Budi Santoso');
    assert.equal(me.body.stats.bookings, 1);
    assert.equal(me.body.stats.rentals, 2);

    assert.equal((await call('/auth/logout', { method: 'POST', token })).status, 204);
    assert.equal((await call('/auth/me', { token })).status, 401);
  });

  test('edit profil & ganti kata sandi mengeluarkan perangkat lain', async () => {
    const sari = await login('sari.wulandari@email.com');
    const taken = await call('/auth/me', { method: 'PUT', token: sari, body: { name: 'Sari W', email: 'budi.santoso@email.com', phone: '085712345678' } });
    assert.equal(taken.status, 400);
    const ok = await call('/auth/me', { method: 'PUT', token: sari, body: { name: 'Sari W', email: 'sari.wulandari@email.com', phone: '085712345678', city: 'Sidoarjo' } });
    assert.equal(ok.body.user.city, 'Sidoarjo');

    // Akun Rina (dibuat di test registrasi) dipakai untuk ganti kata sandi, agar akun demo tetap tkbj2026.
    const a = await login('rina@email.com', 'Rahasia123');
    const b = await login('rina@email.com', 'Rahasia123');
    assert.equal((await call('/auth/password', { method: 'PUT', token: a, body: { current: 'salah', password: 'Baru12345' } })).status, 400);
    const weak = await call('/auth/password', { method: 'PUT', token: a, body: { current: 'Rahasia123', password: 'baru12345' } });
    assert.match(weak.body.fields.password, /huruf besar/);
    assert.equal((await call('/auth/password', { method: 'PUT', token: a, body: { current: 'Rahasia123', password: 'Baru12345' } })).status, 200);
    assert.equal((await call('/auth/me', { token: a })).status, 200, 'sesi yang dipakai tetap berlaku');
    assert.equal((await call('/auth/me', { token: b })).status, 401, 'sesi lain dicabut');
    assert.ok(await login('rina@email.com', 'Baru12345'));
  });
});

describe('tiket: aplikasi → dashboard → aplikasi', () => {
  let budi: string;
  let sari: string;
  let code: string;

  before(async () => {
    budi = await login('budi.santoso@email.com');
    sari = await login('sari.wulandari@email.com');
  });

  test('checkout menolak acara tanpa tiket, draf, dan jumlah melebihi batas/kuota', async () => {
    const bad = await call('/tickets/checkout', {
      method: 'POST',
      token: budi,
      body: { items: [{ eventId: 'karawitan', qty: 1 }, { eventId: 'festival', qty: 1 }, { eventId: 'topeng', qty: 11 }] },
    });
    assert.equal(bad.status, 400);
    assert.deepEqual(Object.keys(bad.body.fields).sort(), ['items.0.eventId', 'items.1.eventId', 'items.2.qty']);

    await pool.execute('UPDATE events SET sold = quota - 92 WHERE id = ?', ['ketoprak']); // sisa 92 − 9 tiket dipesan = 83
    const full = await call('/tickets/checkout', { method: 'POST', token: budi, body: { items: [{ eventId: 'ketoprak', qty: 10 }] } });
    assert.equal(full.status, 201, 'kuota masih cukup');
    await pool.execute('UPDATE events SET sold = quota - 12 WHERE id = ?', ['ketoprak']); // sisa 12 − 19 dipesan = 0
    const none = await call('/tickets/checkout', { method: 'POST', token: budi, body: { items: [{ eventId: 'ketoprak', qty: 1 }] } });
    assert.equal(none.status, 400);
    assert.match(none.body.fields['items.0.qty'], /tersisa 0 tiket/);
  });

  test('checkout membuat pesanan "Menunggu bayar" di menu Transaksi dashboard', async () => {
    const res = await call('/tickets/checkout', {
      method: 'POST',
      token: budi,
      body: { items: [{ eventId: 'wayang', qty: 2 }, { eventId: 'topeng', qty: 1 }] },
    });
    assert.equal(res.status, 201);
    code = res.body.code;
    assert.match(code, /^TKBJ-[A-Z2-9]{6}$/);
    assert.equal(res.body.total, 150000);
    assert.equal(res.body.payment, 'Menunggu bayar');
    assert.equal(res.body.lines.length, 2);
    assert.equal(res.body.buyer.name, 'Budi Santoso', 'data pemesan bawaan dari profil');

    const orders = (await adminCall('/orders?type=Tiket&payment=Menunggu bayar')).body;
    for (const id of res.body.orderIds) assert.ok(orders.some((o: any) => o.id === id && o.customer === 'Budi Santoso'));
  });

  test('booking milik orang lain tidak bisa dilihat atau dibayar (404)', async () => {
    assert.equal((await call(`/tickets/${code}`, { token: sari })).status, 404);
    assert.equal((await call(`/tickets/${code}/payment`, { token: sari, form: proofForm() })).status, 404);
    assert.equal((await call('/tickets', { token: sari })).body.length, 0);
  });

  test('unggah bukti: validasi berkas & metode, lalu masuk antrean verifikasi', async () => {
    const fake = await call(`/tickets/${code}/payment`, { token: budi, form: proofForm(undefined, Buffer.from('bukan gambar'), 'image/png') });
    assert.equal(fake.status, 400);
    assert.ok(fake.body.fields.file);
    const exe = await call(`/tickets/${code}/payment`, { token: budi, form: proofForm(undefined, Buffer.from('MZ'), 'application/x-msdownload') });
    assert.equal(exe.status, 400);
    const method = await call(`/tickets/${code}/payment`, { token: budi, form: proofForm({ method: 'Cek' }) });
    assert.equal(method.status, 400);
    assert.ok(method.body.fields.method);

    const res = await call(`/tickets/${code}/payment`, { token: budi, form: proofForm() });
    assert.equal(res.status, 200);
    assert.equal(res.body.payment, 'Perlu verifikasi');
    assert.equal(res.body.proofs.length, 1);

    const order = (await adminCall(`/orders/${res.body.lines[0].orderId}`)).body;
    assert.equal(order.payment, 'Perlu verifikasi');
    assert.equal(order.proof.method, 'QRIS');
    assert.equal(order.proof.from, 'a.n. Budi Santoso');
    const bell = (await adminCall('/notifications')).body;
    assert.ok(bell.items.some((n: any) => n.message.startsWith('Bukti transfer') && n.message.includes(res.body.lines[0].orderId)));

    assert.equal((await call(`/tickets/${code}/payment`, { token: budi, form: proofForm() })).status, 409, 'tidak bisa unggah dua kali');

    // Berkas bukti hanya bisa diunduh pemiliknya.
    const fileUrl = res.body.proofs[0].url.replace('/api', '');
    const download = await call(fileUrl, { token: budi });
    assert.equal(download.status, 200);
    assert.equal(download.headers.get('content-type'), 'image/png');
    assert.equal((await call(fileUrl, { token: sari })).status, 404);
  });

  test('dashboard bisa membuka lampiran bukti bayar; peran tanpa akses Transaksi ditolak', async () => {
    const orderId = (await call(`/tickets/${code}`, { token: budi })).body.lines[0].orderId;
    const proof = await adminCall(`/orders/${orderId}/proof`);
    assert.equal(proof.status, 200);
    assert.equal(proof.headers.get('content-type'), 'image/png');
    assert.match(proof.headers.get('content-disposition') ?? '', /^inline/);
    // Admin Acara tidak punya akses modul Transaksi.
    const acara = (await adminCall('/auth/login', { method: 'POST', body: { username: 'nur.aini', password: 'tkbj2026' } })).body.token;
    assert.equal((await adminCall(`/orders/${orderId}/proof`, { token: acara })).status, 403);
    // Bukti pada data contoh dashboard hanya nama berkas (tidak ada isinya).
    assert.equal((await adminCall('/orders/TK-1026-0121/proof')).status, 404);
  });

  test('admin memverifikasi → e-tiket aktif & notifikasi di aplikasi', async () => {
    const booking = (await call(`/tickets/${code}`, { token: budi })).body;
    for (const line of booking.lines) assert.equal((await adminCall(`/orders/${line.orderId}/verify`, { method: 'POST' })).status, 200);

    const notes = (await call('/notifications', { token: budi })).body;
    assert.equal(notes.items.filter((n: any) => n.title === 'Pembayaran tiket dikonfirmasi').length, 2);
    // Sinkronisasi kedua tidak membuat notifikasi ganda.
    const again = (await call('/notifications', { token: budi })).body;
    assert.equal(again.items.length, notes.items.length);

    const paid = (await call(`/tickets/${code}`, { token: budi })).body;
    assert.equal(paid.payment, 'Lunas');
    assert.equal(paid.method, 'QRIS');
    assert.deepEqual(paid.lines.find((l: any) => l.eventId === 'wayang').ticketCodes.length, 2);
  });

  test('admin menolak bukti → aplikasi diminta unggah ulang', async () => {
    assert.equal((await adminCall('/orders/TK-1026-0127/reject', { method: 'POST', body: { note: 'Nominal tidak sesuai.' } })).status, 200);
    const notes = (await call('/notifications', { token: budi })).body.items;
    const reupload = notes.find((n: any) => n.title === 'Bukti transfer perlu diunggah ulang');
    assert.match(reupload.body, /Nominal tidak sesuai/);
    assert.equal(reupload.targetId, 'TKBJ-A1B2C3');
    const res = await call('/tickets/TKBJ-A1B2C3/payment', { token: budi, form: proofForm({ method: 'Transfer bank', sender: 'Budi S' }) });
    assert.equal(res.status, 200);
    assert.equal(res.body.lines[0].note, undefined, 'catatan penolakan lama dihapus');
  });
});

describe('sewa gedung: aplikasi → dashboard → aplikasi', () => {
  let budi: string;
  let sari: string;
  let rentalId: string;

  before(async () => {
    budi = await login('budi.santoso@email.com');
    sari = await login('sari.wulandari@email.com');
  });

  test('kalender ketersediaan memperhitungkan acara, sewa, dan tanggal lewat', async () => {
    const res = await call('/rentals/availability?facilityId=pendopo&month=2026-10');
    assert.equal(res.status, 200);
    const day = (d: string) => res.body.days.find((x: any) => x.date === d).slots;
    assert.deepEqual(day('2026-10-01'), { morning: 'past', afternoon: 'past', evening: 'past' });
    assert.equal(day('2026-10-02').evening, 'full', 'Wayang Kulit 19.00–23.00');
    assert.deepEqual(day('2026-10-10'), { morning: 'available', afternoon: 'full', evening: 'full' }, 'sewa disetujui 15.00–21.00');
    assert.equal(day('2026-10-15').afternoon, 'full', 'sewa yang masih ditinjau ikut menahan jadwal');
    assert.equal((await call('/rentals/availability?facilityId=loket')).status, 404);
    assert.equal((await call('/rentals/availability?facilityId=pendopo&month=2026-13')).status, 400);
  });

  test('pengajuan memvalidasi kolom, berkas wajib, venue, dan jadwal bentrok', async () => {
    const fields = { facilityId: 'pendopo', date: '2026-10-20', slot: 'morning', activity: 'Pentas Tari Anak', applicant: 'Sanggar Budi', contact: '081234567890' };
    const missing = await call('/rentals', { token: budi, form: rentalForm({ ...fields, slot: 'subuh', contact: '123' }, ['ktp']) });
    assert.equal(missing.status, 400);
    assert.deepEqual(Object.keys(missing.body.fields).sort(), ['contact', 'proposal', 'slot', 'surat']);

    const loket = await call('/rentals', { token: budi, form: rentalForm({ ...fields, facilityId: 'loket' }) });
    assert.equal(loket.status, 400);
    const past = await call('/rentals', { token: budi, form: rentalForm({ ...fields, date: '2026-09-30' }) });
    assert.ok(past.body.fields.date);
    const clash = await call('/rentals', { token: budi, form: rentalForm({ ...fields, date: '2026-10-10', slot: 'evening' }) });
    assert.equal(clash.status, 409);
    assert.ok(clash.body.fields.slot);
    assert.equal(fs.readdirSync(config.uploadsDir).length, 2, 'berkas pengajuan yang gagal tidak tertinggal (hanya 2 bukti transfer)');

    const res = await call('/rentals', { token: budi, form: rentalForm(fields) });
    assert.equal(res.status, 201);
    rentalId = res.body.id;
    assert.equal(rentalId, 'SG-1026-0019');
    assert.equal(res.body.status, 'pending');
    assert.equal(res.body.slot, 'morning');
    assert.equal(res.body.amount, 2500000);
    assert.equal(res.body.documents.length, 3);

    const adminRental = (await adminCall(`/rentals/${rentalId}`)).body;
    assert.equal(adminRental.approval, 'Perlu ditinjau');
    assert.equal(adminRental.applicant, 'Sanggar Budi');
    assert.match(adminRental.file, /^proposal\.pdf · \d+ KB$/);

    const taken = await call('/rentals', { token: sari, form: rentalForm({ ...fields, applicant: 'Sanggar Sari' }) });
    assert.equal(taken.status, 409, 'slot yang sudah diajukan orang lain tidak bisa diambil');
  });

  test('pengajuan & dokumen milik orang lain → 404', async () => {
    assert.equal((await call(`/rentals/${rentalId}`, { token: sari })).status, 404);
    const doc = (await call(`/rentals/${rentalId}`, { token: budi })).body.documents[0];
    assert.equal((await call(doc.url.replace('/api', ''), { token: sari })).status, 404);
    assert.equal((await call(doc.url.replace('/api', ''), { token: budi })).status, 200);
  });

  test('Admin Sewa membuka KTP/surat/proposal pengajuan di dashboard', async () => {
    const sewa = (await adminCall('/auth/login', { method: 'POST', body: { username: 'rina.s', password: 'tkbj2026' } })).body.token;
    const docs = await adminCall(`/rentals/${rentalId}/documents`, { token: sewa });
    assert.equal(docs.status, 200);
    assert.deepEqual(docs.body.map((d: any) => d.kind).sort(), ['ktp', 'proposal', 'surat']);
    const file = await adminCall(docs.body[0].url, { token: sewa });
    assert.equal(file.status, 200);
    assert.equal(file.headers.get('content-type'), 'application/pdf');
    // Dokumen milik pengajuan lain tidak bisa dibuka lewat id pengajuan ini.
    assert.equal((await adminCall(`/rentals/SG-1026-0014/documents/${docs.body[0].id}`, { token: sewa })).status, 404);
  });

  test('bayar sebelum disetujui ditolak; setelah admin setuju → bayar → lunas', async () => {
    assert.equal((await call(`/rentals/${rentalId}/payment`, { token: budi, form: proofForm() })).status, 409);

    assert.equal((await adminCall(`/rentals/${rentalId}/approve`, { method: 'POST' })).status, 200);
    let notes = (await call('/notifications', { token: budi })).body.items;
    assert.ok(notes.some((n: any) => n.title === 'Pengajuan sewa disetujui' && n.targetId === rentalId));
    let rental = (await call(`/rentals/${rentalId}`, { token: budi })).body;
    assert.equal(rental.status, 'approved');
    assert.equal(rental.payment, 'Menunggu bayar');

    const paid = await call(`/rentals/${rentalId}/payment`, { token: budi, form: proofForm({ method: 'Virtual Account', sender: 'Sanggar Budi' }) });
    assert.equal(paid.status, 200);
    assert.equal(paid.body.statusLabel, 'Disetujui · Pembayaran Diverifikasi');

    assert.equal((await adminCall(`/orders/${rentalId}/verify`, { method: 'POST' })).status, 200);
    notes = (await call('/notifications', { token: budi })).body.items;
    assert.ok(notes.some((n: any) => n.title === 'Pembayaran sewa lunas'));
    rental = (await call(`/rentals/${rentalId}`, { token: budi })).body;
    assert.equal(rental.status, 'paid');
    assert.equal(rental.method, 'Virtual Account');
  });

  test('sewa ditolak admin → status & catatan muncul di aplikasi, jadwal dilepas', async () => {
    assert.equal((await adminCall('/rentals/SG-1026-0014/reject', { method: 'POST', body: { note: 'Bentrok agenda internal.' } })).status, 200);
    const notes = (await call('/notifications', { token: budi })).body.items;
    assert.match(notes.find((n: any) => n.title === 'Pengajuan sewa ditolak').body, /Bentrok agenda internal/);
    const rentals = (await call('/rentals', { token: budi })).body;
    assert.equal(rentals.find((r: any) => r.id === 'SG-1026-0014').status, 'rejected');
    const day = (await call('/rentals/availability?facilityId=panggung&month=2026-10')).body.days.find((d: any) => d.date === '2026-10-25');
    assert.equal(day.slots.afternoon, 'available');
  });
});

describe('komunitas & notifikasi', () => {
  let budi: string;
  let sari: string;

  before(async () => {
    budi = await login('budi.santoso@email.com');
    sari = await login('sari.wulandari@email.com');
  });

  test('pendaftaran komunitas → disetujui admin → tampil di direktori', async () => {
    const invalid = await call('/communities', { method: 'POST', token: sari, body: { name: 'Sa', category: 'Tari', description: 'pendek' } });
    assert.equal(invalid.status, 400);
    assert.ok(invalid.body.fields.category && invalid.body.fields.description && invalid.body.fields.address);

    const body = {
      name: 'Sanggar Reog Sari Budaya',
      category: 'Seni tari tradisional',
      leader: 'Sari Wulandari',
      phone: '085712345678',
      city: 'Kota Surabaya',
      address: 'Jl. Kenjeran No. 10, Surabaya',
      description: 'Komunitas reog dan jaranan untuk pelajar SMP dan SMA di Surabaya.',
      members: 30,
      foundedYear: 2018,
    };
    const res = await call('/communities', { method: 'POST', token: sari, body });
    assert.equal(res.status, 201);
    assert.equal(res.body.id, 'sanggar-reog-sari-budaya');
    assert.equal(res.body.status, 'Menunggu persetujuan');
    assert.equal((await call('/communities', { method: 'POST', token: sari, body })).status, 400, 'nama sama sedang ditinjau');
    assert.equal((await call(`/communities/${res.body.id}`)).status, 404);

    assert.equal((await adminCall(`/communities/${res.body.id}/approve`, { method: 'POST' })).status, 200);
    assert.equal((await call(`/communities/${res.body.id}`)).body.since, 'Berdiri 2018');
    const mine = (await call('/me/communities', { token: sari })).body;
    assert.equal(mine[0].status, 'Aktif');
    const notes = (await call('/notifications', { token: sari })).body.items;
    assert.ok(notes.some((n: any) => n.title === 'Komunitas disetujui'));
  });

  test('tandai dibaca hanya untuk notifikasi milik sendiri', async () => {
    const own = (await call('/notifications', { token: budi })).body;
    assert.ok(own.unread > 0);
    const sariNote = (await call('/notifications', { token: sari })).body.items[0];
    assert.equal((await call(`/notifications/${sariNote.id}/read`, { method: 'POST', token: budi })).status, 404);
    assert.equal((await call(`/notifications/${own.items[0].id}/read`, { method: 'POST', token: budi })).status, 204);
    assert.equal((await call('/notifications/read-all', { method: 'POST', token: budi })).status, 204);
    assert.equal((await call('/notifications', { token: budi })).body.unread, 0);
  });
});
