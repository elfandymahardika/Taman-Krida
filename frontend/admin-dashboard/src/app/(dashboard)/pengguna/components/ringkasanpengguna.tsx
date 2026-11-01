'use client'

import { CheckCircle, ShieldCheck, UserX, Users } from 'lucide-react'
import { Metrics } from '@/components/ui'

/** Kartu metrik: jumlah staf, peran, akun aktif, dan nonaktif/undangan. */
export default function RingkasanPengguna({ staff, roles, operational }: { staff: any[]; roles: any[]; operational: any[] }) {
  return (
    <Metrics
      items={[
        { label: 'Total staf admin', icon: Users, value: String(staff.length), hint: 'Seluruh akun panel administrator' },
        { label: 'Peran tersedia', icon: ShieldCheck, value: String(roles.length), hint: `1 utama · ${operational.length} operasional` },
        { label: 'Akun aktif', icon: CheckCircle, value: String(staff.filter((s) => s.status === 'Aktif').length), hint: 'Dapat masuk ke panel' },
        {
          label: 'Belum aktif',
          icon: UserX,
          value: String(staff.filter((s) => s.status !== 'Aktif').length),
          hint: `${staff.filter((s) => s.status === 'Menunggu persetujuan').length} pendaftaran menunggu persetujuan`,
        },
      ]}
    />
  )
}
