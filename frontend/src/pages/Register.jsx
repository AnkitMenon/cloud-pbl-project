import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import AuthLayout, { Field } from '../components/AuthLayout'
import { useAuth } from '../lib/auth'
import { errorMessage } from '../lib/api'
import { useToast } from '../components/Toast'

function validate({ username, email, password, confirm }) {
  const errors = {}
  if (username.trim().length < 3) errors.username = 'Use at least 3 characters.'
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) errors.email = 'Enter a valid email address.'
  if (password.length < 6) errors.password = 'Use at least 6 characters.'
  if (confirm !== password) errors.confirm = "Passwords don't match."
  return errors
}

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setServerError('')
    const found = validate(form)
    setErrors(found)
    if (Object.keys(found).length) return
    setLoading(true)
    try {
      await register(form.username.trim(), form.email.trim(), form.password)
      toast.success(`Account created. Welcome, ${form.username.trim()}.`)
      navigate('/')
    } catch (err) {
      setServerError(await errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <h1 className="text-2xl font-extrabold tracking-tight">Create your account</h1>
      <p className="mt-1.5 text-muted">Upload, organise and share files from one place.</p>

      <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
        {serverError && <p role="alert" className="rounded-xl bg-danger/8 px-3.5 py-2.5 text-sm font-medium text-danger">{serverError}</p>}
        <Field label="Username" autoComplete="username" value={form.username} onChange={set('username')} error={errors.username} placeholder="jayant" />
        <Field label="Email" type="email" autoComplete="email" value={form.email} onChange={set('email')} error={errors.email} placeholder="you@example.com" />
        <Field label="Password" type="password" autoComplete="new-password" value={form.password} onChange={set('password')} error={errors.password} placeholder="At least 6 characters" />
        <Field label="Confirm password" type="password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} error={errors.confirm} placeholder="Type it again" />
        <button type="submit" disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-vault py-3 font-bold text-white transition hover:bg-vault-dark disabled:opacity-50">
          {loading && <Loader2 size={18} className="animate-spin" />}
          Create account
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account? <Link to="/login" className="font-semibold text-vault hover:underline">Log in</Link>
      </p>
    </AuthLayout>
  )
}
