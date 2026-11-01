import Hero from '../../components/hero'
import RegisterForm from './RegisterForm'

/** Halaman publik registrasi staf. */
export default function Register() {
  return (
    <div className="login">
      <Hero />
      <RegisterForm />
    </div>
  )
}
