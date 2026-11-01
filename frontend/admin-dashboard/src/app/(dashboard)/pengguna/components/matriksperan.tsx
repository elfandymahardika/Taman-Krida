'use client'

import { Check, Minus, X } from 'lucide-react'
import { Card, Cell, DataTable, ErrorBanner, TableFoot } from '@/components/ui'
import type { useQuery } from '@/lib/api'

const ACCESS = {
  y: { cls: 'check--yes', icon: Check, label: 'Boleh mengubah' },
  p: { cls: 'check--partial', icon: Minus, label: 'Hanya lihat' },
  n: { cls: 'check--no', icon: X, label: 'Tanpa akses' },
}

function Access({ level }: { level: keyof typeof ACCESS }) {
  const map = ACCESS[level]
  return (
    <span className={`check ${map.cls}`} title={map.label} aria-label={map.label}>
      <map.icon strokeWidth={2.5} />
    </span>
  )
}

/** Matriks hak akses tiap peran per modul (dari GET /users/roles). */
export default function MatriksPeran({ rolesQ }: { rolesQ: ReturnType<typeof useQuery<any>> }) {
  const roles = rolesQ.data?.roles ?? []

  return (
    <Card title="Matriks peran & hak akses" subtitle="Ditegakkan di dua lapis: menu & halaman di panel, dan API backend pada setiap permintaan.">
      <ErrorBanner error={rolesQ.error} onRetry={rolesQ.reload} />
      {rolesQ.data && (
        <DataTable
          columns={[
            { label: 'Peran', width: 220, render: (r) => <Cell main={r.label} sub={`${r.staff} staf`} /> },
            ...rolesQ.data.modules.map((m, i) => ({ label: m.label, width: 170, render: (r) => <Access level={rolesQ.data.matrix[r.key][i]} /> })),
          ]}
          rows={roles}
          getKey={(r) => r.key}
          footer={<TableFoot>✓ boleh mengubah · – hanya lihat (perubahan ditolak 403) · ✕ tanpa akses (menu disembunyikan, halaman & API ditolak 403)</TableFoot>}
        />
      )}
    </Card>
  )
}
