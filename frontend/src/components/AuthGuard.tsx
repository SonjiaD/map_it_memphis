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

// A centered notice card over the map backdrop, matching the auth/profile pages.
function NoticeCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="relative flex-1 flex items-center justify-center px-4 py-24">
      <MapBackdrop />
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl border border-border p-8 text-center">
        <h1 className="font-display text-2xl text-primary-900 mb-2">{title}</h1>
        <div className="text-sm text-primary-500 leading-relaxed">{children}</div>
      </div>
    </div>
  )
}

// Requires a signed-in account (any role).
export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingSpinner />
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

// Field data collection: requires an approved collector (is_researcher) or an admin.
// A signed-in but unapproved account sees a "request pending" notice instead.
export function ResearcherGuard({ children }: { children: ReactNode }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <LoadingSpinner />
  if (!user) return <Navigate to="/login" replace />

  if (!profile?.is_researcher && !profile?.is_admin) {
    return (
      <NoticeCard title="Your access request is pending">
        <p className="mb-4">
          Thanks for signing up. A study coordinator needs to approve your account
          before you can collect field data. You will be able to start once your
          request is approved.
        </p>
        <Link to="/" className="inline-block bg-primary-900 hover:bg-primary-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors">
          Back to the map
        </Link>
      </NoticeCard>
    )
  }
  return <>{children}</>
}

// Super-admin only (the review + publish console).
export function AdminGuard({ children }: { children: ReactNode }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <LoadingSpinner />
  if (!user) return <Navigate to="/login" replace />

  if (!profile?.is_admin) {
    return (
      <NoticeCard title="Admins only">
        <p className="mb-4">This area is limited to study administrators.</p>
        <Link to="/" className="inline-block bg-primary-900 hover:bg-primary-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors">
          Back to the map
        </Link>
      </NoticeCard>
    )
  }
  return <>{children}</>
}
