import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { MapBackdrop } from '../components/MapBackdrop'

export default function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) {
      setError('Invalid email or password. Please try again.')
    } else {
      navigate('/collect')
    }
  }

  const inputClass = 'w-full bg-white border border-border-input rounded-lg px-4 py-3 text-primary-900 placeholder-primary-300 focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500 transition-all'

  return (
    <div className="relative flex-1 flex items-center justify-center px-4 py-24">
      <MapBackdrop />
      <div className="relative z-10 w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-2xl border border-border p-8">
          <span className="w-10 h-10 rounded-lg bg-primary-900 flex items-center justify-center mb-5">
            <svg viewBox="0 0 24 24" style={{ width: 19, height: 19 }} className="text-accent-500" fill="currentColor">
              <path d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7zm0 9.5A2.5 2.5 0 1112 6a2.5 2.5 0 010 5.5z" />
            </svg>
          </span>
          <h1 className="font-display text-3xl text-primary-900 mb-1.5">Welcome back.</h1>
          <p className="text-sm text-primary-500 mb-7">Log in to continue collecting field data.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1.5">Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1.5">Password</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Your password" className={inputClass} />
            </div>

            {error && (
              <p className="text-red-700 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-900 hover:bg-primary-700 disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition-colors mt-1"
            >
              {loading ? 'Signing in...' : 'Log in'}
            </button>
          </form>

          <p className="text-primary-400 text-sm text-center mt-6">
            No account?{' '}
            <Link to="/signup" className="text-accent-600 hover:text-accent-500 font-medium transition-colors">
              Sign up
            </Link>
          </p>
        </div>
        <p className="font-mono text-[11px] text-primary-500 text-center mt-5">
          A University of Memphis + Knowledge Quest research project
        </p>
      </div>
    </div>
  )
}
