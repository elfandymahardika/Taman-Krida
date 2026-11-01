'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Check } from 'lucide-react'
import { Field } from './ui'
import type { FieldProps } from './ui'
import { download } from '../lib/api'
import type { ApiError, FieldErrors } from '../lib/api'

/** Isian formulir dari FormData: teks, atau File untuk kolom berkas. */
export type FormValues = Record<string, any>
export type FormField = (FieldProps & { name: string; label: string }) | { row: FormFieldItem[] }
type FormFieldItem = FieldProps & { name: string; label: string }

type Action = () => unknown | Promise<unknown>
type ToastVariant = 'success' | 'error' | 'info'

export type FormOptions = {
  title: string
  subtitle?: string
  fields: FormField[]
  submitLabel?: string
  validate?: (data: FormValues) => FieldErrors
  onSubmit?: (data: FormValues) => unknown | Promise<unknown>
  success?: string
}

export type DetailOptions = {
  title?: string
  subtitle?: ReactNode
  rows: ReactNode[][]
  primaryLabel?: string
  onPrimary?: Action
  secondary?: { label: string; onClick?: Action; success?: string }
  cancelLabel?: string
  success?: string
}

export type ChoiceOptions = {
  title: string
  subtitle?: ReactNode
  options: string[]
  value?: string
  onChoose: (option: string) => void
}

export type Overlay = {
  toast: (message: ReactNode, variant?: ToastVariant) => void
  close: () => void
  showForm: (options: FormOptions) => void
  showDetail: (options: DetailOptions) => void
  showChoice: (options: ChoiceOptions) => void
}

const OverlayContext = createContext<Overlay | null>(null)

export function useOverlay() {
  return useContext(OverlayContext)!
}

function Modal({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string
  subtitle?: ReactNode
  onClose: () => void
  children?: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    ref.current?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref}>
        <div className="modal__head">
          <div>
            <h2 className="modal__title">{title}</h2>
            {subtitle && <p className="modal__sub">{subtitle}</p>}
          </div>
          <button className="modal__close" aria-label="Tutup" onClick={onClose}>
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Actions({
  onCancel,
  cancelLabel = 'Batal',
  primaryLabel,
  onPrimary,
  type,
  busy,
  secondary,
}: {
  onCancel: () => void
  cancelLabel?: string
  primaryLabel?: string
  onPrimary?: () => void
  type?: 'button' | 'submit'
  busy?: boolean
  secondary?: { label: string; onClick: () => void }
}) {
  return (
    <div className="modal__actions">
      <button type="button" className="modal__btn" onClick={onCancel}>
        {cancelLabel}
      </button>
      {secondary && (
        <button type="button" className="modal__btn" onClick={secondary.onClick} disabled={busy}>
          {secondary.label}
        </button>
      )}
      {primaryLabel && (
        <button type={type ?? 'button'} className="modal__btn modal__btn--primary" onClick={onPrimary} disabled={busy}>
          {busy ? 'Memproses…' : primaryLabel}
        </button>
      )}
    </div>
  )
}

/** Validasi bawaan: kolom `required` wajib diisi. `validate(data)` dapat menambah aturan lain. */
function requiredErrors(fields: FormField[], data: FormValues) {
  const errors: FieldErrors = {}
  for (const f of fields.flatMap((x) => ('row' in x ? x.row : [x]))) {
    if (f.required && !String(data[f.name] ?? '').trim()) errors[f.name] = `${f.label} wajib diisi.`
  }
  return errors
}

function FormModal({
  title,
  subtitle = 'Lengkapi data lalu simpan.',
  fields,
  submitLabel = 'Simpan',
  validate,
  onSubmit,
  close,
}: Omit<FormOptions, 'success'> & { onSubmit: (data: FormValues) => Promise<void>; close: () => void }) {
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)

  return (
    <Modal title={title} subtitle={subtitle} onClose={close}>
      <form
        className="form"
        style={{ gap: 16 }}
        noValidate
        onSubmit={async (e) => {
          e.preventDefault()
          const form = e.currentTarget
          const data = Object.fromEntries(new FormData(form)) as FormValues
          const errs = { ...(validate?.(data) ?? {}), ...requiredErrors(fields, data) }
          setErrors(errs)
          setFormError('')
          const first = Object.keys(errs)[0]
          const focus = (name: string) => (form.elements.namedItem(name) as HTMLElement | null)?.focus()
          if (first) return focus(first)
          setBusy(true)
          try {
            await onSubmit(data)
          } catch (e) {
            const err = e as ApiError
            // Error validasi dari backend ditampilkan di kolom terkait; error lain di atas tombol.
            setBusy(false)
            if (err.fields) {
              setErrors(err.fields)
              focus(Object.keys(err.fields)[0])
            }
            const shownInFields = err.fields && Object.keys(err.fields).some((k) => form.elements.namedItem(k))
            if (!shownInFields) setFormError(err.message)
          }
        }}
        onInput={(e) => {
          const { name } = e.target as HTMLInputElement
          if (errors[name]) setErrors((x) => ({ ...x, [name]: undefined }))
        }}
      >
        {fields.map((f) =>
          'row' in f ? (
            <div className="field-row" key={f.row.map((x) => x.name).join()}>
              {f.row.map((x) => (
                <Field key={x.name} {...x} error={errors[x.name]} />
              ))}
            </div>
          ) : (
            <Field key={f.name} {...f} error={errors[f.name]} />
          ),
        )}
        {formError && (
          <p className="form__error" role="alert">
            {formError}
          </p>
        )}
        <Actions onCancel={close} primaryLabel={submitLabel} type="submit" busy={busy} />
      </form>
    </Modal>
  )
}

