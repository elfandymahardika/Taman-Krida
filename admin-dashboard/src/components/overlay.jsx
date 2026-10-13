'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { Check } from 'lucide-react'
import { Field } from './ui'

const OverlayContext = createContext(null)

export function useOverlay() {
  return useContext(OverlayContext)
}

function Modal({ title, subtitle, onClose, children }) {
  const ref = useRef(null)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
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

function Actions({ onCancel, cancelLabel = 'Batal', primaryLabel, onPrimary, type }) {
  return (
    <div className="modal__actions">
      <button type="button" className="modal__btn" onClick={onCancel}>
        {cancelLabel}
      </button>
      {primaryLabel && (
        <button type={type ?? 'button'} className="modal__btn modal__btn--primary" onClick={onPrimary}>
          {primaryLabel}
        </button>
      )}
    </div>
  )
}

/** Validasi bawaan: kolom `required` wajib diisi. `validate(data)` dapat menambah aturan lain. */
function requiredErrors(fields, data) {
  const errors = {}
  for (const f of fields.flatMap((x) => x.row ?? [x])) {
    if (f.required && !String(data[f.name] ?? '').trim()) errors[f.name] = `${f.label} wajib diisi.`
  }
  return errors
}

function FormModal({ title, subtitle = 'Lengkapi data lalu simpan.', fields, submitLabel = 'Simpan', validate, onSubmit, close }) {
  const [errors, setErrors] = useState({})

  return (
    <Modal title={title} subtitle={subtitle} onClose={close}>
      <form
        className="form"
        style={{ gap: 16 }}
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          const form = e.currentTarget
          const data = Object.fromEntries(new FormData(form))
          const errs = { ...(validate?.(data) ?? {}), ...requiredErrors(fields, data) }
          setErrors(errs)
          const first = Object.keys(errs)[0]
          if (first) form.elements[first]?.focus()
          else onSubmit(data)
        }}
        onInput={(e) => errors[e.target.name] && setErrors((x) => ({ ...x, [e.target.name]: undefined }))}
      >
        {fields.map((f) =>
          f.row ? (
            <div className="field-row" key={f.row.map((x) => x.name).join()}>
              {f.row.map((x) => (
                <Field key={x.name} {...x} error={errors[x.name]} />
              ))}
            </div>
          ) : (
            <Field key={f.name} {...f} error={errors[f.name]} />
          ),
        )}
        <Actions onCancel={close} primaryLabel={submitLabel} type="submit" />
      </form>
    </Modal>
  )
}

function DetailModal({ title = 'Detail', subtitle, rows, primaryLabel, onPrimary, cancelLabel, close }) {
  return (
    <Modal title={title} subtitle={subtitle} onClose={close}>
      {rows.map(([label, value]) => (
        <div className="modal__row" key={label}>
          <p className="modal__row-label">{label}</p>
          <p className="modal__row-value">{value}</p>
        </div>
      ))}
      <Actions onCancel={close} cancelLabel={cancelLabel} primaryLabel={primaryLabel} onPrimary={onPrimary} />
    </Modal>
  )
}

function ChoiceModal({ title, subtitle, options, value, onChoose, close }) {
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

export function OverlayProvider({ children }) {
  const [modal, setModal] = useState(null)
  const [toasts, setToasts] = useState([])

  const close = useCallback(() => setModal(null), [])

  const toast = useCallback((message, variant = 'success') => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, message, variant }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200)
  }, [])

  const api = {
    toast,
    close,
    /** Modal formulir "Tambah …". Menampilkan toast `success` saat disimpan. */
    showForm: ({ success, onSubmit, ...props }) =>
      setModal(
        <FormModal
          {...props}
          close={close}
          onSubmit={(data) => {
            onSubmit?.(data)
            close()
            toast(success ?? 'Data berhasil disimpan')
          }}
        />,
      ),
    /** Modal rincian dengan tombol aksi utama opsional. */
    showDetail: ({ success, onPrimary, ...props }) =>
      setModal(
        <DetailModal
          {...props}
          close={close}
          onPrimary={() => {
            onPrimary?.()
            close()
            toast(success ?? 'Status diperbarui')
          }}
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
            <span className="toast__icon">{t.variant === 'info' ? '!' : '✓'}</span>
            <p>{t.message}</p>
          </div>
        ))}
      </div>
    </OverlayContext.Provider>
  )
}

/** Aksi bersama "Unduh laporan" → pilih format → toast. */
export function useDownloadReport() {
  const { showChoice, toast } = useOverlay()
  return () =>
    showChoice({
      title: 'Unduh laporan',
      subtitle: 'Pilih format laporan yang ingin diunduh.',
      options: ['Format PDF', 'Format Excel (.xlsx)', 'Format CSV'],
      onChoose: (o) => toast(`Laporan berhasil diunduh (${o.replace('Format ', '')})`),
    })
}
