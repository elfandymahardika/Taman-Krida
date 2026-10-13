import { Suspense } from 'react'
import Login from '../../views/Login'

export const metadata = { title: 'Login' }

export default function LoginPage() {
  // Login membaca ?from= lewat useSearchParams, yang perlu dibungkus Suspense.
  return (
    <Suspense>
      <Login />
    </Suspense>
  )
}
