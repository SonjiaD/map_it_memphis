import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

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

  return (
    <div className="flex-1 flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-end p-12 relative overflow-hidden bg-primary-900">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary-700/40" />
        <div className="absolute top-40 -left-16 w-56 h-56 rounded-full bg-accent-400/10" />
        <div className="relative z-10">
          <p className="font-mono text-xs tracking-[0.2em] uppercase text-accent-400 mb-3">Soulsville, Memphis</p>
          <p className="font-display font-bold text-3xl text-white leading-snug mb-4">
            Researcher access only.
          </p>
          <p className="text-primary-200 text-sm leading-relaxed max-w-sm">
            This login is for youth researchers collecting resident-drawn boundaries and interviews in the field.
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

          <h1 className="font-display font-bold text-3xl text-primary-900 mb-2">Welcome back.</h1>
          <p className="text-gray-500 mb-8">Log in to continue collecting field data.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-white border border-border-input rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                className="w-full bg-white border border-border-input rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
              />
            </div>

            {error && (
              <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-700 hover:bg-primary-600 disabled:opacity-60 text-white font-bold py-3.5 rounded-full transition-all duration-200 mt-2"
            >
              {loading ? 'Signing in...' : 'Log In'}
            </button>
          </form>

          <p className="text-gray-400 text-sm text-center mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary-600 hover:text-primary-500 font-medium transition-colors">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
