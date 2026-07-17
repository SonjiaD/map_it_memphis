import { useState, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

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

  const inputClass = 'w-full bg-white border border-border-input rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all'

  return (
    <div className="flex-1 flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-end p-12 relative overflow-hidden bg-primary-900">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary-700/40" />
        <div className="absolute top-40 -left-16 w-56 h-56 rounded-full bg-accent-400/10" />
        <div className="relative z-10">
          <p className="font-mono text-xs tracking-[0.2em] uppercase text-accent-400 mb-3">Soulsville, Memphis</p>
          <p className="font-display font-bold text-3xl text-white leading-snug mb-4">
            Join the research team.
          </p>
          <p className="text-primary-200 text-sm leading-relaxed max-w-sm">
            Create an account to get started. A study coordinator will authorize field data collection for your account.
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-surface-page">
        <div className="w-full max-w-md">
          <Link to="/" className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-500 text-sm mb-10 transition-colors">
            <svg viewBox="0 0 20 20" className="w-4 h-4" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Back to the map
          </Link>

          {confirming ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-6">
                <svg viewBox="0 0 24 24" className="w-8 h-8 text-primary-700" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h1 className="font-display font-bold text-2xl text-primary-900 mb-3">Check your email</h1>
              <p className="text-gray-600 mb-2">
                We sent a confirmation link to <span className="text-primary-800 font-medium">{email}</span>.
              </p>
              <p className="text-gray-400 text-sm mb-8">
                Click the link in that email to activate your account, then come back here to log in.
              </p>
              <Link
                to="/login"
                className="inline-block bg-primary-700 hover:bg-primary-600 text-white font-bold px-8 py-3 rounded-full transition-all duration-200"
              >
                Go to Log In
              </Link>
            </div>
          ) : (
            <>
              <h1 className="font-display font-bold text-3xl text-primary-900 mb-2">Create your account.</h1>
              <p className="text-gray-500 mb-8">For MAPP It Memphis youth researchers.</p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="Your name" className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com" className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters" className={inputClass} />
                </div>

                {error && (
                  <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary-700 hover:bg-primary-600 disabled:opacity-60 text-white font-bold py-3.5 rounded-full transition-all duration-200 mt-2"
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
              </form>

              <p className="text-gray-400 text-sm text-center mt-6">
                Already have an account?{' '}
                <Link to="/login" className="text-primary-600 hover:text-primary-500 font-medium transition-colors">
                  Log in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
