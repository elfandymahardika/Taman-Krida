'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { Field } from '@/components/ui'
import { DEMO_ACCOUNTS } from '@/data/auth'
import type { ActionState } from '@/lib/schemas'
import { loginAction } from '../../actions'

const initialState: ActionState = {}

/**
 * Formulir login + daftar akun demo. Dikirim ke Server Action `loginAction` lewat useActionState;
 * error validasi Zod / backend tampil di bawah kolomnya. Setelah berhasil, server mengalihkan ke `from`.
 */
export default function LoginForm({ from }: { from: string }) {
  const [state, formAction, isPending] = useActionState(loginAction, initialState)
  // Isian dikontrol agar tombol akun demo bisa mengisinya dan isian tidak hilang saat login gagal.
  const [form, setForm] = useState({ username: '', password: '' })
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [showPassword, setShowPassword] = useState(false)

  // Pesan error disembunyikan untuk kolom yang sudah diubah sejak percobaan terakhir.
  const [shownFor, setShownFor] = useState(state)
  if (shownFor !== state) {
    setShownFor(state)
    setTouched({})
  }
  const errorOf = (key: string) => (touched[key] ? undefined : state.errors?.[key]?.[0])

  const update = (key: 'username' | 'password') => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setTouched((t) => ({ ...t, [key]: true, form: true }))
  }

  const fillDemo = (a: (typeof DEMO_ACCOUNTS)[number]) => {
    setForm({ username: a.username, password: a.password })
    setTouched({ username: true, password: true, form: true })
  }

  return (
    <main className="login__main">
      <form className="login__card" action={formAction} noValidate>
        <input type="hidden" name="from" value={from} />
        <div className="login__head">
          <p className="brand__panel">PANEL ADMINISTRATOR</p>
          <h1 className="login__title">Login Admin</h1>
          <p className="muted" style={{ fontSize: 13, lineHeight: 1.5 }}>
            Masuk untuk mengelola acara, tiket, sewa gedung, dan pembayaran TKBJ.
          </p>
        </div>

        {state.message && !touched.form && (
          <div className="login__alert" role="alert">
            {state.message}
          </div>
        )}

        <Field
          label="Username"
          name="username"
          autoComplete="username"
          placeholder="Contoh: admin"
          value={form.username}
          onChange={update('username')}
          error={errorOf('username')}
          required
          autoFocus
        />
        <div className="login__password">
          <Field
            label="Password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Minimal 6 karakter"
            value={form.password}
            onChange={update('password')}
            error={errorOf('password')}
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

        <button type="submit" className="btn btn--primary login__submit" disabled={isPending}>
          <LogIn strokeWidth={1.75} /> {isPending ? 'Memeriksa…' : 'Login'}
        </button>

        <p className="login__switch">
          Belum punya akun? <Link href="/register">Daftar sebagai staf</Link>
        </p>

        <div className="login__demo">
          <p className="field__label">Akun demo per peran</p>
          {DEMO_ACCOUNTS.map((a) => (
            <button type="button" key={a.username} className="login__demo-item" onClick={() => fillDemo(a)}>
              <span>
                <strong>{a.username}</strong> / {a.password}
              </span>
              <span className="muted">{a.role}</span>
            </button>
          ))}
          <p className="muted" style={{ fontSize: 11, lineHeight: 1.5 }}>
            <strong>dimas.p</strong> / tkbj2026 = contoh pendaftar yang belum disetujui (login ditolak).
          </p>
        </div>
      </form>
      <p className="muted" style={{ fontSize: 11, textAlign: 'center' }}>
        © 2026 TKBJ • Prototipe — data contoh dari backend TKBJ Admin API.
      </p>
    </main>
  )
}
