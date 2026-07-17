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
    <div className="absolute bottom-24 right-4 z-[1000] bg-white rounded-2xl shadow-xl border border-border px-5 py-4 max-w-[250px]">
      <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-gray-400 mb-1.5">Resident vs official</p>
      {overlapPct !== null ? (
        <>
          <p className="font-display text-5xl text-accent-600 leading-none mb-1.5">{overlapPct}%</p>
          <p className="text-xs text-gray-500 leading-snug">
            of the resident-drawn consensus area falls inside the official South District boundary
          </p>
        </>
      ) : (
        <p className="text-sm text-gray-600 leading-snug">
          <span className="font-display text-3xl text-accent-600">{boundaryCount}</span>{' '}
          resident boundar{boundaryCount === 1 ? 'y' : 'ies'} collected so far
        </p>
      )}
    </div>
  )
}
