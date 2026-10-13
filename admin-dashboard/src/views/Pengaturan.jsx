'use client'

import { useState } from 'react'
import { RotateCcw, Save } from 'lucide-react'
import { Card, DetailRow, Field, Note, PageFooter, PageHeader, Period, ToggleRow } from '../components/ui'
import { useOverlay } from '../components/overlay'

const DEFAULTS = {
  serviceName: 'Panel Administrator TKBJ',
  language: 'Bahasa Indonesia',
  timezone: 'WIB (UTC+7)',
  email: 'notifikasi@tkbj.jatimprov.go.id',
  notifyPayment: true,
  notifyRental: true,
  notifyCommunity: true,
  dailySummary: false,
  maxTickets: '10',
  payDeadline: '24 jam',
  cancelPolicy: 'Pembatalan paling lambat H-3 acara, dana kembali 50%.',
  autoIssue: true,
  waitlist: false,
  method: 'Transfer bank & QRIS',
  bank: 'Bank Jatim',
  account: '0011 2233 4455 (contoh)',
  requireProof: true,
  autoReminder: true,
  twoFactor: true,
  auditLog: true,
  session: '60 menit',
  attempts: '5 kali',
}

export default function Pengaturan() {
  const overlay = useOverlay()
  const [s, setS] = useState(DEFAULTS)
  const [saved, setSaved] = useState(DEFAULTS)
  const dirty = JSON.stringify(s) !== JSON.stringify(saved)

  const field = (key) => ({ value: s[key], onChange: (e) => setS((x) => ({ ...x, [key]: e.target.value })) })
  const toggle = (key) => ({ checked: s[key], onChange: (v) => setS((x) => ({ ...x, [key]: v })) })

  const save = (message = 'Pengaturan berhasil disimpan') => {
    setSaved(s)
    overlay.toast(message)
  }

  return (
    <>
      <PageHeader
        title="Pengaturan"
        subtitle="Atur preferensi panel, notifikasi, kebijakan pemesanan, pembayaran, dan keamanan."
        actions={
          <>
            <button
              className="btn"
              onClick={() =>
                overlay.showDetail({
                  title: 'Konfirmasi tindakan',
                  subtitle: 'Kembalikan seluruh pengaturan ke nilai bawaan?',
                  rows: [['Catatan', 'Perubahan akan tercatat pada riwayat aktivitas.']],
                  primaryLabel: 'Ya, lanjutkan',
                  success: 'Pengaturan dikembalikan ke default',
                  onPrimary: () => {
                    setS(DEFAULTS)
                    setSaved(DEFAULTS)
                  },
                })
              }
            >
              <RotateCcw strokeWidth={1.75} /> Kembalikan default
            </button>
            <button className="btn btn--primary" onClick={() => save()}>
              <Save strokeWidth={1.75} /> Simpan pengaturan
            </button>
          </>
        }
      />
      <Period label={dirty ? 'Ada perubahan yang belum disimpan' : 'Semua perubahan tersimpan'} />
      <Note tone="info">
        Pengaturan berlaku untuk seluruh staf admin. Nilai rekening dan kontak pada halaman ini merupakan data contoh.
      </Note>

      <div className="split split--half">
        <Card title="Pengaturan umum" subtitle="Identitas panel dan preferensi tampilan.">
          <Field label="Nama layanan" {...field('serviceName')} />
          <div className="field-row">
            <Field label="Bahasa" as="select" options={['Bahasa Indonesia', 'English']} {...field('language')} />
            <Field label="Zona waktu" as="select" options={['WIB (UTC+7)', 'WITA (UTC+8)', 'WIT (UTC+9)']} {...field('timezone')} />
          </div>
          <Field label="Email notifikasi sistem" type="email" {...field('email')} />
        </Card>

        <Card title="Notifikasi" subtitle="Pemberitahuan yang dikirim ke staf terkait.">
          <div>
            <ToggleRow title="Pembayaran perlu verifikasi" subtitle="Kirim ke Admin Keuangan saat bukti transfer masuk." {...toggle('notifyPayment')} />
            <ToggleRow title="Permintaan sewa gedung baru" subtitle="Kirim ke Admin Sewa untuk peninjauan jadwal." {...toggle('notifyRental')} />
            <ToggleRow title="Pendaftaran komunitas" subtitle="Kirim ke Admin Konten untuk persetujuan direktori." {...toggle('notifyCommunity')} />
            <ToggleRow title="Ringkasan harian" subtitle="Email ringkasan aktivitas setiap pukul 07.00 WIB." {...toggle('dailySummary')} />
          </div>
        </Card>
      </div>

      <div className="split split--half">
        <Card title="Pemesanan & tiket" subtitle="Batas dan kebijakan pemesanan pengunjung.">
          <div className="field-row">
            <Field label="Maks. tiket per pesanan" type="number" min={1} {...field('maxTickets')} />
            <Field label="Batas waktu pembayaran" as="select" options={['6 jam', '12 jam', '24 jam', '48 jam']} {...field('payDeadline')} />
          </div>
          <Field label="Kebijakan pembatalan" {...field('cancelPolicy')} />
          <div>
            <ToggleRow title="Terbitkan tiket otomatis" subtitle="Tiket dikirim setelah pembayaran terverifikasi." {...toggle('autoIssue')} />
            <ToggleRow title="Daftar tunggu" subtitle="Izinkan antrean saat kuota tiket habis." {...toggle('waitlist')} />
          </div>
        </Card>

        <Card title="Pembayaran" subtitle="Metode dan rekening penerimaan.">
          <Field label="Metode pembayaran" as="select" options={['Transfer bank & QRIS', 'Transfer bank', 'QRIS']} {...field('method')} />
          <div className="field-row">
            <Field label="Bank penerima" {...field('bank')} />
            <Field label="Nomor rekening" {...field('account')} />
          </div>
          <div>
            <ToggleRow title="Wajib unggah bukti transfer" subtitle="Pemesan melampirkan bukti sebelum diverifikasi." {...toggle('requireProof')} />
            <ToggleRow title="Pengingat pembayaran otomatis" subtitle="Kirim pengingat 6 jam sebelum batas waktu." {...toggle('autoReminder')} />
          </div>
        </Card>
      </div>

      <Card title="Keamanan" subtitle="Kebijakan akses untuk seluruh akun administrator.">
        <div className="split split--half" style={{ gap: 24 }}>
          <div>
            <ToggleRow title="Verifikasi dua langkah" subtitle="Wajib kode OTP saat masuk dari perangkat baru." {...toggle('twoFactor')} />
            <ToggleRow title="Catat log aktivitas" subtitle="Simpan riwayat perubahan data selama 12 bulan." {...toggle('auditLog')} />
          </div>
          <div className="form" style={{ gap: 12 }}>
            <div className="field-row">
              <Field label="Durasi sesi" as="select" options={['30 menit', '60 menit', '120 menit']} {...field('session')} />
              <Field label="Maks. percobaan masuk" as="select" options={['3 kali', '5 kali', '10 kali']} {...field('attempts')} />
            </div>
            <div>
              <DetailRow label="Terakhir diubah">28 Sep 2026 · Admin Pusat</DetailRow>
            </div>
          </div>
        </div>
        <div className="btn-row" style={{ justifyContent: 'flex-end' }}>
          <button className="btn" onClick={() => setS(saved)}>
            Batal
          </button>
          <button className="btn btn--primary" onClick={() => save('Pengaturan keamanan disimpan')}>
            Simpan pengaturan keamanan
          </button>
        </div>
      </Card>

      <PageFooter />
    </>
  )
}
