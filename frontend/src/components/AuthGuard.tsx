import { ReactNode } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { MapBackdrop } from './MapBackdrop'

function LoadingSpinner() {
  return (
    <div className="flex-1 flex items-center justify-center bg-surface-page">
      <div className="w-8 h-8 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) return <LoadingSpinner />

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

// Gate for field data collection: requires a signed-in account whose profile has
// been flagged is_researcher by the study coordinator (Supabase dashboard). RLS
// enforces this server-side too; this guard just keeps the UI honest.
export function ResearcherGuard({ children }: { children: ReactNode }) {
  const { user, profile, loading } = useAuth()

  if (loading) return <LoadingSpinner />

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!profile?.is_researcher) {
    return (
      <div className="relative flex-1 flex items-center justify-center px-4 py-24">
        <MapBackdrop />
        <div className="relative z-10 max-w-md text-center bg-white rounded-2xl shadow-2xl border border-border p-9">
          <div className="w-14 h-14 rounded-full bg-accent-50 flex items-center justify-center mx-auto mb-5">
            <svg viewBox="0 0 24 24" className="w-7 h-7 text-accent-600" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="font-display text-2xl text-primary-900 mb-2">Not authorized for data collection</h1>
          <p className="text-sm text-primary-500 leading-relaxed mb-6">
            Your account exists but has not been approved for field data collection yet.
            Contact the study coordinator to have your account authorized.
          </p>
          <Link to="/" className="inline-block bg-primary-900 hover:bg-primary-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors">
            Back to the map
          </Link>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
