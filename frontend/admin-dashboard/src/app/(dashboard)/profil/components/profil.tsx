'use client'

import { useState } from 'react'
import { ErrorBanner, PageFooter, Tabs } from '@/components/ui'
import { useQuery } from '@/lib/api'
import { useFormProfil } from './formprofil'
import Hero from './hero'
import EditorProfil from './editorprofil'
import DaftarArea from './daftararea'
import Denah from './denah'

const NONE = []

export default function Profil() {
  const profil = useFormProfil()
  const areas = useQuery('/facilities').data ?? NONE
  const [tab, setTab] = useState('Semua bagian')
  const [activeArea, setActiveArea] = useState('pendopo')

  const showProfile = tab !== 'Fasilitas & denah'
  const showAreas = tab !== 'Profil lembaga'

  return (
    <>
      <Hero profil={profil} />
      <ErrorBanner error={profil.profileQ.error} onRetry={profil.profileQ.reload} />
      <Tabs items={['Semua bagian', 'Profil lembaga', 'Fasilitas & denah']} value={tab} onChange={setTab} size="lg" />

      {showProfile && profil.form && <EditorProfil profil={profil} />}

      {showAreas && (
        <div className="split" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 504px)' }}>
          <DaftarArea areas={areas} activeArea={activeArea} onActivate={setActiveArea} />
          <Denah areas={areas} activeArea={activeArea} onActivate={setActiveArea} />
        </div>
      )}

      <PageFooter />
    </>
  )
}
