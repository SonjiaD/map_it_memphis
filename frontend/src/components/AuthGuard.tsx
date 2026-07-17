import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function LoadingSpinner() {
  return (
    <div className="flex-1 flex items-center justify-center bg-surface-page">
      <div className="w-8 h-8 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

// Requires a signed-in account. Collection is open to any authenticated user; what
// appears on the public map is curated separately via is_published.
export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) return <LoadingSpinner />

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
