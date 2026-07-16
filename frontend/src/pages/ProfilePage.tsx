import { useAuth } from '../contexts/AuthContext'
import { SectionLabel, PageLayout } from '../components/ui'

export default function ProfilePage() {
  const { user } = useAuth()

  return (
    <PageLayout>
      <h1 className="text-3xl font-bold text-gray-900 mb-1">Your Profile</h1>
      <p className="text-gray-500 mt-1 mb-10">Account details for MAPP Memphis field researchers.</p>

      <section>
        <SectionLabel className="mb-1">Account</SectionLabel>
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-16 mt-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Name</p>
            <p className="text-gray-800 font-medium">{user?.user_metadata?.full_name || '—'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Email</p>
            <p className="text-gray-800 font-medium">{user?.email}</p>
          </div>
        </div>
      </section>
    </PageLayout>
  )
}
