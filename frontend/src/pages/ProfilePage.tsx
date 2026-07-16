import { useAuth } from '../contexts/AuthContext'
import { SectionLabel, PageLayout } from '../components/ui'

export default function ProfilePage() {
  const { user, profile } = useAuth()

  return (
    <PageLayout>
      <h1 className="text-3xl font-bold text-gray-900 mb-1">Your Profile</h1>
      <p className="text-gray-500 mt-1 mb-10">Account details for MAPP It Memphis field researchers.</p>

      <section className="mb-10">
        <SectionLabel className="mb-1">Account</SectionLabel>
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-16 mt-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Name</p>
            <p className="text-gray-800 font-medium">{profile?.full_name || user?.user_metadata?.full_name || '—'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Email</p>
            <p className="text-gray-800 font-medium">{profile?.email || user?.email}</p>
          </div>
        </div>
      </section>

      <section>
        <SectionLabel className="mb-1">Data collection access</SectionLabel>
        <div className="mt-4">
          {profile?.is_researcher ? (
            <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200 text-teal-800 text-sm font-medium px-4 py-2 rounded-full">
              <svg viewBox="0 0 20 20" className="w-4 h-4 text-teal-600" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Authorized youth researcher
            </div>
          ) : (
            <div>
              <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-sm font-medium px-4 py-2 rounded-full mb-2">
                Not yet authorized
              </div>
              <p className="text-gray-500 text-sm">
                Contact the study coordinator to have your account approved for field data collection.
              </p>
            </div>
          )}
        </div>
      </section>
    </PageLayout>
  )
}
