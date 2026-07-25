import { useState, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { MapBackdrop } from '../components/MapBackdrop'

const pinSvg = (
  <svg viewBox="0 0 24 24" style={{ width: 19, height: 19 }} className="text-accent-500" fill="currentColor">
    <path d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7zm0 9.5A2.5 2.5 0 1112 6a2.5 2.5 0 010 5.5z" />
  </svg>
)

export default function SignupPage() {
  const { signUp } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    const { error } = await signUp(email, password, name)
    setLoading(false)
    if (error) {
      setError(error.message || 'Something went wrong. Please try again.')
    } else {
      // The account is created as a pending request (is_researcher/is_admin false).
      // An admin must approve it before collection is possible, so show a pending
      // confirmation rather than sending them into the collect tool.
      setSubmitted(true)
    }
  }

  const inputClass = 'w-full bg-white border border-border-input rounded-lg px-4 py-3 text-primary-900 placeholder-primary-300 focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500 transition-all'

  if (submitted) {
    return (
      <div className="relative flex-1 flex items-center justify-center px-4 py-24">
        <MapBackdrop />
        <div className="relative z-10 w-full max-w-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-border p-8 text-center">
            <span className="w-12 h-12 rounded-lg bg-primary-900 flex items-center justify-center mx-auto mb-5">{pinSvg}</span>
            <h1 className="font-display text-3xl text-primary-900 mb-2">Request received.</h1>
            <p className="text-sm text-primary-500 leading-relaxed mb-6">
              Thanks, {name || 'there'}. A study coordinator will review your request and
              approve your account for field data collection. You can log in now, but the
              Collect tool unlocks once you are approved.
            </p>
            <Link to="/login" className="inline-block bg-primary-900 hover:bg-primary-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors">
              Go to log in
            </Link>
          </div>
          <p className="font-mono text-[11px] text-primary-500 text-center mt-5">
            A University of Memphis + Knowledge Quest research project
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex-1 flex items-center justify-center px-4 py-24">
      <MapBackdrop />
      <div className="relative z-10 w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-2xl border border-border p-8">
          <span className="w-10 h-10 rounded-lg bg-primary-900 flex items-center justify-center mb-5">{pinSvg}</span>
          <h1 className="font-display text-3xl text-primary-900 mb-1.5">Request collector access.</h1>
          <p className="text-sm text-primary-500 mb-7">
            Field data collection is limited to approved youth researchers. Sign up to
            request access, and a study coordinator will review it.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1.5">Name</label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)}
                placeholder="Your name" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1.5">Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1.5">Password</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="At least 6 characters" className={inputClass} />
            </div>

            {error && (
              <p className="text-red-700 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-900 hover:bg-primary-700 disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition-colors mt-1"
            >
              {loading ? 'Sending request...' : 'Request access'}
            </button>
          </form>

          <p className="text-primary-400 text-sm text-center mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-accent-600 hover:text-accent-500 font-medium transition-colors">
              Log in
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
