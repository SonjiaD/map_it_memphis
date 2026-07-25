import { AMENITY_CATEGORIES } from './pins'
import { BOUNDARY_ROWS, type LayerState } from './LayerTogglePanel'

interface LegendEntry {
  label: string
  swatch: string
  dashed?: boolean
}

// Compact bottom-left legend of whatever layers are currently on. Hidden when
// only the basemap is showing.
export function Legend({ layers }: { layers: LayerState }) {
  const entries: LegendEntry[] = []

  for (const row of BOUNDARY_ROWS) {
    if (layers[row.key as keyof LayerState]) {
      entries.push({ label: row.label, swatch: row.swatch, dashed: row.dashed })
    }
  }
  if (layers.communityAverage) entries.push({ label: 'Community-drawn boundary', swatch: '#b8593a' })
  for (const cat of AMENITY_CATEGORIES) {
    if (layers.amenities[cat.key]) entries.push({ label: cat.label, swatch: cat.color })
  }
  if (layers.transit) entries.push({ label: 'MATA routes', swatch: '#2563eb' })
  if (layers.knowledgeQuest) entries.push({ label: 'Knowledge Quest', swatch: '#d97706' })

  if (entries.length === 0) return null

  return (
    <div className="pointer-events-auto bg-white/95 backdrop-blur rounded-xl shadow-lg border border-border px-3.5 py-2.5 max-w-[220px]">
      <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-gray-400 mb-1.5">Showing</p>
      <ul className="space-y-1">
        {entries.map(e => (
          <li key={e.label} className="flex items-center gap-2 text-xs text-gray-700">
            {e.dashed
              ? <span className="w-3.5 h-0 shrink-0 border-t-2 border-dashed" style={{ borderColor: e.swatch }} />
              : <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: e.swatch }} />}
            <span className="truncate">{e.label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
