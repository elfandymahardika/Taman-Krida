import assert from 'node:assert/strict';
import fs from 'node:fs';
import { AddressInfo } from 'node:net';
import { Server } from 'node:http';
import { after, before, describe, test } from 'node:test';
import express from 'express';
import app from '../src/app';
import pool from '../src/config/db';
import { config } from '../src/config/env';
import prisma from '../src/lib/prisma';
import { recreateTestDatabase } from '../src/db/migrate';
import { runSeeders } from '../src/db/seeders/run';
import { authMiddleware } from '../src/middleware/authMiddleware';
import { errorHandler } from '../src/middleware/errorHandler';
import { rateLimit } from '../src/middleware/rateLimiter';
import { requireRole } from '../src/middleware/requireRole';

let server: Server;
let base: string;
const uploadsDir = config.uploadsDir;

/** Satu nilai dari query SQL murni (untuk memeriksa isi database langsung). */
const queryOne = async (sql: string, params: (string | number)[]) => ((await pool.execute(sql, params))[0] as any[])[0];

before(async () => {
  await recreateTestDatabase();
  await runSeeders();
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://localhost:${(server.address() as AddressInfo).port}/api`;
});

after(async () => {
  server.close();
  await pool.end();
  await prisma.$disconnect();
  fs.rmSync(uploadsDir, { recursive: true, force: true });
});

interface CallOptions {
  token?: string;
  method?: string;
  body?: unknown;
  raw?: Buffer;
  type?: string;
}

