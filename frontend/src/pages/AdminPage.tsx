import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { computeAverageShape } from '../lib/consensusHeatmap'
import { downloadShapefile, downloadAllShapefiles } from '../lib/shapefileExport'
import { CustomSelect } from '../components/CustomSelect'
import type { Polygon } from 'geojson'

// Admin console.
//   Access requests: approve/revoke who can collect field data.
//   Maps & publishing: curate which submitted maps count toward the community
//     average, then publish a single averaged shape (the public-facing output).
//     Also: download individual submitted maps as Shapefiles.
// All backed by the admin RLS policies from migrations 0005 + 0006.

const AVERAGE_THRESHOLD = 0.5 // majority agreement

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

// Memphis is Central Time. Session start/end are stored UTC; show them in the field
// team's local time so the numbers match what happened on the ground.
const MEMPHIS_TZ = 'America/Chicago'
const fmtDateCT = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { timeZone: MEMPHIS_TZ, month: 'short', day: 'numeric', year: 'numeric' }) : '—'
const fmtTimeCT = (iso: string | null) =>
  iso ? new Date(iso).toLocaleTimeString('en-US', { timeZone: MEMPHIS_TZ, hour: 'numeric', minute: '2-digit' }) : '—'

// Filename convention for downloaded maps: {n}_{researcher}_{yyyy-mm-dd}_{hhmm}ct,
// e.g. 1_sonja_deng_2026-07-22_1430ct. Date/time in Memphis local time.
function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'unknown'
}
function shapefileFilename(num: number, collectorName: string, startedAt: string | null): string {
  const d = startedAt ? new Date(startedAt) : new Date()
  // en-CA gives YYYY-MM-DD; extract HH and MM in Memphis time for the suffix.
  const date = d.toLocaleDateString('en-CA', { timeZone: MEMPHIS_TZ })
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: MEMPHIS_TZ, hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(d)
  const hh = parts.find(p => p.type === 'hour')?.value ?? '00'
  const mm = parts.find(p => p.type === 'minute')?.value ?? '00'
  return `${num}_${slugify(collectorName)}_${date}_${hh}${mm}ct`
}

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
  started_at: string | null
  ended_at: string | null
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
  const [downloadingAll, setDownloadingAll] = useState(false)
  // Synchronous re-entrancy guard: computeAverageShape below runs before the first
  // await, so React won't repaint the "Publishing..." state until it's done. A ref
  // (unlike useState) updates immediately, so it actually blocks a second click
  // fired inside that window, which `disabled={publishing}` alone cannot.
  const publishingRef = useRef(false)
  const downloadingAllRef = useRef(false)

  const load = useCallback(async () => {
    setError('')
    const [{ data: boundaries, error: bErr }, { data: pub }] = await Promise.all([
      supabase
        .from('drawn_boundaries')
        .select('id, geometry, researcher_id, session_date, started_at, ended_at, respondent_relationship, respondent_age_range, years_in_neighborhood, consent_given, notes, included_in_average, created_at, collector:profiles!researcher_id(full_name, email)')
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
    if (publishingRef.current) return
    publishingRef.current = true
    setPublishing(true); setError(''); setNotice('')
    try {
      // Yield to the browser so it actually paints the "Publishing..." state
      // before the synchronous grid computation below blocks the main thread.
      await new Promise(resolve => setTimeout(resolve, 0))

      const avg = computeAverageShape(included.map(r => r.geometry), AVERAGE_THRESHOLD)
      if (!avg) {
        setError('Nothing to publish yet: the included maps do not share a majority-agreement area.')
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
    } finally {
      publishingRef.current = false
      setPublishing(false)
    }
  }

  // Unique collectors present in the data, for the filter dropdown.
  const collectors = Array.from(
    new Map(rows.map(r => [r.researcher_id, collectorLabel(r)])).entries(),
  ).map(([id, label]) => ({ id, label }))

  // Per-researcher download number: within each collector's own maps, ordered by
  // session start, 1..N. Stable across per-row and bulk downloads so filenames match.
  const numberById = useMemo(() => {
    const byResearcher = new Map<string, BoundaryRow[]>()
    for (const r of rows) {
      const list = byResearcher.get(r.researcher_id) ?? []
      list.push(r)
      byResearcher.set(r.researcher_id, list)
    }
    const map = new Map<string, number>()
    for (const list of byResearcher.values()) {
      list
        .slice()
        .sort((a, b) => (a.started_at ?? a.created_at).localeCompare(b.started_at ?? b.created_at))
        .forEach((r, i) => map.set(r.id, i + 1))
    }
    return map
  }, [rows])

  // Short, DBF-safe (8-char field-name limit) attributes baked into each shapefile.
  function shapefileProps(r: BoundaryRow) {
    return {
      num: numberById.get(r.id) ?? 0,
      collector: collectorLabel(r),
      email: collectorEmail(r),
      start_ct: `${fmtDateCT(r.started_at)} ${fmtTimeCT(r.started_at)}`,
      end_ct: `${fmtDateCT(r.ended_at)} ${fmtTimeCT(r.ended_at)}`,
      relation: r.respondent_relationship ?? '',
      age: r.respondent_age_range ?? '',
      years: r.years_in_neighborhood ?? '',
      consent: r.consent_given ? 'yes' : 'no',
      notes: r.notes ?? '',
    }
  }
  function fileBase(r: BoundaryRow) {
    return shapefileFilename(numberById.get(r.id) ?? 0, collectorLabel(r), r.started_at)
  }

  function downloadOne(r: BoundaryRow) {
    downloadShapefile(r.geometry, shapefileProps(r), fileBase(r))
  }

  async function downloadAll() {
    if (downloadingAllRef.current || rows.length === 0) return
    downloadingAllRef.current = true
    setDownloadingAll(true); setError('')
    try {
      await new Promise(resolve => setTimeout(resolve, 0)) // let the spinner paint
      await downloadAllShapefiles(
        rows.map(r => ({ geometry: r.geometry, properties: shapefileProps(r), folderName: fileBase(r) })),
        `mapp-submissions_${new Date().toLocaleDateString('en-CA', { timeZone: MEMPHIS_TZ })}`,
      )
    } catch (e: any) {
      setError(e?.message || 'Could not build the download.')
    } finally {
      downloadingAllRef.current = false
      setDownloadingAll(false)
    }
  }

  // Filter is display-only; publishing always uses the included_in_average flag.
  const visible = rows
    .filter(r => filterCollector === 'all' || r.researcher_id === filterCollector)
    .sort((a, b) => {
      const av = a.started_at ?? a.created_at
      const bv = b.started_at ?? b.created_at
      return sortNewest ? bv.localeCompare(av) : av.localeCompare(bv)
    })

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
            className="shrink-0 flex items-center gap-2 bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors">
            {publishing && <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
            {publishing ? 'Publishing...' : 'Publish community map'}
          </button>
        </div>
      </div>

      {/* Filter + sort + bulk-download controls */}
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <h2 className="font-mono text-[11px] tracking-[0.18em] uppercase text-primary-400">
          Submitted maps ({visible.length}{filterCollector !== 'all' ? ` of ${rows.length}` : ''})
        </h2>
        <div className="flex items-center gap-2 ml-auto">
          <button onClick={downloadAll} disabled={downloadingAll || rows.length === 0}
            title="Download every submitted map as Shapefiles, one zip"
            className="flex items-center gap-2 bg-primary-900 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors">
            {downloadingAll && <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
            {downloadingAll ? 'Preparing...' : `Download all (${rows.length})`}
          </button>
          <label className="font-mono text-[10px] tracking-wider uppercase text-primary-400 ml-1">Collector</label>
          <CustomSelect
            className="w-44"
            value={filterCollector}
            onChange={setFilterCollector}
            options={[{ value: 'all', label: 'All collectors' }, ...collectors.map(c => ({ value: c.id, label: c.label }))]}
          />
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
                  <th className={TH}>#</th>
                  <th className={TH}>Collector</th>
                  <th className={TH}>Email</th>
                  <th className={TH}>Date</th>
                  <th className={TH} title="Start = when the researcher began drawing the map. End = when they saved. Shown in Memphis local time (CT).">Start · CT</th>
                  <th className={TH} title="Start = when the researcher began drawing the map. End = when they saved. Shown in Memphis local time (CT).">End · CT</th>
                  <th className={TH}>Relationship</th>
                  <th className={TH}>Age</th>
                  <th className={TH}>Years here</th>
                  <th className={TH}>Consent</th>
                  <th className={TH}>Notes</th>
                  <th className={TH}>Download</th>
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
                    <td className={`${TD} font-mono text-primary-400`}>{numberById.get(r.id) ?? '—'}</td>
                    <td className={`${TD} font-medium text-primary-900`}>{collectorLabel(r)}</td>
                    <td className={`${TD} font-mono text-[12px] text-primary-500`}>{collectorEmail(r)}</td>
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
                    <td className={TD}>
                      <button onClick={() => downloadOne(r)}
                        title={`Download ${fileBase(r)}.zip (Shapefile)`}
                        className="inline-flex items-center gap-1.5 border border-border hover:border-primary-300 hover:bg-surface-muted text-primary-700 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors">
                        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 19h16" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        SHP
                      </button>
                    </td>
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
