'use client'

import { Badge, Card, Photo } from '@/components/ui'
import { useOverlay } from '@/components/overlay'
import { PHOTOS } from '@/data/sample'
import { mutate } from '@/lib/api'

/** Daftar profil komunitas di direktori + modal profil (aktifkan/nonaktifkan). */
export default function DaftarKomunitas({ communities, loaded }: { communities: any[]; loaded: boolean }) {
  const overlay = useOverlay()

  const showProfile = (c) =>
    overlay.showDetail({
      subtitle: c.name,
      rows: [
        ['Kategori', c.category],
        ['Domisili', c.city],
        ['Ketua', c.leader ?? '—'],
        ['Anggota', `${c.members} orang`],
        ['Kontak WhatsApp', c.contact],
        ['Status', c.status],
      ],
      primaryLabel: c.status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan',
      success: c.status === 'Aktif' ? 'Profil dinonaktifkan dari aplikasi' : 'Profil kembali tampil di aplikasi',
      onPrimary: () => mutate(`/communities/${c.id}`, { method: 'PATCH', body: { status: c.status === 'Aktif' ? 'Nonaktif' : 'Aktif' } }),
    })

  return (
    <Card title="Daftar komunitas" subtitle={`${communities.length} profil ditampilkan`}>
      <div>
        {communities.map((c) => (
          <div className="community" key={c.id}>
            <Photo {...PHOTOS[c.photo ?? 'topeng']} width={90} height={67} />
            <div className="community__info">
              <strong>{c.name}</strong>
              <span>
                {c.category} · {c.city}
              </span>
              <span>
                {c.members} anggota · WA {c.contact}
              </span>
            </div>
            <div className="community__side">
              <Badge>{c.status}</Badge>
              <button className="link link--sm" onClick={() => showProfile(c)}>
                Profil →
              </button>
            </div>
          </div>
        ))}
        {loaded && !communities.length && <p className="muted">Tidak ada komunitas untuk filter ini.</p>}
      </div>
    </Card>
  )
}