async function call(path: string, { token, method = 'GET', body, raw, type }: CallOptions = {}): Promise<{ status: number; body: any }> {
  const res = await fetch(base + path, {
    method,
    headers: {
      'content-type': type ?? 'application/json',
      ...(token && { authorization: `Bearer ${token}` }),
    },
    body: raw ? new Uint8Array(raw) : body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  return { status: res.status, body: text && res.headers.get('content-type')?.includes('json') ? JSON.parse(text) : text }
}

const login = async (username: string, password: string): Promise<string> => (await call('/auth/login', { method: 'POST', body: { username, password } })).body.token

describe('auth', () => {
  test('menolak password salah dan input tidak valid', async () => {
    assert.equal((await call('/auth/login', { method: 'POST', body: { username: 'admin', password: 'salah123' } })).status, 401)
    const invalid = await call('/auth/login', { method: 'POST', body: { username: '', password: '1' } })
    assert.equal(invalid.status, 400)
    assert.ok(invalid.body.fields.username && invalid.body.fields.password)
  })

  test('rute data wajib login', async () => {
    assert.equal((await call('/events')).status, 401)
    assert.equal((await call('/events', { token: 'bukan-token' })).status, 401)
  })

  test('login berhasil mengembalikan token dan profil', async () => {
    const res = await call('/auth/login', { method: 'POST', body: { username: 'Admin', password: 'admin123' } })
    assert.equal(res.status, 200)
    assert.equal(res.body.user.roleKey, 'admin')
    const me = await call('/auth/me', { token: res.body.token })
    assert.equal(me.body.user.username, 'admin')
  })
})

describe('registrasi, logout & hashing', () => {
  const form = { name: 'Rizky Maulana', username: 'rizky.m', email: 'rizky.m@email.com', password: 'Rahasia123', confirm: 'Rahasia123' }

  test('validasi registrasi', async () => {
    const bad = await call('/auth/register', { method: 'POST', body: { name: 'A', username: 'Bukan Valid!', email: 'x', password: 'pendek', confirm: '' } })
    assert.equal(bad.status, 400)
    assert.deepEqual(Object.keys(bad.body.fields).sort(), ['email', 'name', 'password', 'username'])
    // Kekuatan password (lib/validatePassword.ts): huruf besar, huruf kecil, dan angka.
    const noDigit = await call('/auth/register', { method: 'POST', body: { ...form, password: 'HanyaHuruf', confirm: 'HanyaHuruf' } })
    assert.match(noDigit.body.fields.password, /angka/)
    const noUpper = await call('/auth/register', { method: 'POST', body: { ...form, password: 'rahasia123', confirm: 'rahasia123' } })
    assert.match(noUpper.body.fields.password, /huruf besar/)
    const noLower = await call('/auth/register', { method: 'POST', body: { ...form, password: 'RAHASIA123', confirm: 'RAHASIA123' } })
    assert.match(noLower.body.fields.password, /huruf kecil/)
    const notString = await call('/auth/register', { method: 'POST', body: { ...form, email: ['a@b.co'], password: 12345678 } })
    assert.ok(notString.body.fields.email && notString.body.fields.password, 'tipe selain string ditolak')
    const mismatch = await call('/auth/register', { method: 'POST', body: { ...form, confirm: 'beda12345' } })
    assert.ok(mismatch.body.fields.confirm)
    const taken = await call('/auth/register', { method: 'POST', body: { ...form, username: 'admin', email: 'admin.pusat@tkbj.jatimprov.go.id' } })
    assert.ok(taken.body.fields.username && taken.body.fields.email)
  })

  test('akun baru menunggu persetujuan, lalu bisa login setelah disetujui', async () => {
    const reg = await call('/auth/register', { method: 'POST', body: form })
    assert.equal(reg.status, 201)
    assert.equal(reg.body.user.status, 'Menunggu persetujuan')
    assert.equal(reg.body.user.roleKey, null)
    assert.equal(reg.body.token, undefined)

    // Password tersimpan sebagai hash bcrypt, bukan teks asli.
    const { password_hash } = await queryOne('SELECT password_hash FROM users WHERE username = ?', ['rizky.m'])
    assert.match(password_hash, /^\$2[aby]\$10\$/)
    assert.ok(!password_hash.includes(form.password))

    const pending = await call('/auth/login', { method: 'POST', body: { username: 'rizky.m', password: form.password } })
    assert.equal(pending.status, 403)
    assert.match(pending.body.error, /menunggu persetujuan/)

    const admin = await login('admin', 'admin123')
    const id = reg.body.user.id
    assert.equal((await call(`/users/${id}/approve`, { token: admin, method: 'POST', body: { roleKey: 'admin' } })).status, 400)
    const approved = await call(`/users/${id}/approve`, { token: admin, method: 'POST', body: { roleKey: 'konten' } })
    assert.equal(approved.body.status, 'Aktif')
    const ok = await call('/auth/login', { method: 'POST', body: { username: 'rizky.m', password: form.password } })
    assert.equal(ok.status, 200)
    assert.equal(ok.body.user.role, 'Admin Konten')
    assert.deepEqual(ok.body.user.access, { events: 'p', rentals: 'n', payments: 'n', info: 'y', admin: 'n' })
  })

  test('pendaftaran yang ditolak tidak bisa login', async () => {
    const reg = await call('/auth/register', { method: 'POST', body: { ...form, username: 'ditolak.x', email: 'ditolak@email.com' } })
    const admin = await login('admin', 'admin123')
    assert.equal((await call(`/users/${reg.body.user.id}/reject`, { token: admin, method: 'POST' })).body.status, 'Ditolak')
    const res = await call('/auth/login', { method: 'POST', body: { username: 'ditolak.x', password: form.password } })
    assert.equal(res.status, 403)
  })

  test('logout mencabut token di server', async () => {
    const token = await login('admin', 'admin123')
    const other = await login('admin', 'admin123')
    assert.equal((await call('/auth/me', { token })).status, 200)
    assert.equal((await call('/auth/logout', { token, method: 'POST' })).status, 204)
    assert.equal((await call('/auth/me', { token })).status, 401)
    assert.equal((await call('/events', { token })).status, 401)
    // Sesi lain milik akun yang sama tetap berlaku.
    assert.equal((await call('/auth/me', { token: other })).status, 200)
  })

  test('hash lama (scrypt) tetap bisa login lalu diganti bcrypt', async () => {
    const { scryptSync, randomBytes } = await import('node:crypto')
    const salt = randomBytes(16)
    const legacy = `scrypt$${salt.toString('hex')}$${scryptSync('tkbj2026', salt, 64).toString('hex')}`
    await pool.execute('UPDATE users SET password_hash = ? WHERE username = ?', [legacy, 'siti.rahma'])
    assert.equal((await call('/auth/login', { method: 'POST', body: { username: 'siti.rahma', password: 'tkbj2026' } })).status, 200)
    assert.match((await queryOne('SELECT password_hash FROM users WHERE username = ?', ['siti.rahma'])).password_hash, /^\$2/)
  })
})

describe('otorisasi (RBAC) per peran', () => {
  test('modul tanpa akses ditolak 403, modul lihat-saja boleh dibaca tapi tidak diubah', async () => {
    const konten = await login('siti.rahma', 'tkbj2026') // pnnyn
    assert.equal((await call('/orders', { token: konten })).status, 403)
    assert.equal((await call('/rentals', { token: konten })).status, 403)
    assert.equal((await call('/finance/monthly', { token: konten })).status, 403)
    assert.equal((await call('/users', { token: konten })).status, 403)
    assert.equal((await call('/settings', { token: konten })).status, 403)
    assert.equal((await call('/contents', { token: konten })).status, 200)
    assert.equal((await call('/events', { token: konten })).status, 200)
    assert.equal((await call('/events/reset', { token: konten, method: 'POST' })).status, 403)

    const keuangan = await login('keuangan', 'keuangan123') // ppynn
    assert.equal((await call('/media', { token: keuangan })).status, 403)
    assert.equal((await call('/profile', { token: keuangan })).status, 403)
    assert.equal((await call('/orders', { token: keuangan })).status, 200)

    // Admin Acara tidak boleh membuka Transaksi, tetapi boleh melihat pesanan tiket di halaman Tiket.
    const acara = await login('nur.aini', 'tkbj2026') // ypnpn
    assert.equal((await call('/orders', { token: acara })).status, 403)
    assert.equal((await call('/orders?type=Tiket', { token: acara })).status, 200)
    assert.equal((await call('/orders/export.csv', { token: acara })).status, 403)
  })

  test('dashboard, pencarian, notifikasi, dan aktivitas disaring per peran', async () => {
    const acara = await login('nur.aini', 'tkbj2026')
    const summary = (await call('/dashboard/summary', { token: acara })).body
    assert.equal(summary.metrics.revenue, null)
    assert.deepEqual(summary.tasks.map((t) => t.key), ['rentals', 'communities'])
    const search = (await call('/search?q=TK-', { token: acara })).body
    assert.ok(!search.results.some((r) => r.type === 'Transaksi'))
    const notifs = (await call('/notifications', { token: acara })).body
    assert.ok(notifs.items.every((n) => !['/transaksi', '/pengguna', '/pengaturan'].includes(n.link)))
    const activity = (await call('/activity?limit=50', { token: acara })).body
    assert.ok(activity.items.every((a) => !['payment', 'user'].includes(a.kind)))

    const admin = await login('admin', 'admin123')
    const full = (await call('/dashboard/summary', { token: admin })).body
    assert.ok(full.metrics.revenue)
    assert.ok(full.tasks.some((t) => t.key === 'staff' && t.count >= 1))
  })
})

describe('acara', () => {
  test('CRUD dan validasi', async () => {
    const token = await login('admin', 'admin123')
    const bad = await call('/events', { token, method: 'POST', body: { name: 'Ab', organizer: '', date: '2026-10-15', start: '20:00', end: '19:00', venue: 'X' } })
    assert.equal(bad.status, 400)
    assert.deepEqual(Object.keys(bad.body.fields).sort(), ['end', 'name', 'organizer', 'venue'])

    const body = { name: 'Uji Coba Gamelan', organizer: 'Tim Uji', date: '2026-10-15', start: '19:00', end: '21:00', venue: 'Panggung Terbuka', quota: '120' }
    const created = await call('/events', { token, method: 'POST', body })
    assert.equal(created.status, 201)
    assert.equal(created.body.quota, 120)
    assert.equal(created.body.sold, 0)

    const dup = await call('/events', { token, method: 'POST', body })
    assert.equal(dup.status, 400)
    assert.match(dup.body.fields.name, /sudah ada/)

    const published = await call(`/events/${created.body.id}`, { token, method: 'PATCH', body: { status: 'Terpublikasi' } })
    assert.equal(published.body.status, 'Terpublikasi')

    assert.equal((await call(`/events/${created.body.id}`, { token, method: 'DELETE' })).status, 204)
    assert.equal((await call(`/events/${created.body.id}`, { token })).status, 404)
  })

  test('kuota tidak boleh di bawah tiket terjual; acara berpesanan tidak bisa dihapus', async () => {
    const token = await login('admin', 'admin123')
    const res = await call('/events/wayang', { token, method: 'PATCH', body: { quota: 100 } })
    assert.equal(res.status, 400)
    assert.match(res.body.fields.quota, /210/)
    assert.equal((await call('/events/wayang', { token, method: 'DELETE' })).status, 409)
  })

  test('admin keuangan tidak boleh mengubah acara', async () => {
    const token = await login('keuangan', 'keuangan123')
    const res = await call('/events/festival', { token, method: 'PATCH', body: { status: 'Terpublikasi' } })
    assert.equal(res.status, 403)
  })
})

describe('pembayaran', () => {
  test('verifikasi menambah tiket terjual, rekap keuangan, dan log aktivitas', async () => {
    const token = await login('keuangan', 'keuangan123')
    const before = (await call('/events/topeng', { token })).body.sold
    const financeBefore = (await call('/finance/monthly', { token })).body.months.at(-1).sales.tiket

    const res = await call('/orders/TK-1026-0127/verify', { token, method: 'POST', body: { note: 'Sesuai' } })
    assert.equal(res.status, 200)
    assert.equal(res.body.payment, 'Lunas')
    assert.deepEqual(res.body.ticket.codes, ['TK-0127-A', 'TK-0127-B', 'TK-0127-C', 'TK-0127-D'])

    assert.equal((await call('/events/topeng', { token })).body.sold, before + 4)
    assert.equal((await call('/finance/monthly', { token })).body.months.at(-1).sales.tiket, Math.round((financeBefore + 0.2) * 10) / 10)
    const activity = await call('/activity?limit=1', { token })
    assert.equal(activity.body.items[0].title, 'Pembayaran tiket dikonfirmasi')

    assert.equal((await call('/orders/TK-1026-0127/verify', { token, method: 'POST' })).status, 409)
  })

  test('catat pembayaran manual memvalidasi nominal', async () => {
    const token = await login('admin', 'admin123')
    const wrong = await call('/orders/TK-1026-0124/payment', { token, method: 'POST', body: { amount: 5000, method: 'QRIS' } })
    assert.equal(wrong.status, 400)
    assert.ok(wrong.body.fields.nominal)
    const missing = await call('/orders/TK-9999/payment', { token, method: 'POST', body: { amount: 5000 } })
    assert.ok(missing.body.fields.nomor)
    const ok = await call('/orders/TK-1026-0124/payment', { token, method: 'POST', body: { amount: 100000, method: 'Tunai di loket' } })
    assert.equal(ok.body.payment, 'Lunas')
    assert.equal(ok.body.method, 'Tunai di loket')
  })
})

describe('sewa gedung', () => {
  test('menyetujui permintaan membuat tagihan; jadwal bentrok ditolak', async () => {
    const token = await login('admin', 'admin123')
    const approved = await call('/rentals/SG-1026-0016/approve', { token, method: 'POST' })
    assert.equal(approved.body.approval, 'Disetujui')
    assert.equal(approved.body.payment, 'Menunggu bayar')

    const clash = await call('/rentals', {
      token,
      method: 'POST',
      body: { applicant: 'Sanggar Uji', venue: 'Pendopo Agung TKBJ', date: '2026-10-02', start: '20:00', end: '22:00' },
    })
    assert.equal(clash.status, 409)
    assert.match(clash.body.fields.date, /Wayang Kulit/)

    const created = await call('/rentals', {
      token,
      method: 'POST',
      body: { applicant: 'Sanggar Uji', venue: 'Pendopo Agung TKBJ', date: '2026-10-20', start: '09:00', end: '12:00' },
    })
    assert.equal(created.status, 201)
    assert.match(created.body.id, /^SG-1026-\d{4}$/)
  })
})

describe('profil & fasilitas', () => {
  test('validasi, simpan, dan hak akses', async () => {
    const token = await login('admin', 'admin123')
    const { profile } = (await call('/profile', { token })).body
    const bad = await call('/profile', { token, method: 'PUT', body: { ...profile, phone: 'abc', about: 'pendek' } })
    assert.equal(bad.status, 400)
    assert.ok(bad.body.fields.phone && bad.body.fields.about)
    const ok = await call('/profile', { token, method: 'PUT', body: { ...profile, hours: 'Senin–Minggu · 08.00–21.00 WIB' } })
    assert.equal(ok.body.profile.hours, 'Senin–Minggu · 08.00–21.00 WIB')
    assert.equal(ok.body.updatedBy, 'Admin Pusat')

    const finance = await login('keuangan', 'keuangan123')
    assert.equal((await call('/profile', { token: finance, method: 'PUT', body: profile })).status, 403)
  })

  test('nama fasilitas yang dipakai acara dikunci; area baru bisa ditambah', async () => {
    const token = await login('admin', 'admin123')
    const rename = await call('/facilities/pendopo', { token, method: 'PUT', body: { name: 'Pendopo Baru', capacity: 300, purpose: 'Pertunjukan' } })
    assert.match(rename.body.fields.name, /tidak dapat diubah/)
    const capacity = await call('/facilities/pendopo', { token, method: 'PUT', body: { name: 'Pendopo Agung TKBJ', capacity: 350, purpose: 'Pertunjukan tradisi' } })
    assert.equal(capacity.body.capacity, 350)
    const created = await call('/facilities', { token, method: 'POST', body: { name: 'Ruang Latihan Tari', capacity: '40', purpose: 'Latihan sanggar' } })
    assert.equal(created.status, 201)
    assert.equal(created.body.bookable, false)
  })
})

describe('galeri', () => {
  const PNG = Buffer.from('89504e470d0a1a0a0000000d4948445200000001000000010806000000', 'hex')

  test('unggah berkas, sajikan, terbitkan, hapus', async () => {
    const token = await login('admin', 'admin123')
    const wrong = await call('/media?name=x.pdf&collection=Uji', { token, method: 'POST', raw: Buffer.from('%PDF'), type: 'application/pdf' })
    assert.equal(wrong.status, 415)

    const up = await call('/media?name=pentas-ludruk.png&collection=Pertunjukan%20Oktober', { token, method: 'POST', raw: PNG, type: 'image/png' })
    assert.equal(up.status, 201)
    assert.equal(up.body.title, 'pentas ludruk')
    assert.equal(up.body.status, 'Draf')
    assert.equal(up.body.bytes, PNG.length)
    const served = await fetch(base.replace('/api', '') + up.body.url)
    assert.equal(served.status, 200)

    const published = await call(`/media/${up.body.id}`, { token, method: 'PATCH', body: { status: 'Terpublikasi' } })
    assert.equal(published.body.status, 'Terpublikasi')
    const meta = await call(`/media/${up.body.id}`, { token, method: 'PUT', body: { title: 'Ludruk', collection: 'Baru', description: '', credit: 'Tim', date: 'kemarin' } })
    assert.ok(meta.body.fields.date)

    assert.equal((await call(`/media/${up.body.id}`, { token, method: 'DELETE' })).status, 204)
    assert.equal(fs.readdirSync(uploadsDir).length, 0)
  })
})

describe('konten', () => {
  test('tambah konten dan banner beranda', async () => {
    const token = await login('admin', 'admin123')
    const created = await call('/contents', { token, method: 'POST', body: { title: 'Pentas baru pekan depan', type: 'Berita' } })
    assert.equal(created.body.status, 'Draf')
    assert.equal(created.body.author, 'Admin Pusat')
    const hero = (await call('/contents', { token })).body.find((c) => c.isHero)
    const noCta = await call(`/contents/${hero.id}`, { token, method: 'PUT', body: { cta: '', status: 'Terpublikasi' } })
    assert.ok(noCta.body.fields.cta)
    const badLink = await call(`/contents/${hero.id}`, { token, method: 'PUT', body: { link: 'agenda' } })
    assert.ok(badLink.body.fields.link)
    const ok = await call(`/contents/${hero.id}`, { token, method: 'PUT', body: { title: 'Pekan Ketoprak di TKBJ', status: 'Terjadwal' } })
    assert.equal(ok.body.title, 'Pekan Ketoprak di TKBJ')
    assert.equal(ok.body.status, 'Terjadwal')
  })
})

describe('pengguna & peran', () => {
  test('peran menentukan hak akses; akun nonaktif langsung ditolak', async () => {
    const admin = await login('admin', 'admin123')
    const staff = (await call('/users', { token: admin })).body
    const bayu = staff.find((s) => s.username === 'bayu.k')
    const nur = staff.find((s) => s.username === 'nur.aini')

    // Admin Acara belum boleh mengubah profil; setelah jadi Admin Konten boleh.
    const bayuToken = await login('bayu.k', 'tkbj2026')
    const { profile } = (await call('/profile', { token: bayuToken })).body
    assert.equal((await call('/profile', { token: bayuToken, method: 'PUT', body: profile })).status, 403)
    await call(`/users/${bayu.id}`, { token: admin, method: 'PATCH', body: { roleKey: 'konten' } })
    assert.equal((await call('/profile', { token: bayuToken, method: 'PUT', body: profile })).status, 200)

    const nurToken = await login('nur.aini', 'tkbj2026')
    await call(`/users/${nur.id}`, { token: admin, method: 'PATCH', body: { status: 'Nonaktif' } })
    assert.equal((await call('/events', { token: nurToken })).status, 401)
    assert.equal((await call('/auth/login', { method: 'POST', body: { username: 'nur.aini', password: 'tkbj2026' } })).status, 403)

    const self = staff.find((s) => s.username === 'admin')
    assert.equal((await call(`/users/${self.id}`, { token: admin, method: 'PATCH', body: { status: 'Nonaktif' } })).status, 409)
  })

  test('undang staf', async () => {
    const admin = await login('admin', 'admin123')
    const dup = await call('/users', { token: admin, method: 'POST', body: { name: 'Siti', email: 'siti.rahma@tkbj.jatimprov.go.id', roleKey: 'konten' } })
    assert.ok(dup.body.fields.email)
    const invited = await call('/users', { token: admin, method: 'POST', body: { name: 'Dian Puspita', email: 'dian.p@tkbj.jatimprov.go.id', roleKey: 'sewa' } })
    assert.equal(invited.status, 201)
    assert.equal(invited.body.status, 'Undangan')
    assert.equal(invited.body.initials, 'DP')
    const roles = (await call('/users/roles', { token: admin })).body
    assert.equal(roles.roles.find((r) => r.key === 'sewa').staff, 3) // wahyu.h, rina.s, + undangan baru
  })
})

describe('pengaturan', () => {
  test('sakelar notifikasi, durasi sesi, dan batas percobaan login berlaku', async () => {
    const admin = await login('admin', 'admin123')
    const { settings } = (await call('/settings', { token: admin })).body
    const bad = await call('/settings', { token: admin, method: 'PUT', body: { ...settings, email: 'bukan-email', maxTickets: '0' } })
    assert.ok(bad.body.fields.email && bad.body.fields.maxTickets)

    await call('/settings', { token: admin, method: 'PUT', body: { ...settings, notifyPayment: false, session: '30 menit', attempts: '3 kali' } })
    const before = (await call('/notifications', { token: admin })).body.items.length
    await call('/orders/TK-1026-0125/verify', { token: admin, method: 'POST' })
    assert.equal((await call('/notifications', { token: admin })).body.items.length, before)

    const fresh = await call('/auth/login', { method: 'POST', body: { username: 'lestari.ayu', password: 'tkbj2026' } })
    assert.equal(fresh.body.expiresIn, '30m')
    for (let i = 0; i < 3; i++) await call('/auth/login', { method: 'POST', body: { username: 'lestari.ayu', password: 'salah-123' } })
    assert.equal((await call('/auth/login', { method: 'POST', body: { username: 'lestari.ayu', password: 'tkbj2026' } })).status, 429)

    const reset = await call('/settings/reset', { token: admin, method: 'POST' })
    assert.equal(reset.body.settings.attempts, '5 kali')
  })
})

describe('dashboard', () => {
  test('ringkasan periode dan pencarian', async () => {
    const token = await login('admin', 'admin123')
    const oct = await call('/dashboard/summary?period=2026-10', { token })
    assert.equal(oct.status, 200)
    assert.equal(oct.body.metrics.events.total, 12)
    assert.equal(oct.body.previous.key, '2026-09')
    assert.equal(oct.body.previousMetrics.events.total, 4)
    assert.equal((await call('/dashboard/summary?period=abc', { token })).status, 400)

    const search = await call('/search?q=wayang', { token })
    assert.ok(search.body.results.some((r) => r.type === 'Acara'))

    const page1 = await call('/activity?limit=3', { token })
    const page2 = await call(`/activity?limit=3&before=${page1.body.nextCursor}`, { token })
    assert.ok(page2.body.items.every((a) => a.id < page1.body.items.at(-1).id))
  })
})

// Memakai akun rina.s: rina.aini sudah dinonaktifkan oleh tes "pengguna & peran" di atas.
describe('catatan staf (Modul 02)', () => {
  test('validasi server menolak data tidak valid walau validasi klien dilewati', async () => {
    const token = await login('rina.s', 'tkbj2026')
    const bad = await call('/notes', { token, method: 'POST', body: { title: 'ab', content: 'x'.repeat(501), status: 'Rahasia' } })
    assert.equal(bad.status, 400)
    assert.deepEqual(Object.keys(bad.body.fields).sort(), ['content', 'status', 'title'])
    assert.equal((await call('/notes', { method: 'POST', body: { title: 'Tanpa login' } })).status, 401)
  })

  test('isolasi data: staf hanya melihat & mengubah catatannya sendiri (anti-IDOR)', async () => {
    const rina = await login('rina.s', 'tkbj2026')
    const siti = await login('siti.rahma', 'tkbj2026')
    // userId di body diabaikan: pemilik selalu diambil dari token.
    const created = await call('/notes', { token: rina, method: 'POST', body: { title: 'Catatan rahasia Rina', userId: 1 } })
    assert.equal(created.status, 201)
    const rinaId = (await call('/auth/me', { token: rina })).body.user.id
    assert.equal(created.body.userId, rinaId)
    assert.equal(created.body.status, 'Draf')

    const sitiNotes = (await call('/notes', { token: siti })).body
    assert.ok(sitiNotes.every((n: any) => n.userId !== rinaId))
    assert.equal((await call(`/notes/${created.body.id}`, { token: siti, method: 'PUT', body: { title: 'Dibajak' } })).status, 404)
    assert.equal((await call(`/notes/${created.body.id}`, { token: siti, method: 'DELETE' })).status, 404)

    const edited = await call(`/notes/${created.body.id}`, { token: rina, method: 'PUT', body: { title: 'Catatan Rina (revisi)', status: 'Terpublikasi' } })
    assert.equal(edited.body.title, 'Catatan Rina (revisi)')
    assert.equal((await call(`/notes/${created.body.id}`, { token: rina, method: 'DELETE' })).status, 204)
  })

  test('arsipkan = aksi khusus Administrator utama; admin bisa supervisi semua catatan', async () => {
    const rina = await login('rina.s', 'tkbj2026')
    const admin = await login('admin', 'admin123')
    const note = (await call('/notes', { token: rina, method: 'POST', body: { title: 'Catatan untuk dimoderasi' } })).body
    const forbidden = await call(`/notes/${note.id}/archive`, { token: rina, method: 'PATCH' })
    assert.equal(forbidden.status, 403)
    assert.match(forbidden.body.error, /FORBIDDEN/)

    const all = (await call('/notes?scope=all', { token: admin })).body
    assert.ok(all.some((n: any) => n.id === note.id && n.owner === 'Rina Sari'))
    const archived = await call(`/notes/${note.id}/archive`, { token: admin, method: 'PATCH' })
    assert.equal(archived.body.status, 'Diarsipkan')
  })
})

describe('Pertemuan 11: File Upload & Cloud Storage (Modul 03)', () => {
  const PDF = Buffer.from('%PDF-1.4\n%uji\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF')
  const JPG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46])

  async function uploadFile(token: string | undefined, file: Buffer, name: string, type: string) {
    const form = new FormData()
    form.append('file', new Blob([new Uint8Array(file)], { type }), name)
    const res = await fetch(`${base}/upload`, { method: 'POST', body: form, headers: token ? { authorization: `Bearer ${token}` } : {} })
    return { status: res.status, body: (await res.json()) as any }
  }

  test('P11-1: menolak upload tanpa autentikasi (401)', async () => {
    assert.equal((await uploadFile(undefined, PDF, 'laporan.pdf', 'application/pdf')).status, 401)
  })

  test('P11-2: berhasil mengunggah PDF & JPG < 5 MB (201) dan file fisik tersimpan', async () => {
    const token = await login('rina.s', 'tkbj2026')
    const pdf = await uploadFile(token, PDF, 'laporan akhir.pdf', 'application/pdf')
    assert.equal(pdf.status, 201)
    assert.equal(pdf.body.data.name, 'laporan akhir.pdf')
    assert.equal(pdf.body.data.fileType, 'application/pdf')
    assert.match(pdf.body.data.url, /^\/uploads\/\d+-[0-9a-f]{8}-laporan_akhir\.pdf$/)
    assert.equal(pdf.body.data.fileKey, undefined)
    const served = await fetch(base.replace('/api', '') + pdf.body.data.url)
    assert.equal(served.status, 200)
    assert.equal(served.headers.get('content-type'), 'application/pdf')
    assert.equal((await uploadFile(token, JPG, 'foto.jpg', 'image/jpeg')).status, 201)
  })

  test('P11-3: menolak tipe file tidak sah (400), termasuk .exe yang mengaku gambar', async () => {
    const token = await login('rina.s', 'tkbj2026')
    const html = await uploadFile(token, Buffer.from('<script>alert(1)</script>'), 'x.html', 'text/html')
    assert.equal(html.status, 400)
    assert.match(html.body.error, /Tipe file tidak diizinkan/)
    const fake = await uploadFile(token, Buffer.from('MZ\x90\x00 bukan gambar'), 'virus.png', 'image/png')
    assert.equal(fake.status, 400)
  })

  test('P11-4: menolak file > 5 MB (400 LIMIT_FILE_SIZE)', async () => {
    const token = await login('rina.s', 'tkbj2026')
    const big = Buffer.concat([PDF, Buffer.alloc(6 * 1024 * 1024)])
    const res = await uploadFile(token, big, 'besar.pdf', 'application/pdf')
    assert.equal(res.status, 400)
    assert.match(res.body.error, /5 MB/)
  })

  test('P11-5 & P11-6: anti-IDOR hapus (404) dan pemilik sah menghapus file fisik (200)', async () => {
    const rina = await login('rina.s', 'tkbj2026')
    const siti = await login('siti.rahma', 'tkbj2026')
    const up = await uploadFile(rina, PDF, 'surat tugas.pdf', 'application/pdf')
    const fileName = up.body.data.url.split('/').pop()
    assert.ok(fs.existsSync(`${uploadsDir}/${fileName}`))

    // Siti tidak melihat dan tidak bisa menghapus dokumen Rina.
    const sitiList = (await call('/upload/list', { token: siti })).body.data
    assert.ok(!sitiList.some((d: any) => d.id === up.body.data.id))
    assert.equal((await call(`/upload/${up.body.data.id}`, { token: siti, method: 'DELETE' })).status, 404)
    assert.ok(fs.existsSync(`${uploadsDir}/${fileName}`))

    const rinaList = (await call('/upload/list', { token: rina })).body
    assert.ok(rinaList.data.some((d: any) => d.id === up.body.data.id))
    assert.equal(rinaList.limits.maxFileSize, 5 * 1024 * 1024)

    assert.equal((await call(`/upload/${up.body.data.id}`, { token: rina, method: 'DELETE' })).status, 200)
    assert.ok(!fs.existsSync(`${uploadsDir}/${fileName}`))
    assert.equal((await fetch(base.replace('/api', '') + up.body.data.url)).status, 404)
    assert.ok(!(await call('/upload/list', { token: rina })).body.data.some((d: any) => d.id === up.body.data.id))
  })

  test('admin boleh melihat & menghapus dokumen staf mana pun (moderasi)', async () => {
    const rina = await login('rina.s', 'tkbj2026')
    const admin = await login('admin', 'admin123')
    const up = await uploadFile(rina, JPG, 'foto panggung.jpg', 'image/jpeg')
    const all = (await call('/upload/list', { token: admin })).body.data
    assert.ok(all.some((d: any) => d.id === up.body.data.id && d.owner === 'Rina Sari'))
    assert.equal((await call(`/upload/${up.body.data.id}`, { token: admin, method: 'DELETE' })).status, 200)
  })
})

