import { useState, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { MapBackdrop } from '../components/MapBackdrop'

export default function SignupPage() {
  const { signUp } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)

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
      setConfirming(true)
    }
  }

  const inputClass = 'w-full bg-white border border-border-input rounded-lg px-4 py-3 text-primary-900 placeholder-primary-300 focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500 transition-all'

  return (
    <div className="relative flex-1 flex items-center justify-center px-4 py-24">
      <MapBackdrop />
      <div className="relative z-10 w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-2xl border border-border p-8">
          {confirming ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-accent-50 flex items-center justify-center mx-auto mb-5">
                <svg viewBox="0 0 24 24" className="w-7 h-7 text-accent-600" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h1 className="font-display text-2xl text-primary-900 mb-2">Check your email</h1>
              <p className="text-sm text-primary-600 mb-1.5">
                We sent a confirmation link to <span className="font-medium text-primary-900">{email}</span>.
              </p>
              <p className="text-sm text-primary-400 mb-7">
                Click it to activate your account, then log in.
              </p>
              <Link
                to="/login"
                className="inline-block bg-primary-900 hover:bg-primary-700 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors"
              >
                Go to log in
              </Link>
            </div>
          ) : (
            <>
              <span className="w-10 h-10 rounded-lg bg-primary-900 flex items-center justify-center mb-5">
                <svg viewBox="0 0 24 24" style={{ width: 19, height: 19 }} className="text-accent-400" fill="currentColor">
                  <path d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7zm0 9.5A2.5 2.5 0 1112 6a2.5 2.5 0 010 5.5z" />
                </svg>
              </span>
              <h1 className="font-display text-3xl text-primary-900 mb-1.5">Join the research team.</h1>
              <p className="text-sm text-primary-500 mb-7">
                A study coordinator authorizes accounts for field data collection.
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
                  {loading ? 'Creating account...' : 'Create account'}
                </button>
              </form>

              <p className="text-primary-400 text-sm text-center mt-6">
                Already have an account?{' '}
                <Link to="/login" className="text-accent-600 hover:text-accent-500 font-medium transition-colors">
                  Log in
                </Link>
              </p>
            </>
          )}
        </div>
        <p className="font-mono text-[11px] text-primary-500 text-center mt-5">
          A University of Memphis + Knowledge Quest research project
        </p>
      </div>
    </div>
  )
}