function DetailModal({
  title = 'Detail',
  subtitle,
  rows,
  primaryLabel,
  onPrimary,
  secondary,
  cancelLabel,
  close,
}: Omit<DetailOptions, 'success' | 'onPrimary' | 'secondary'> & {
  onPrimary: () => Promise<boolean>
  secondary?: { label: string; onClick: () => Promise<boolean> }
  close: () => void
}) {
  const [busy, setBusy] = useState(false)
  const run = (fn: () => Promise<boolean>) => async () => {
    setBusy(true)
    // `fn` menutup modal bila berhasil; bila gagal modal tetap terbuka.
    if (!(await fn())) setBusy(false)
  }
  return (
    <Modal title={title} subtitle={subtitle} onClose={close}>
      {rows.map(([label, value]) => (
        <div className="modal__row" key={String(label)}>
          <p className="modal__row-label">{label}</p>
          <p className="modal__row-value">{value}</p>
        </div>
      ))}
      <Actions
        onCancel={close}
        cancelLabel={cancelLabel}
        primaryLabel={primaryLabel}
        onPrimary={run(onPrimary)}
        secondary={secondary && { label: secondary.label, onClick: run(secondary.onClick) }}
        busy={busy}
      />
    </Modal>
  )
}

function ChoiceModal({ title, subtitle, options, value, onChoose, close }: ChoiceOptions & { close: () => void }) {
  return (
    <Modal title={title} subtitle={subtitle} onClose={close}>
      <div className="choice-list">
        {options.map((o) => (
          <button
            key={o}
            className={`choice ${o === value ? 'is-active' : ''}`}
            onClick={() => onChoose(o)}
          >
            {o}
            {o === value && <Check strokeWidth={2} />}
          </button>
        ))}
      </div>
      <Actions onCancel={close} />
    </Modal>
  )
}

export function OverlayProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<ReactNode>(null)
  const [toasts, setToasts] = useState<{ id: number; message: ReactNode; variant: ToastVariant }[]>([])

  const close = useCallback(() => setModal(null), [])

  const toast = useCallback((message: ReactNode, variant: ToastVariant = 'success') => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, message, variant }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200)
  }, [])

  /** Jalankan aksi (boleh async); sukses → tutup modal + toast, gagal → toast error. */
  const attempt = async (fn: Action | undefined, success: string | undefined) => {
    try {
      await fn?.()
      close()
      toast(success)
      return true
    } catch (err) {
      toast((err as Error).message, 'error')
      return false
    }
  }

  const api: Overlay = {
    toast,
    close,
    /**
     * Modal formulir "Tambah …". `onSubmit` boleh async; error validasi dari
     * backend (`err.fields`) tampil di kolomnya. Menampilkan toast `success` saat disimpan.
     */
    showForm: ({ success, onSubmit, ...props }) =>
      setModal(
        <FormModal
          {...props}
          close={close}
          onSubmit={async (data: FormValues) => {
            await onSubmit?.(data)
            close()
            toast(success ?? 'Data berhasil disimpan')
          }}
        />,
      ),
    /** Modal rincian dengan tombol aksi utama (dan sekunder) opsional. */
    showDetail: ({ success, onPrimary, secondary, ...props }) =>
      setModal(
        <DetailModal
          {...props}
          close={close}
          onPrimary={() => attempt(onPrimary, success ?? 'Status diperbarui')}
          secondary={secondary && { label: secondary.label, onClick: () => attempt(secondary.onClick, secondary.success) }}
        />,
      ),
    /** Modal pilihan, misalnya format unduhan atau filter. */
    showChoice: ({ onChoose, ...props }) =>
      setModal(
        <ChoiceModal
          {...props}
          close={close}
          onChoose={(o) => {
            close()
            onChoose(o)
          }}
        />,
      ),
  }

  return (
    <OverlayContext.Provider value={api}>
      {children}
      {modal}
      <div className="toast-stack" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.variant}`}>
            <span className="toast__icon">{t.variant === 'success' ? '✓' : '!'}</span>
            <p>{t.message}</p>
          </div>
        ))}
      </div>
    </OverlayContext.Provider>
  )
}

const CSV = 'Format CSV (transaksi)'

/** Aksi bersama "Unduh laporan" → pilih format → CSV diunduh dari backend. */
export function useDownloadReport() {
  const { showChoice, toast } = useOverlay()
  return () =>
    showChoice({
      title: 'Unduh laporan',
      subtitle: 'Pilih format laporan yang ingin diunduh.',
      options: [CSV, 'Format PDF', 'Format Excel (.xlsx)'],
      onChoose: async (o) => {
        if (o !== CSV) return toast(`${o.replace('Format ', '')} belum tersedia di prototipe. Gunakan CSV.`, 'info')
        try {
          toast(`Laporan diunduh: ${await download('/orders/export.csv')}`)
        } catch (err) {
          toast((err as Error).message, 'error')
        }
      },
    })
}
