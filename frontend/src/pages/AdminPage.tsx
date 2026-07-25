import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { computeAverageShape } from '../lib/consensusHeatmap'
import type { Polygon } from 'geojson'

// Admin console.
//   Access requests: approve/revoke who can collect field data.
//   Maps & publishing: curate which submitted maps count toward the community
//     average, then publish a single averaged shape (the public-facing output).
// All backed by the admin RLS policies from migrations 0005 + 0006.

const AVERAGE_THRESHOLD = 0.5 // majority agreement

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

// ---- shared bits ------------------------------------------------------------

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

// ---- Access requests tab ----------------------------------------------------

interface ProfileRow {
  id: string
  email: string | null
  full_name: string | null
  is_researcher: boolean
  is_admin: boolean
  created_at: string
}

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
      <span className="font-mono text-[11px] text-primary-400 hidden sm:block shrink-0">{fmtDate(row.created_at)}</span>
      {action}
    </div>
  )
}

function AccessRequests() {
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
    setBusyId(id); setError('')
    const { error } = await supabase.from('profiles').update({ is_researcher: value }).eq('id', id)
    if (error) setError(error.message)
    await load()
    setBusyId(null)
  }

  const pending = rows.filter(r => !r.is_researcher && !r.is_admin)
  const collectors = rows.filter(r => r.is_researcher && !r.is_admin)
  const admins = rows.filter(r => r.is_admin)

  if (loading) return <Spinner label="Loading accounts..." />

  return (
    <>
      {error && <ErrorBar>{error}</ErrorBar>}
      <Section label="Pending requests" count={pending.length}>
        {pending.length === 0
          ? <Empty>No requests waiting for review.</Empty>
          : pending.map(r => (
            <PersonRow key={r.id} row={r} action={
              <button onClick={() => setResearcher(r.id, true)} disabled={busyId === r.id}
                className="shrink-0 bg-primary-900 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors">
                {busyId === r.id ? '...' : 'Approve'}
              </button>
            } />
          ))}
      </Section>

      <Section label="Approved collectors" count={collectors.length}>
        {collectors.length === 0
          ? <Empty>No approved collectors yet.</Empty>
          : collectors.map(r => (
            <PersonRow key={r.id} row={r} action={
              <button onClick={() => setResearcher(r.id, false)} disabled={busyId === r.id}
                className="shrink-0 border border-border hover:border-primary-300 hover:bg-surface-muted disabled:opacity-50 text-primary-600 text-sm font-medium px-4 py-1.5 rounded-lg transition-colors">
                {busyId === r.id ? '...' : 'Revoke'}
              </button>
            } />
          ))}
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
  )
}

// ---- Maps & publishing tab --------------------------------------------------

interface BoundaryRow {
  id: string
  geometry: Polygon
  researcher_id: string
  session_date: string | null
  respondent_relationship: string | null
  respondent_age_range: string | null
  years_in_neighborhood: string | null
  consent_given: boolean
  notes: string | null
  included_in_average: boolean
  created_at: string
  // Embedded collector profile (who submitted). PostgREST returns a single object
  // for a to-one FK, but supabase-js sometimes types it as an array.
  collector: { full_name: string | null; email: string | null } | { full_name: string | null; email: string | null }[] | null
}

function collectorOf(r: BoundaryRow): { full_name: string | null; email: string | null } | null {
  return Array.isArray(r.collector) ? (r.collector[0] ?? null) : r.collector
}
function collectorLabel(r: BoundaryRow): string {
  const c = collectorOf(r)
  return c?.full_name || c?.email || 'Unknown'
}
function collectorEmail(r: BoundaryRow): string {
  return collectorOf(r)?.email || '—'
}

interface PublishedRow {
  source_count: number
  threshold: number
  published_at: string
}

const TH = 'text-left font-mono text-[10px] tracking-wider uppercase text-primary-400 font-medium px-3 py-2 whitespace-nowrap'
const TD = 'px-3 py-2.5 text-sm text-primary-700 whitespace-nowrap'

