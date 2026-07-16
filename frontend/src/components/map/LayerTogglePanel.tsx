import { useState } from 'react'
import { AMENITY_CATEGORIES } from './pins'

// Which layers are visible on the public map. Census tracts are the only layer on
// by default (plus the single Knowledge Quest partner pin); everything else starts
// off to keep the first view uncluttered.
export interface LayerState {
  censusTracts: boolean
  zipCodes: boolean
  southDistrict: boolean
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
  amenities: Object.fromEntries(AMENITY_CATEGORIES.map(c => [c.key, false])),
  transit: false,
  knowledgeQuest: true,
  residentHeatmap: false,
  residentBoundaries: false,
  residentPins: false,
}

function Toggle({ label, checked, onChange, swatch }: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
  swatch?: string
}) {
  return (
    <label className="flex items-center gap-2 py-1 px-1 rounded cursor-pointer hover:bg-gray-50 text-sm text-gray-700 select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="accent-teal-600 w-4 h-4"
      />
      {swatch && <span className="w-3 h-3 rounded-full shrink-0" style={{ background: swatch }} />}
      {label}
    </label>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-3 last:mb-0">
      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1 px-1">{title}</p>
      {children}
    </div>
  )
}

export function LayerTogglePanel({ layers, onChange }: {
  layers: LayerState
  onChange: (next: LayerState) => void
}) {
  const [open, setOpen] = useState(true)

  return (
    <div className="absolute top-3 right-3 z-[1000] w-60">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
        >
          Map layers
          <span className="text-gray-400">{open ? '▾' : '▸'}</span>
        </button>

        {open && (
          <div className="px-2 pb-3 max-h-[65vh] overflow-y-auto">
            <Group title="Official boundaries">
              <Toggle label="Census tracts" swatch="#6b7280" checked={layers.censusTracts}
                onChange={v => onChange({ ...layers, censusTracts: v })} />
              <Toggle label="Zip codes" swatch="#374151" checked={layers.zipCodes}
                onChange={v => onChange({ ...layers, zipCodes: v })} />
              <Toggle label="Memphis 3.0 South District" swatch="#b8593a" checked={layers.southDistrict}
                onChange={v => onChange({ ...layers, southDistrict: v })} />
            </Group>

            <Group title="Resident data">
              <Toggle label="Consensus heatmap" swatch="#b8593a" checked={layers.residentHeatmap}
                onChange={v => onChange({ ...layers, residentHeatmap: v })} />
              <Toggle label="Drawn boundaries" swatch="#c96d4f" checked={layers.residentBoundaries}
                onChange={v => onChange({ ...layers, residentBoundaries: v })} />
              <Toggle label="Asset pins" swatch="#db2777" checked={layers.residentPins}
                onChange={v => onChange({ ...layers, residentPins: v })} />
            </Group>

            <Group title="Community assets">
              {AMENITY_CATEGORIES.map(cat => (
                <Toggle key={cat.key} label={cat.label} swatch={cat.color}
                  checked={layers.amenities[cat.key] ?? false}
                  onChange={v => onChange({ ...layers, amenities: { ...layers.amenities, [cat.key]: v } })} />
              ))}
              <Toggle label="Knowledge Quest (partner)" swatch="#d97706" checked={layers.knowledgeQuest}
                onChange={v => onChange({ ...layers, knowledgeQuest: v })} />
            </Group>

            <Group title="Transit">
              <Toggle label="MATA stops and routes" swatch="#2563eb" checked={layers.transit}
                onChange={v => onChange({ ...layers, transit: v })} />
            </Group>
          </div>
        )}
      </div>
    </div>
  )
}
