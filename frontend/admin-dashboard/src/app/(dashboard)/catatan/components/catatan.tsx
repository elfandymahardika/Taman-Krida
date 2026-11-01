'use client'

import { useState } from 'react'
import { PageFooter } from '@/components/ui'
import type { Note } from '@/lib/dal'
import Hero from './hero'
import FormCatatan from './formcatatan'
import DaftarCatatan from './daftarcatatan'

export default function Catatan({ notes, userId, isAdmin, all }: { notes: Note[]; userId: number; isAdmin: boolean; all: boolean }) {
  const [editing, setEditing] = useState<number | null>(null)

  return (
    <>
      <Hero isAdmin={isAdmin} all={all} />
      <div className="notes">
        <FormCatatan />
        <DaftarCatatan notes={notes} userId={userId} isAdmin={isAdmin} all={all} editing={editing} onEdit={setEditing} />
      </div>
      <PageFooter />
    </>
  )
}
