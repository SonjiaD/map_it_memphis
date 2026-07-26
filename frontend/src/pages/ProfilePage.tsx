import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { MapBackdrop } from '../components/MapBackdrop'
import { supabase } from '../lib/supabase'
import { fmtDateCT, fmtTimeCT } from '../lib/dateFormat'

function ProfileCard() {
  const { user, profile } = useAuth()
  const name = profile?.full_name || (user?.user_metadata?.full_name as string) || ''
  const initial = (name.trim()[0] || '?').toUpperCase()

  return (
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
  )
}

function ProfileBar() {
  const { user, profile } = useAuth()
  const name = profile?.full_name || (user?.user_metadata?.full_name as string) || ''
  const initial = (name.trim()[0] || '?').toUpperCase()

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm px-6 py-4 flex items-center gap-4 flex-wrap">
      <div className="w-12 h-12 rounded-full bg-primary-900 text-white font-display text-lg flex items-center justify-center shrink-0">
        {initial}
      </div>
      <div className="min-w-0">
        <h1 className="font-display text-lg text-primary-900 leading-tight truncate">{name || 'Your profile'}</h1>
        <p className="font-mono text-[11px] text-primary-500 truncate">{profile?.email || user?.email}</p>
      </div>
      <div className="flex items-center gap-2 ml-auto flex-wrap">
        <span className="inline-flex items-center gap-1.5 bg-accent-50 border border-accent-200 text-accent-700 text-xs font-medium px-3 py-1 rounded-lg">
          <svg viewBox="0 0 20 20" className="w-3.5 h-3.5" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Can collect field data
        </span>
        {profile?.is_researcher && (
          <span className="font-mono text-[10px] tracking-wider uppercase bg-primary-900 text-white px-2.5 py-1 rounded">
            Reviewer
          </span>
        )}
      </div>
    </div>
  )
}

// ---- My submitted maps (researcher-only, read-only) -------------------------

interface MySubmissionRow {
  id: string
  started_at: string | null
  ended_at: string | null
  respondent_relationship: string | null
  respondent_age_range: string | null
  years_in_neighborhood: string | null
  consent_given: boolean
  notes: string | null
  created_at: string
}

const TH = 'text-left font-mono text-[10px] tracking-wider uppercase text-primary-400 font-medium px-3 py-2 whitespace-nowrap'
const TD = 'px-3 py-2.5 text-sm text-primary-700 whitespace-nowrap'

function Spinner({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 text-primary-400 text-sm">
      <span className="w-4 h-4 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
      {label}
    </div>
  )
}
function ErrorBar({ children }: { children: React.ReactNode }) {
  return <p className="text-red-700 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 mb-6">{children}</p>
}
function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-4 py-6 text-sm text-primary-400 text-center">{children}</p>
}

function MySubmissions() {
  const { user } = useAuth()
  const [rows, setRows] = useState<MySubmissionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!user) return
    setError('')
    // RLS already restricts drawn_boundaries reads to the caller's own rows for
    // non-admins (see "collector read own boundaries" in migration 0007), but we
    // filter explicitly here too so the query's intent is clear on its own.
    const { data, error } = await supabase
      .from('drawn_boundaries')
      .select('id, started_at, ended_at, respondent_relationship, respondent_age_range, years_in_neighborhood, consent_given, notes, created_at')
      .eq('researcher_id', user.id)
      .order('started_at', { ascending: false })
    if (error) setError(error.message)
    else setRows((data as MySubmissionRow[]) ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  // Numbered 1..N by chronological session start, scoped to this researcher's own
  // submissions only (not the cross-collector numbering used in the admin console).
  const numberById = useMemo(() => {
    const map = new Map<string, number>()
    rows
      .slice()
      .sort((a, b) => (a.started_at ?? a.created_at).localeCompare(b.started_at ?? b.created_at))
      .forEach((r, i) => map.set(r.id, i + 1))
    return map
  }, [rows])

  if (loading) return <Spinner label="Loading your submissions..." />

  return (
    <section>
      <div className="flex items-baseline gap-2 mb-2">
        <h2 className="font-mono text-[11px] tracking-[0.18em] uppercase text-primary-400">My submitted maps</h2>
        <span className="font-mono text-[11px] text-primary-400">({rows.length})</span>
      </div>
      {error && <ErrorBar>{error}</ErrorBar>}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        {rows.length === 0 ? (
          <Empty>You haven't submitted any maps yet.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface-muted/40">
                  <th className={TH}>#</th>
                  <th className={TH}>Date</th>
                  <th className={TH} title="When you began drawing the map, in Memphis local time (CT).">Start · CT</th>
                  <th className={TH} title="When you saved the map, in Memphis local time (CT).">End · CT</th>
                  <th className={TH}>Relationship</th>
                  <th className={TH}>Age</th>
                  <th className={TH}>Years here</th>
                  <th className={TH}>Consent</th>
                  <th className={TH}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-surface-muted/50">
                    <td className={`${TD} font-mono text-primary-400`}>{numberById.get(r.id) ?? '—'}</td>
                    <td className={TD}>{fmtDateCT(r.started_at)}</td>
                    <td className={`${TD} font-mono text-[12px]`}>{fmtTimeCT(r.started_at)}</td>
                    <td className={`${TD} font-mono text-[12px]`}>{fmtTimeCT(r.ended_at)}</td>
                    <td className={TD}>{r.respondent_relationship || '—'}</td>
                    <td className={TD}>{r.respondent_age_range || '—'}</td>
                    <td className={TD}>{r.years_in_neighborhood || '—'}</td>
                    <td className={TD}>
                      <span className={`font-mono text-[10px] tracking-wider uppercase px-1.5 py-0.5 rounded ${
                        r.consent_given ? 'bg-accent-50 text-accent-700' : 'bg-red-50 text-red-600'
                      }`}>
                        {r.consent_given ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className={`${TD} max-w-[220px] truncate`} title={r.notes || ''}>{r.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}

// ---- page shell -------------------------------------------------------------

export default function ProfilePage() {
  const { profile } = useAuth()

  if (profile?.is_researcher) {
    return (
      <div className="flex-1 overflow-auto bg-surface-page">
        <div className="max-w-4xl mx-auto px-4 pt-24 pb-16">
          <div className="mb-8">
            <ProfileBar />
          </div>
          <MySubmissions />
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex-1 flex items-center justify-center px-4 py-24">
      <MapBackdrop />
      <div className="relative z-10 w-full max-w-sm">
        <ProfileCard />
      </div>
    </div>
  )
}