function MapReview() {
  const { profile } = useAuth()
  const [rows, setRows] = useState<BoundaryRow[]>([])
  const [latest, setLatest] = useState<PublishedRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [filterCollector, setFilterCollector] = useState<string>('all')
  const [sortNewest, setSortNewest] = useState(true)

  const load = useCallback(async () => {
    setError('')
    const [{ data: boundaries, error: bErr }, { data: pub }] = await Promise.all([
      supabase
        .from('drawn_boundaries')
        .select('id, geometry, researcher_id, session_date, respondent_relationship, respondent_age_range, years_in_neighborhood, consent_given, notes, included_in_average, created_at, collector:profiles!researcher_id(full_name, email)')
        .order('created_at', { ascending: false }),
      supabase
        .from('published_averages')
        .select('source_count, threshold, published_at')
        .order('published_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])
    if (bErr) setError(bErr.message)
    else setRows((boundaries as unknown as BoundaryRow[]) ?? [])
    setLatest((pub as PublishedRow) ?? null)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function toggleInclude(id: string, value: boolean) {
    setBusyId(id); setError('')
    const { error } = await supabase.from('drawn_boundaries').update({ included_in_average: value }).eq('id', id)
    if (error) setError(error.message)
    else setRows(rs => rs.map(r => (r.id === id ? { ...r, included_in_average: value } : r)))
    setBusyId(null)
  }

  const included = rows.filter(r => r.included_in_average)

  async function publish() {
    setPublishing(true); setError(''); setNotice('')
    const avg = computeAverageShape(included.map(r => r.geometry), AVERAGE_THRESHOLD)
    if (!avg) {
      setError('Nothing to publish yet: the included maps do not share a majority-agreement area.')
      setPublishing(false)
      return
    }
    const { error } = await supabase.from('published_averages').insert({
      neighborhood: 'soulsville',
      geometry: avg.geometry,
      threshold: AVERAGE_THRESHOLD,
      source_count: avg.sourceCount,
      published_by: profile?.id ?? null,
    })
    if (error) setError(error.message)
    else {
      setNotice(`Published the community average from ${avg.sourceCount} map${avg.sourceCount === 1 ? '' : 's'}.`)
      await load()
    }
    setPublishing(false)
  }

  // Unique collectors present in the data, for the filter dropdown.
  const collectors = Array.from(
    new Map(rows.map(r => [r.researcher_id, collectorLabel(r)])).entries(),
  ).map(([id, label]) => ({ id, label }))

  // Filter is display-only; publishing always uses the included_in_average flag.
  const visible = rows
    .filter(r => filterCollector === 'all' || r.researcher_id === filterCollector)
    .sort((a, b) =>
      sortNewest
        ? b.created_at.localeCompare(a.created_at)
        : a.created_at.localeCompare(b.created_at),
    )

  if (loading) return <Spinner label="Loading submissions..." />

  return (
    <>
      {error && <ErrorBar>{error}</ErrorBar>}
      {notice && (
        <p className="text-sm bg-accent-50 border border-accent-200 text-accent-700 rounded-lg px-4 py-2.5 mb-6">{notice}</p>
      )}

      {/* Publish control */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-5 mb-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-display text-xl text-primary-900 mb-1">Community average map</h2>
            <p className="text-sm text-primary-500">
              {included.length} of {rows.length} map{rows.length === 1 ? '' : 's'} included. Publishing recomputes the
              area a majority of them agreed on and posts it to the public map.
            </p>
            <p className="font-mono text-[11px] text-primary-400 mt-2">
              {latest
                ? `Last published ${fmtDate(latest.published_at)} from ${latest.source_count} map${latest.source_count === 1 ? '' : 's'}.`
                : 'Not published yet.'}
            </p>
          </div>
          <button onClick={publish} disabled={publishing || included.length === 0}
            className="shrink-0 bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors">
            {publishing ? 'Publishing...' : 'Publish community map'}
          </button>
        </div>
      </div>

      {/* Filter + sort controls */}
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <h2 className="font-mono text-[11px] tracking-[0.18em] uppercase text-primary-400">
          Submitted maps ({visible.length}{filterCollector !== 'all' ? ` of ${rows.length}` : ''})
        </h2>
        <div className="flex items-center gap-2 ml-auto">
          <label className="font-mono text-[10px] tracking-wider uppercase text-primary-400">Collector</label>
          <select value={filterCollector} onChange={e => setFilterCollector(e.target.value)}
            className="bg-white border border-border rounded-lg px-2.5 py-1.5 text-sm text-primary-700 focus:outline-none focus:border-accent-500">
            <option value="all">All collectors</option>
            {collectors.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <button onClick={() => setSortNewest(s => !s)}
            className="border border-border hover:border-primary-300 rounded-lg px-3 py-1.5 text-sm text-primary-600 transition-colors">
            {sortNewest ? 'Newest first' : 'Oldest first'} {sortNewest ? '↓' : '↑'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        {visible.length === 0 ? (
          <Empty>No resident maps to show.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface-muted/40">
                  <th className={TH}>Incl.</th>
                  <th className={TH}>Collector</th>
                  <th className={TH}>Email</th>
                  <th className={TH}>Submitted</th>
                  <th className={TH}>Session</th>
                  <th className={TH}>Relationship</th>
                  <th className={TH}>Age</th>
                  <th className={TH}>Years here</th>
                  <th className={TH}>Consent</th>
                  <th className={TH}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {visible.map(r => (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-surface-muted/50">
                    <td className={TD}>
                      <input type="checkbox" checked={r.included_in_average} disabled={busyId === r.id}
                        onChange={e => toggleInclude(r.id, e.target.checked)}
                        className="accent-accent-500 w-4 h-4 align-middle" />
                    </td>
                    <td className={`${TD} font-medium text-primary-900`}>{collectorLabel(r)}</td>
                    <td className={`${TD} font-mono text-[12px] text-primary-500`}>{collectorEmail(r)}</td>
                    <td className={TD}>{fmtDate(r.created_at)}</td>
                    <td className={TD}>{fmtDate(r.session_date)}</td>
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
    </>
  )
}

// ---- small shared UI --------------------------------------------------------

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

// ---- page shell -------------------------------------------------------------

export default function AdminPage() {
  const [tab, setTab] = useState<'access' | 'maps'>('access')

  const tabClass = (active: boolean) =>
    `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      active ? 'bg-primary-900 text-white' : 'text-primary-500 hover:text-primary-900 hover:bg-surface-muted'
    }`

  return (
    <div className="flex-1 overflow-auto bg-surface-page">
      <div className={`${tab === 'maps' ? 'max-w-5xl' : 'max-w-2xl'} mx-auto px-4 pt-24 pb-16 transition-[max-width]`}>
        <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-primary-400 mb-2">Admin console</p>
        <h1 className="font-display text-4xl text-primary-900 mb-5">Study administration</h1>

        <div className="flex items-center gap-1 mb-8 bg-white border border-border rounded-xl p-1 w-fit">
          <button className={tabClass(tab === 'access')} onClick={() => setTab('access')}>Access requests</button>
          <button className={tabClass(tab === 'maps')} onClick={() => setTab('maps')}>Maps &amp; publishing</button>
        </div>

        {tab === 'access' ? <AccessRequests /> : <MapReview />}
      </div>
    </div>
  )
}
