import Hero from '../../components/hero'
import LoginForm from './LoginForm'

export default function Login({ from }: { from: string }) {
  return (
    <div className="login">
      <Hero />
      <LoginForm from={from} />
    </div>
  )
}
