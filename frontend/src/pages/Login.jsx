import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import AuthLayout, { Field } from '../components/AuthLayout'
import { useAuth } from '../lib/auth'
import { errorMessage } from '../lib/api'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState(params.get('expired') ? 'Your session expired. Log in again to continue.' : '')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/')
    } catch (err) {
      setError(await errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <h1 className="text-2xl font-extrabold tracking-tight">Log in to CloudVault</h1>
      <p className="mt-1.5 text-muted">Pick up where you left off with your files.</p>

      <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
        {error && <p role="alert" className="rounded-xl bg-danger/8 px-3.5 py-2.5 text-sm font-medium text-danger">{error}</p>}
        <Field label="Email" type="email" autoComplete="email" required value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
        <Field label="Password" type="password" autoComplete="current-password" required value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Your password" />
        <button type="submit" disabled={loading || !form.email || !form.password}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-vault py-3 font-bold text-white transition hover:bg-vault-dark disabled:opacity-50">
          {loading && <Loader2 size={18} className="animate-spin" />}
          Log in
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        New here? <Link to="/register" className="font-semibold text-vault hover:underline">Create an account</Link>
      </p>
    </AuthLayout>
  )
}
