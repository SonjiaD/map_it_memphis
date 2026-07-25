import { useMemo } from 'react'
import { computeShapeOverlapStat } from '../../lib/consensusHeatmap'
import { useStaticGeojson } from './useStaticGeojson'
import type { PublishedAverage } from '../../hooks/usePublishedAverage'

// Overlap between the published community-average boundary and the official
// Memphis 3.0 South District boundary. Hidden until something has been published.
export function StatCallout({ average }: { average: PublishedAverage }) {
  const southDistrict = useStaticGeojson('/memphis/memphis30_south_district.geojson')

  const overlapPct = useMemo(
    () => computeShapeOverlapStat(average.geometry, southDistrict),
    [average.geometry, southDistrict],
  )

  return (
    <div className="absolute bottom-24 right-4 z-[1000] bg-white rounded-2xl shadow-xl border border-border px-5 py-4 max-w-[250px]">
      <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-gray-400 mb-1.5">Resident vs official</p>
      {overlapPct !== null ? (
        <>
          <p className="font-display text-5xl text-accent-600 leading-none mb-1.5">{overlapPct}%</p>
          <p className="text-xs text-gray-500 leading-snug">
            of the community-drawn boundary falls inside the official South District boundary
          </p>
        </>
      ) : (
        <p className="text-sm text-gray-600 leading-snug">
          <span className="font-display text-3xl text-accent-600">{average.sourceCount}</span>{' '}
          resident map{average.sourceCount === 1 ? '' : 's'} behind this boundary
        </p>
      )}
    </div>
  )
}
