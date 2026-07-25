import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

// Admin console, part A: approve or revoke who can collect field data. Admins can
// read every profile and update roles (RLS policies from migration 0005). Part B
// (map review + publish) lands with the averaging engine in the next step.

interface ProfileRow {
  id: string
  email: string | null
  full_name: string | null
  is_researcher: boolean
  is_admin: boolean
  created_at: string
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })

function PersonRow({ row, action }: { row: ProfileRow; action?: React.ReactNode }) {
  const name = row.full_name || '(no name)'
  const initial = (name.trim()[0] || '?').toUpperCase()
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="w-9 h-9 rounded-full bg-primary-900 text-white text-sm font-semibold flex items-center justify-center shrink-0">
        {initial}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-primary-900 truncate">{name}</p>
        <p className="font-mono text-[11px] text-primary-500 truncate">{row.email}</p>
      </div>
      <span className="font-mono text-[11px] text-primary-400 hidden sm:block shrink-0">
        {fmtDate(row.created_at)}
      </span>
      {action}
    </div>
  )
}

function Section({ label, count, children }: { label: string; count: number; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <div className="flex items-baseline gap-2 mb-2">
        <h2 className="font-mono text-[11px] tracking-[0.18em] uppercase text-primary-400">{label}</h2>
        <span className="font-mono text-[11px] text-primary-400">({count})</span>
      </div>
      <div className="bg-white rounded-2xl border border-border shadow-sm divide-y divide-border overflow-hidden">
        {children}
      </div>
    </section>
  )
}

export default function AdminPage() {
  const { profile } = useAuth()
  const [rows, setRows] = useState<ProfileRow[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, is_researcher, is_admin, created_at')
      .order('created_at', { ascending: true })
    if (error) setError(error.message)
    else setRows((data as ProfileRow[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function setResearcher(id: string, value: boolean) {
    setBusyId(id)
    setError('')
    const { error } = await supabase.from('profiles').update({ is_researcher: value }).eq('id', id)
    if (error) setError(error.message)
    await load()
    setBusyId(null)
  }

  const pending = rows.filter(r => !r.is_researcher && !r.is_admin)
  const collectors = rows.filter(r => r.is_researcher && !r.is_admin)
  const admins = rows.filter(r => r.is_admin)

  return (
    <div className="flex-1 overflow-auto bg-surface-page">
      <div className="max-w-2xl mx-auto px-4 pt-24 pb-16">
        <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-primary-400 mb-2">Admin console</p>
        <h1 className="font-display text-4xl text-primary-900 mb-2">Access requests</h1>
        <p className="text-sm text-primary-500 mb-8">
          Approve who can collect field data. Approved collectors can draw resident
          boundaries and drop asset pins; everyone else stays read-only.
        </p>

        {error && (
          <p className="text-red-700 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 mb-6">{error}</p>
        )}

        {loading ? (
          <div className="flex items-center gap-2 text-primary-400 text-sm">
            <span className="w-4 h-4 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
            Loading accounts...
          </div>
        ) : (
          <>
            <Section label="Pending requests" count={pending.length}>
              {pending.length === 0 ? (
                <p className="px-4 py-6 text-sm text-primary-400 text-center">No requests waiting for review.</p>
              ) : (
                pending.map(r => (
                  <PersonRow key={r.id} row={r} action={
                    <button
                      onClick={() => setResearcher(r.id, true)}
                      disabled={busyId === r.id}
                      className="shrink-0 bg-primary-900 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors"
                    >
                      {busyId === r.id ? '...' : 'Approve'}
                    </button>
                  } />
                ))
              )}
            </Section>

            <Section label="Approved collectors" count={collectors.length}>
              {collectors.length === 0 ? (
                <p className="px-4 py-6 text-sm text-primary-400 text-center">No approved collectors yet.</p>
              ) : (
                collectors.map(r => (
                  <PersonRow key={r.id} row={r} action={
                    <button
                      onClick={() => setResearcher(r.id, false)}
                      disabled={busyId === r.id}
                      className="shrink-0 border border-border hover:border-primary-300 hover:bg-surface-muted disabled:opacity-50 text-primary-600 text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
                    >
                      {busyId === r.id ? '...' : 'Revoke'}
                    </button>
                  } />
                ))
              )}
            </Section>

            <Section label="Administrators" count={admins.length}>
              {admins.map(r => (
                <PersonRow key={r.id} row={r} action={
                  <span className="shrink-0 font-mono text-[10px] tracking-wider uppercase bg-primary-900 text-white px-2.5 py-1 rounded">
                    {r.id === profile?.id ? 'You' : 'Admin'}
                  </span>
                } />
              ))}
            </Section>
          </>
        )}
      </div>
    </div>
  )
}
