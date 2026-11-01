import { useState } from 'react'
import { useOverlay } from '@/components/overlay'
import { mutate, useQuery } from '@/lib/api'
import type { FieldErrors } from '@/lib/api'

/**
 * State formulir profil lembaga, dipakai tombol simpan di header dan editor.
 * `form` = nilai yang tampil (draf bila sudah diedit, selain itu data server).
 */
export function useFormProfil() {
  const overlay = useOverlay()
  const profileQ = useQuery('/profile')
  const saved = profileQ.data?.profile
  const [draft, setDraft] = useState(null) // null = belum diedit, pakai data server
  const [errors, setErrors] = useState<FieldErrors>({})
  const [busy, setBusy] = useState(false)
  const form = draft ?? saved
  const dirty = Boolean(draft) && JSON.stringify(draft) !== JSON.stringify(saved)

  const cancel = () => {
    setDraft(null)
    setErrors({})
  }

  const save = async () => {
    setBusy(true)
    try {
      await mutate('/profile', { method: 'PUT', body: form })
      cancel()
      overlay.toast('Profil TKBJ disimpan — langsung tampil di aplikasi publik')
    } catch (err) {
      setErrors(err.fields ?? {})
      overlay.toast(err.fields ? 'Periksa kembali isian profil.' : err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  return {
    profileQ,
    form,
    errors,
    dirty,
    busy,
    save,
    cancel,
    /** onChange untuk satu kolom profil. */
    set: (key: string) => (e) => {
      setDraft({ ...form, [key]: e.target.value })
      setErrors((x) => ({ ...x, [key]: undefined }))
    },
  }
}

export type FormProfil = ReturnType<typeof useFormProfil>
