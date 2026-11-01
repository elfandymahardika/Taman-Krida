'use client'

import { useState } from 'react'
import { Badge, Card, DetailRow, Field, Note } from '@/components/ui'
import { useOverlay } from '@/components/overlay'
import { wibDateTime } from '@/data/format'
import { mutate } from '@/lib/api'

type Props = {
  /** Akun hasil registrasi (status "Menunggu persetujuan" atau "Ditolak"). */
  staff: any
  operational: any[]
}

/** Tinjau pendaftaran staf: pilih peran lalu setujui (akun bisa login), atau tolak. */
export default function PersetujuanStaf({ staff: applicant, operational }: Props) {
  const overlay = useOverlay()
  const [roleKey, setRoleKey] = useState<string>(operational[0]?.key ?? '')
  const [busy, setBusy] = useState(false)
  const pending = applicant.status === 'Menunggu persetujuan'

  const run = async (action: () => Promise<unknown>, message: string) => {
    setBusy(true)
    try {
      await action()
      overlay.toast(message)
    } catch (err) {
      overlay.toast(err.fields ? Object.values(err.fields)[0] : err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const role = operational.find((r) => r.key === roleKey)
  const approve = () =>
    run(
      () => mutate(`/users/${applicant.id}/approve`, { method: 'POST', body: { roleKey } }),
      `${applicant.name} disetujui sebagai ${role?.label} — akun sudah bisa login`,
    )
  const reject = () =>
    overlay.showDetail({
      title: 'Tolak pendaftaran?',
      subtitle: `${applicant.name} · ${applicant.email}`,
      rows: [['Catatan', 'Akun tetap tercatat untuk riwayat, tetapi tidak dapat dipakai untuk login.']],
      primaryLabel: 'Tolak pendaftaran',
      success: 'Pendaftaran ditolak',
      onPrimary: () => mutate(`/users/${applicant.id}/reject`, { method: 'POST' }),
    })

  return (
    <Card title="Persetujuan pendaftaran" subtitle={applicant.email}>
      <div>
        <Badge>{applicant.status}</Badge>
      </div>
      <div>
        <DetailRow label="Nama">{applicant.name}</DetailRow>
        <DetailRow label="Username login">{applicant.username}</DetailRow>
        <DetailRow label="Mendaftar">{applicant.createdAt ? wibDateTime(applicant.createdAt) : '—'}</DetailRow>
      </div>
      {pending ? (
        <>
          <Field
            label="Peran yang diberikan"
            as="select"
            options={operational.map((r) => r.label)}
            value={role?.label ?? ''}
            onChange={(e) => setRoleKey(operational.find((r) => r.label === e.target.value).key)}
            hint="Menentukan menu & data yang boleh diakses setelah disetujui."
          />
          <Note>Akun ini mendaftar sendiri lewat halaman registrasi dan belum bisa login sampai disetujui.</Note>
          <div className="btn-row">
            <button className="btn btn--primary" disabled={busy || !roleKey} onClick={approve}>
              Setujui &amp; aktifkan
            </button>
            <button className="btn btn--danger" disabled={busy} onClick={reject}>
              Tolak
            </button>
          </div>
        </>
      ) : (
        <Note>Pendaftaran ini sudah ditolak. Akun tidak dapat dipakai untuk login.</Note>
      )}
    </Card>
  )
}
