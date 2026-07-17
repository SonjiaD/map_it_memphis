import { useAuth } from '../contexts/AuthContext'
import { MapBackdrop } from '../components/MapBackdrop'

export default function ProfilePage() {
  const { user, profile } = useAuth()
  const name = profile?.full_name || (user?.user_metadata?.full_name as string) || ''
  const initial = (name.trim()[0] || '?').toUpperCase()

  return (
    <div className="relative flex-1 flex items-center justify-center px-4 py-24">
      <MapBackdrop />
      <div className="relative z-10 w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-2xl border border-border overflow-hidden">
          <div className="bg-primary-900 px-8 pt-9 pb-7">
            <div className="w-16 h-16 rounded-full bg-accent-500 text-white font-display text-3xl flex items-center justify-center mb-4">
              {initial}
            </div>
            <h1 className="font-display text-2xl text-white leading-tight">{name || 'Your profile'}</h1>
            <p className="font-mono text-[11px] text-primary-300 mt-1">{profile?.email || user?.email}</p>
          </div>
          <div className="p-8">
            <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-primary-400 mb-3">Data collection access</p>
            <span className="inline-flex items-center gap-2 bg-accent-50 border border-accent-200 text-accent-700 text-sm font-medium px-3.5 py-1.5 rounded-lg">
              <svg viewBox="0 0 20 20" className="w-4 h-4" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              You can collect field data
            </span>
            <p className="text-sm text-primary-500 leading-relaxed mt-4">
              Draw resident boundaries and drop asset pins from the Collect page. A study
              coordinator reviews new submissions before they appear on the public map.
            </p>
            {profile?.is_researcher && (
              <p className="font-mono text-[11px] text-accent-600 mt-3">You are a reviewer.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