describe('CHECK POINT 11: middleware auth, peran, dan pembatas', () => {
  /** Server Express kecil untuk menguji satu middleware secara terpisah. */
  const mini = async (setup: (a: express.Express) => void) => {
    const a = express()
    setup(a)
    a.use(errorHandler)
    const s = a.listen(0)
    await new Promise((r) => s.once('listening', r))
    after(() => s.close())
    return `http://localhost:${(s.address() as AddressInfo).port}`
  }

  test('rateLimiter: permintaan ke-(max+1) ditolak 429 + Retry-After', async () => {
    const url = await mini((a) => a.get('/x', rateLimit({ windowMs: 60_000, max: 2, message: 'Terlalu sering.' }), (_q, r) => r.json({ ok: true })))
    assert.equal((await fetch(`${url}/x`)).status, 200)
    assert.equal((await fetch(`${url}/x`)).status, 200)
    const blocked = await fetch(`${url}/x`)
    assert.equal(blocked.status, 429)
    assert.ok(Number(blocked.headers.get('retry-after')) > 0)
    assert.match((await blocked.json()).error, /Terlalu sering/)
  })

  test('rateLimiter skipSuccessful: hanya permintaan gagal yang dihitung (login benar tidak membuat terkunci)', async () => {
    const url = await mini((a) =>
      a.get('/login/:ok', rateLimit({ windowMs: 60_000, max: 2, skipSuccessful: true, message: 'Terlalu sering.' }), (q, r) => {
        r.status(q.params.ok === '1' ? 200 : 401).json({})
      }),
    )
    for (let i = 0; i < 5; i++) assert.equal((await fetch(`${url}/login/1`)).status, 200)
    assert.equal((await fetch(`${url}/login/0`)).status, 401)
    assert.equal((await fetch(`${url}/login/0`)).status, 401)
    assert.equal((await fetch(`${url}/login/0`)).status, 429)
  })

  test('authMiddleware memasang req.user; requireRole membaca peran dari token, bukan dari klien', async () => {
    const url = await mini((a) => a.get('/admin-saja', authMiddleware, requireRole('admin'), (q, r) => r.json(q.user)))
    const asAdmin = await fetch(`${url}/admin-saja?role=admin`, { headers: { authorization: `Bearer ${await login('admin', 'admin123')}` } })
    assert.equal(asAdmin.status, 200)
    const user = await asAdmin.json()
    assert.equal(user.username, 'admin')
    assert.equal(user.role, 'admin')
    assert.ok(user.sessionId)
    const asKonten = await fetch(`${url}/admin-saja?role=admin`, { headers: { authorization: `Bearer ${await login('siti.rahma', 'tkbj2026')}` } })
    assert.equal(asKonten.status, 403)
    assert.equal((await fetch(`${url}/admin-saja`)).status, 401)
  })

  test('route Pengguna & Pengaturan khusus Administrator utama (requireRole)', async () => {
    const keuangan = await login('keuangan', 'keuangan123')
    assert.equal((await call('/users', { token: keuangan })).status, 403)
    assert.equal((await call('/settings', { token: keuangan })).status, 403)
    assert.equal((await call('/users', { token: await login('admin', 'admin123') })).status, 200)
  })

  test('Prisma: skema & migration sudah diterapkan di database test', async () => {
    const migrations = await prisma.$queryRaw<{ migration_name: string }[]>`SELECT migration_name FROM _prisma_migrations ORDER BY migration_name`
    assert.deepEqual(migrations.map((m) => m.migration_name), ['0_init', '1_blob_file_urls'])
    assert.equal(await prisma.user.count(), (await call('/users', { token: await login('admin', 'admin123') })).body.length)
  })
})
