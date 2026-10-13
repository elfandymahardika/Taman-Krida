'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { Field } from '../components/ui'
import { DEMO_ACCOUNTS, auth, useSession, validateLogin } from '../data/auth'
import { PHOTOS, asset } from '../data/sample'

export default function Login() {
  const session = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [form, setForm] = useState({ username: '', password: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  // Halaman asal dikirim lewat ?from=/acara. Hanya path internal yang diterima.
  const fromParam = searchParams.get('from')
  const from = fromParam?.startsWith('/') && !fromParam.startsWith('//') ? fromParam : '/'

  // Sudah login → langsung ke halaman asal.
  useEffect(() => {
    if (session) router.replace(from)
  }, [session, from, router])
  if (session) return null

  const update = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setErrors((x) => ({ ...x, [key]: undefined }))
    setFormError('')
  }

  const submit = (e) => {
    e.preventDefault()
    const errs = validateLogin(form)
    setErrors(errs)
    if (Object.keys(errs).length) return
    setLoading(true)
    // Jeda singkat untuk mensimulasikan permintaan ke server.
    setTimeout(() => {
      setLoading(false)
      if (auth.login(form.username, form.password)) router.replace(from)
      else setFormError('Username atau password salah. Gunakan akun demo di bawah.')
    }, 500)
  }

  const fillDemo = (a) => {
    setForm({ username: a.username, password: a.password })
    setErrors({})
    setFormError('')
  }

  return (
    <div className="login">
      <aside className="login__hero">
        <Image className="login__photo" src={PHOTOS.topeng.src} alt="" fill sizes="50vw" preload />
        <div className="login__hero-content">
          <div className="brand__mark">
            <Image src={asset('brand-mark.svg')} alt="" width={30} height={30} />
            <span className="brand__name" style={{ color: '#fff' }}>
              TKBJ
            </span>
          </div>
          <h2 className="login__tagline">Ruang bersama untuk seni dan budaya Jawa Timur.</h2>
          <p className="login__caption">Taman Krida Budaya Jawa Timur · Disbudpar Provinsi Jawa Timur</p>
        </div>
      </aside>

      <main className="login__main">
        <form className="login__card" onSubmit={submit} noValidate>
          <div className="login__head">
            <p className="brand__panel">PANEL ADMINISTRATOR</p>
            <h1 className="login__title">Login Admin</h1>
            <p className="muted" style={{ fontSize: 13, lineHeight: 1.5 }}>
              Masuk untuk mengelola acara, tiket, sewa gedung, dan pembayaran TKBJ.
            </p>
          </div>

          {formError && (
            <div className="login__alert" role="alert">
              {formError}
            </div>
          )}

          <Field
            label="Username"
            name="username"
            autoComplete="username"
            placeholder="Contoh: admin"
            value={form.username}
            onChange={update('username')}
            error={errors.username}
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
              error={errors.password}
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

          <button type="submit" className="btn btn--primary login__submit" disabled={loading}>
            <LogIn strokeWidth={1.75} /> {loading ? 'Memeriksa…' : 'Login'}
          </button>

          <div className="login__demo">
            <p className="field__label">Akun demo (simulasi)</p>
            {DEMO_ACCOUNTS.map((a) => (
              <button type="button" key={a.username} className="login__demo-item" onClick={() => fillDemo(a)}>
                <span>
                  <strong>{a.username}</strong> / {a.password}
                </span>
                <span className="muted">{a.role}</span>
              </button>
            ))}
          </div>
        </form>
        <p className="muted" style={{ fontSize: 11, textAlign: 'center' }}>
          © 2026 TKBJ • Prototipe — seluruh data merupakan data contoh.
        </p>
      </main>
    </div>
  )
}
