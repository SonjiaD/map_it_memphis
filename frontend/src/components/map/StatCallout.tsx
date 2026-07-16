import { useMemo } from 'react'
import { computeOverlapStat, type HeatmapCellProps } from '../../lib/consensusHeatmap'
import { useStaticGeojson } from './useStaticGeojson'
import type { FeatureCollection, Polygon } from 'geojson'

// Live overlap stat between the resident consensus area and the official
// Memphis 3.0 South District boundary. Hidden until there are submissions.
export function StatCallout({ heatmap, boundaryCount }: {
  heatmap: FeatureCollection<Polygon, HeatmapCellProps>
  boundaryCount: number
}) {
  const southDistrict = useStaticGeojson('/memphis/memphis30_south_district.geojson')

  const overlapPct = useMemo(
    () => computeOverlapStat(heatmap, southDistrict),
    [heatmap, southDistrict],
  )

  if (boundaryCount === 0) return null

  return (
    <div className="absolute bottom-6 right-3 z-[1000] bg-primary-900/95 text-white rounded-xl shadow-lg px-4 py-3 max-w-[240px]">
      <p className="text-[11px] font-bold uppercase tracking-wider text-teal-400 mb-1">Resident vs official</p>
      {overlapPct !== null ? (
        <p className="text-sm leading-snug">
          <span className="text-2xl font-bold">{overlapPct}%</span>{' '}
          of the resident-drawn consensus area falls inside the official South District boundary
        </p>
      ) : (
        <p className="text-sm leading-snug text-teal-200">
          {boundaryCount} resident boundar{boundaryCount === 1 ? 'y' : 'ies'} collected so far
        </p>
      )}
    </div>
  )
}
