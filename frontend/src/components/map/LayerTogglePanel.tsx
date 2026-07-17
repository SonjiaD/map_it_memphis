import { useState } from 'react'
import { AMENITY_CATEGORIES } from './pins'
import { BOUNDARY_COLORS } from './OfficialLayers'
import { useLayerStatus } from './useStaticGeojson'

// Which layers are visible on the public map. Census tracts + the Soulsville
// study-area outline are on by default (plus the single Knowledge Quest partner
// pin); everything else starts off to keep the first view uncluttered.
export interface LayerState {
  censusTracts: boolean
  zipCodes: boolean
  southDistrict: boolean
  studyArea: boolean
  amenities: Record<string, boolean>
  transit: boolean
  knowledgeQuest: boolean
  residentHeatmap: boolean
  residentBoundaries: boolean
  residentPins: boolean
}

export const DEFAULT_LAYER_STATE: LayerState = {
  censusTracts: true,
  zipCodes: false,
  southDistrict: false,
  studyArea: true,
  amenities: Object.fromEntries(AMENITY_CATEGORIES.map(c => [c.key, false])),
  transit: false,
  knowledgeQuest: true,
  residentHeatmap: false,
  residentBoundaries: false,
  residentPins: false,
}

// Panel metadata shared with the Legend component.
export interface LayerRowMeta {
  key: string
  label: string
  swatch: string
  dashed?: boolean
  url?: string
}

export const BOUNDARY_ROWS: LayerRowMeta[] = [
  { key: 'censusTracts', label: 'Census tracts', swatch: BOUNDARY_COLORS.censusTracts, url: '/memphis/census_tracts.geojson' },
  { key: 'zipCodes', label: 'Zip codes', swatch: BOUNDARY_COLORS.zipCodes, dashed: true, url: '/memphis/zip_codes.geojson' },
  { key: 'southDistrict', label: 'Memphis 3.0 South District', swatch: BOUNDARY_COLORS.southDistrict, url: '/memphis/memphis30_south_district.geojson' },
  { key: 'studyArea', label: 'Soulsville study area', swatch: BOUNDARY_COLORS.studyArea, dashed: true, url: '/memphis/soulsville_study_area.geojson' },
]

function StatusBadge({ url }: { url?: string }) {
  const status = useLayerStatus(url ?? '')
  if (!url || status.state === 'idle') return null
  if (status.state === 'loading') {
    return (
      <span className="ml-auto shrink-0 w-3.5 h-3.5 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
    )
  }
  if (status.state === 'error') {
    return (
      <span className="ml-auto shrink-0 w-2 h-2 rounded-full bg-red-500" title="This layer failed to load. Try refreshing the page." />
    )
  }
  return (
    <span className="ml-auto shrink-0 font-mono text-[10px] text-gray-400">{status.count}</span>
  )
}

function Toggle({ label, checked, onChange, swatch, dashed, url }: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
  swatch?: string
  dashed?: boolean
  url?: string
}) {
  return (
    <label className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg cursor-pointer hover:bg-surface-muted text-sm text-gray-700 select-none transition-colors">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="accent-primary-700 w-4 h-4 shrink-0"
      />
      {swatch && (
        dashed
          ? <span className="w-3.5 h-0 shrink-0 border-t-2 border-dashed" style={{ borderColor: swatch }} />
          : <span className="w-3 h-3 rounded-full shrink-0" style={{ background: swatch }} />
      )}
      <span className="truncate">{label}</span>
      <StatusBadge url={url} />
    </label>
  )
}

function Group({ title, children, defaultOpen = true }: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="mb-1 last:mb-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-2 py-1.5 font-mono text-[10px] tracking-[0.18em] uppercase text-gray-400 hover:text-gray-600"
      >
        {title}
        <svg viewBox="0 0 16 16" className={`w-3 h-3 transition-transform ${open ? '' : '-rotate-90'}`} fill="currentColor">
          <path d="M4.4 6l3.6 3.6L11.6 6H4.4z" />
        </svg>
      </button>
      {open && children}
    </div>
  )
}

export function LayerTogglePanel({ layers, onChange, residentBoundaryCount }: {
  layers: LayerState
  onChange: (next: LayerState) => void
  residentBoundaryCount: number
}) {
  const [open, setOpen] = useState(true)

  return (
    <div className="absolute top-4 right-4 z-[1000] w-64">
      <div className="bg-white rounded-2xl shadow-xl border border-border overflow-hidden">
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-muted transition-colors"
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-primary-900">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-primary-700" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 3l9 5-9 5-9-5 9-5z" /><path d="M3 13l9 5 9-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Map layers
          </span>
          <svg viewBox="0 0 16 16" className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? '' : '-rotate-90'}`} fill="currentColor">
            <path d="M4.4 6l3.6 3.6L11.6 6H4.4z" />
          </svg>
        </button>

        {open && (
          <div className="px-2 pb-3 max-h-[calc(100vh-10rem)] overflow-y-auto">
            <Group title="Official boundaries">
              {BOUNDARY_ROWS.map(row => (
                <Toggle
                  key={row.key}
                  label={row.label}
                  swatch={row.swatch}
                  dashed={row.dashed}
                  url={row.url}
                  checked={layers[row.key as 'censusTracts' | 'zipCodes' | 'southDistrict' | 'studyArea']}
                  onChange={v => onChange({ ...layers, [row.key]: v })}
                />
              ))}
            </Group>

            <Group title="Resident data">
              <Toggle label="Consensus heatmap" swatch="#b8593a" checked={layers.residentHeatmap}
                onChange={v => onChange({ ...layers, residentHeatmap: v })} />
              <Toggle label={`Drawn boundaries${residentBoundaryCount > 0 ? ` (${residentBoundaryCount})` : ''}`}
                swatch="#c96d4f" checked={layers.residentBoundaries}
                onChange={v => onChange({ ...layers, residentBoundaries: v })} />
              <Toggle label="Asset pins" swatch="#db2777" checked={layers.residentPins}
                onChange={v => onChange({ ...layers, residentPins: v })} />
            </Group>

            <Group title="Community assets" defaultOpen={false}>
              {AMENITY_CATEGORIES.map(cat => (
                <Toggle key={cat.key} label={cat.label} swatch={cat.color}
                  url={`/memphis/amenities/${cat.key}.geojson`}
                  checked={layers.amenities[cat.key] ?? false}
                  onChange={v => onChange({ ...layers, amenities: { ...layers.amenities, [cat.key]: v } })} />
              ))}
              <Toggle label="Knowledge Quest (partner)" swatch="#d97706" checked={layers.knowledgeQuest}
                onChange={v => onChange({ ...layers, knowledgeQuest: v })} />
            </Group>

            <Group title="Transit" defaultOpen={false}>
              <Toggle label="MATA routes" swatch="#2563eb"
                url="/memphis/transit/routes.geojson"
                checked={layers.transit}
                onChange={v => onChange({ ...layers, transit: v })} />
            </Group>
          </div>
        )}
      </div>
    </div>
  )
}
