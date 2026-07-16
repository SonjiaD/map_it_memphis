import { squareGrid, booleanIntersects, intersect, area, bbox, featureCollection } from '@turf/turf'
import type { Feature, FeatureCollection, Polygon, MultiPolygon } from 'geojson'

// Builds the resident-consensus heatmap in the browser. Grid cells over the study
// area count how many resident-drawn polygons cover them; agreementPct drives the
// fill shading. Pilot scale (tens to low hundreds of polygons) computes in well
// under a second, so this runs live on page load and on every realtime insert.

// Padded around the Soulsville study area; matches the pipeline BOUNDARY_CLIP
// so the grid always covers everything a resident could plausibly draw.
const GRID_BBOX: [number, number, number, number] = [-90.12, 35.02, -89.92, 35.19]
const CELL_SIZE_KM = 0.25

export interface HeatmapCellProps {
  agreementCount: number
  agreementPct: number
}

export function computeHeatmap(
  boundaries: Polygon[],
): FeatureCollection<Polygon, HeatmapCellProps> {
  if (boundaries.length === 0) return featureCollection([])

  // Only grid the area residents actually drew over, not the whole clip bbox
  const drawn = featureCollection(boundaries.map(g => ({ type: 'Feature' as const, properties: {}, geometry: g })))
  const drawnBbox = bbox(drawn)
  const gridBbox: [number, number, number, number] = [
    Math.max(drawnBbox[0], GRID_BBOX[0]),
    Math.max(drawnBbox[1], GRID_BBOX[1]),
    Math.min(drawnBbox[2], GRID_BBOX[2]),
    Math.min(drawnBbox[3], GRID_BBOX[3]),
  ]

  const grid = squareGrid(gridBbox, CELL_SIZE_KM, { units: 'kilometers' })
  const cells: Feature<Polygon, HeatmapCellProps>[] = []

  for (const cell of grid.features) {
    let count = 0
    for (const boundary of boundaries) {
      if (booleanIntersects(cell, boundary)) count++
    }
    if (count > 0) {
      cells.push({
        ...cell,
        properties: { agreementCount: count, agreementPct: count / boundaries.length },
      })
    }
  }

  return featureCollection(cells)
}

// Share of the resident consensus area (cells at/above the agreement threshold)
// that falls inside an official boundary, as a whole percent. The official layer
// must be a single meaningful unit (e.g. the Memphis 3.0 South District), not a
// tiling layer like all census tracts, which would trivially cover everything.
export function computeOverlapStat(
  heatmapCells: FeatureCollection<Polygon, HeatmapCellProps>,
  official: FeatureCollection | null,
  threshold = 0.5,
): number | null {
  if (!official || heatmapCells.features.length === 0) return null

  const consensusCells = heatmapCells.features.filter(f => f.properties.agreementPct >= threshold)
  if (consensusCells.length === 0) return null

  const officialPolys = official.features.filter(
    (f): f is Feature<Polygon | MultiPolygon> =>
      f.geometry?.type === 'Polygon' || f.geometry?.type === 'MultiPolygon',
  )
  if (officialPolys.length === 0) return null

  const consensusArea = consensusCells.reduce((sum, c) => sum + area(c), 0)

  // Intersection area: per cell, take the largest overlap with any official
  // feature (cells are small, so a cell effectively belongs to one tract).
  let intersectionArea = 0
  for (const cell of consensusCells) {
    let cellBest = 0
    for (const poly of officialPolys) {
      const clipped = intersect(featureCollection([cell as Feature<Polygon | MultiPolygon>, poly]))
      if (clipped) cellBest = Math.max(cellBest, area(clipped))
    }
    intersectionArea += cellBest
  }

  if (consensusArea === 0) return null
  return Math.round((intersectionArea / consensusArea) * 100)
}
