'use client'

import { useState } from 'react'
import { Badge, Card, DetailRow, Field, Note } from '@/components/ui'
import { useOverlay } from '@/components/overlay'
import { wibDateTime } from '@/data/format'
import { mutate } from '@/lib/api'

type Props = {
  staff: any
  roles: any[]
  operational: any[]
  meId?: number
}

/** Detail satu staf: ubah peran dan aktifkan/nonaktifkan akun. */
export default function DetailStaf({ staff: selected, roles, operational, meId }: Props) {
  const overlay = useOverlay()
  const [draftRole, setDraftRole] = useState<string>(selected.roleKey) // peran belum disimpan
  const [busy, setBusy] = useState(false)
  const locked = selected.roleKey === 'admin' || selected.id === meId

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

  const saveRole = () =>
    run(
      () => mutate(`/users/${selected.id}`, { method: 'PATCH', body: { roleKey: draftRole } }),
      `Peran ${selected.name} diperbarui — hak akses langsung berlaku`,
    )

  const toggleStatus = () => {
    const next = selected.status === 'Nonaktif' ? 'Aktif' : 'Nonaktif'
    run(
      () => mutate(`/users/${selected.id}`, { method: 'PATCH', body: { status: next } }),
      next === 'Aktif' ? 'Akun diaktifkan kembali' : 'Akun dinonaktifkan — sesi staf langsung berakhir',
    )
  }

  return (
    <Card title="Detail staf & akses" subtitle={selected.email}>
      <div>
        <Badge>{selected.status}</Badge>
      </div>
      <div>
        <DetailRow label="Nama">{selected.name}</DetailRow>
        <DetailRow label="Username login">{selected.username}</DetailRow>
        <DetailRow label="Terakhir aktif">{selected.lastSeenAt ? wibDateTime(selected.lastSeenAt) : 'Belum masuk'}</DetailRow>
      </div>
      <Field
        label="Peran"
        as="select"
        options={(selected.roleKey === 'admin' ? roles : operational).map((r) => r.label)}
        value={roles.find((r) => r.key === draftRole)?.label ?? ''}
        disabled={locked}
        onChange={(e) => setDraftRole(roles.find((r) => r.label === e.target.value).key)}
      />
      <Note>
        {selected.id === meId
          ? 'Ini akun Anda sendiri. Peran dan status akun sendiri tidak dapat diubah.'
          : selected.roleKey === 'admin'
            ? 'Akun Administrator utama dilindungi dan tidak dapat diubah dari halaman ini.'
            : 'Perubahan peran langsung berlaku di backend dan tercatat di log aktivitas. Akun nonaktif langsung keluar dari panel.'}
      </Note>
      <div className="btn-row">
        <button className="btn btn--primary" disabled={locked || busy || draftRole === selected.roleKey} onClick={saveRole}>
          Simpan peran
        </button>
        <button className="btn" disabled={locked || busy || selected.status === 'Undangan'} onClick={toggleStatus}>
          {selected.status === 'Nonaktif' ? 'Aktifkan akun' : 'Nonaktifkan akun'}
        </button>
      </div>
    </Card>
  )
}
