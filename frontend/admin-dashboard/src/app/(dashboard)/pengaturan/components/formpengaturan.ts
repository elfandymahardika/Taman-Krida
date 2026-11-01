import { useState } from 'react'
import { useOverlay } from '@/components/overlay'
import { mutate, useQuery } from '@/lib/api'
import type { FieldErrors } from '@/lib/api'

/**
 * State formulir pengaturan, dipakai bersama oleh semua kartu di halaman.
 * `s` = nilai yang tampil (draf bila sudah diedit, selain itu data server).
 */
export function useFormPengaturan() {
  const overlay = useOverlay()
  const { data, error, reload } = useQuery('/settings')
  const saved = data?.settings
  const opt = data?.options ?? {}
  const [draft, setDraft] = useState(null) // null = belum diedit
  const [errors, setErrors] = useState<FieldErrors>({})
  const [busy, setBusy] = useState(false)
  const s = draft ?? saved
  const dirty = Boolean(draft) && JSON.stringify(draft) !== JSON.stringify(saved)

  const update = (key: string, value: unknown) => {
    setDraft({ ...s, [key]: value })
    setErrors((x) => ({ ...x, [key]: undefined }))
  }

  const cancel = () => {
    setDraft(null)
    setErrors({})
  }

  const save = async (message = 'Pengaturan berhasil disimpan') => {
    setBusy(true)
    try {
      await mutate('/settings', { method: 'PUT', body: s })
      cancel()
      overlay.toast(message)
    } catch (err) {
      setErrors(err.fields ?? {})
      overlay.toast(err.fields ? 'Periksa kembali isian yang ditandai.' : err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  return {
    data,
    error,
    reload,
    s,
    opt,
    dirty,
    busy,
    save,
    cancel,
    /** Props untuk <Field>: nilai, error, dan onChange satu kolom. */
    field: (key: string) => ({ value: s[key], error: errors[key], onChange: (e) => update(key, e.target.value) }),
    /** Props untuk <ToggleRow>: status sakelar satu kolom. */
    toggle: (key: string) => ({ checked: s[key], onChange: (v: boolean) => update(key, v) }),
  }
}

export type FormPengaturan = ReturnType<typeof useFormPengaturan>
