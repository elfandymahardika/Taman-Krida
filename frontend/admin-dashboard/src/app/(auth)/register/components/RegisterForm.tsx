'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, UserPlus } from 'lucide-react'
import { Field } from '@/components/ui'
import type { ActionState } from '@/lib/schemas'
import { registerAction } from '../../actions'

type Key = 'name' | 'username' | 'email' | 'password' | 'confirm'

const EMPTY: Record<Key, string> = { name: '', username: '', email: '', password: '', confirm: '' }
const initialState: ActionState = {}

/**
 * Formulir registrasi staf (Server Action `registerAction` + schema Zod). Akun baru berstatus
 * "Menunggu persetujuan" dan baru bisa login setelah Administrator utama menyetujui sekaligus memilih perannya.
 */
export default function RegisterForm() {
  const [state, formAction, isPending] = useActionState(registerAction, initialState)
  const [form, setForm] = useState(EMPTY)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [showPassword, setShowPassword] = useState(false)

  const [shownFor, setShownFor] = useState(state)
  if (shownFor !== state) {
    setShownFor(state)
    setTouched({})
  }
  const errorOf = (key: Key) => (touched[key] ? undefined : state.errors?.[key]?.[0])

  const update = (key: Key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setTouched((t) => ({ ...t, [key]: true, form: true }))
  }

  return (
    <main className="login__main">
      <form className="login__card" action={formAction} noValidate>
        <div className="login__head">
          <p className="brand__panel">PANEL ADMINISTRATOR</p>
          <h1 className="login__title">Daftar Akun Staf</h1>
          <p className="muted" style={{ fontSize: 13, lineHeight: 1.5 }}>
            Akun baru perlu disetujui Administrator utama sebelum dapat dipakai. Peran ditentukan saat persetujuan.
          </p>
        </div>

        {state.success ? (
          <>
            <div className="login__success" role="status">
              <strong>Pendaftaran terkirim</strong>
              <span>{state.message}</span>
              <span>
                Username Anda: <strong>{state.values?.username}</strong>
              </span>
            </div>
            <Link href="/login" className="btn btn--primary login__submit">
              Kembali ke halaman login
            </Link>
          </>
        ) : (
          <>
            {state.message && !touched.form && (
              <div className="login__alert" role="alert">
                {state.message}
              </div>
            )}

            <Field label="Nama lengkap" name="name" autoComplete="name" placeholder="Contoh: Rina Sari" value={form.name} onChange={update('name')} error={errorOf('name')} required autoFocus />
            <div className="field-row">
              <Field
                label="Username"
                name="username"
                autoComplete="username"
                placeholder="rina.s"
                value={form.username}
                onChange={update('username')}
                error={errorOf('username')}
                hint="Huruf kecil, angka, titik, garis bawah"
                required
              />
              <Field label="Email" name="email" type="email" autoComplete="email" placeholder="nama@email.com" value={form.email} onChange={update('email')} error={errorOf('email')} required />
            </div>
            <div className="login__password">
              <Field
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Minimal 8 karakter"
                value={form.password}
                onChange={update('password')}
                error={errorOf('password')}
                hint="Minimal 8 karakter, berisi huruf dan angka"
                required
              />
              <button
                type="button"
                className="login__eye"
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? <EyeOff strokeWidth={1.75} /> : <Eye strokeWidth={1.75} />}
              </button>
            </div>
            <Field
              label="Konfirmasi password"
              name="confirm"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={form.confirm}
              onChange={update('confirm')}
              error={errorOf('confirm')}
              required
            />

            <button type="submit" className="btn btn--primary login__submit" disabled={isPending}>
              <UserPlus strokeWidth={1.75} /> {isPending ? 'Mendaftarkan…' : 'Daftar'}
            </button>

            <p className="login__switch">
              Sudah punya akun? <Link href="/login">Masuk</Link>
            </p>
          </>
        )}
      </form>
      <p className="muted" style={{ fontSize: 11, textAlign: 'center' }}>
        © 2026 TKBJ • Password disimpan sebagai hash bcrypt, tidak pernah dalam bentuk teks asli.
      </p>
    </main>
  )
}
