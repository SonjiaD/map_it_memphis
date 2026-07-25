import { squareGrid, booleanIntersects, intersect, union, area, bbox, featureCollection } from '@turf/turf'
import type { Feature, FeatureCollection, Polygon, MultiPolygon } from 'geojson'

// Builds the resident-consensus heatmap in the browser. Grid cells over the study
// area count how many resident-drawn polygons cover them; agreementPct drives the
// fill shading. Pilot scale (tens to low hundreds of polygons) computes in well
// under a second, so this runs live on page load and on every realtime insert.
//
// Each counted cell is CLIPPED to the union of all drawn boundaries, so the shaded
// surface's outer edge follows the resident-drawn lines instead of overshooting in
// a staircase of whole squares (the "minecraft" leak). Interior cells stay square;
// only edge cells get trimmed.

// Padded around the Soulsville study area; matches the pipeline BOUNDARY_CLIP
// so the grid always covers everything a resident could plausibly draw.
const GRID_BBOX: [number, number, number, number] = [-90.12, 35.02, -89.92, 35.19]
const CELL_SIZE_KM = 0.08

export interface HeatmapCellProps {
  agreementCount: number
  agreementPct: number
}

// A heatmap cell can be a Polygon (square interior) or MultiPolygon (an edge cell
// clipped against a concave boundary can split into pieces).
export type HeatmapCell = Feature<Polygon | MultiPolygon, HeatmapCellProps>

export function computeHeatmap(
  boundaries: Polygon[],
): FeatureCollection<Polygon | MultiPolygon, HeatmapCellProps> {
  if (boundaries.length === 0) return featureCollection([])

  const boundaryFeatures = boundaries.map(
    g => ({ type: 'Feature' as const, properties: {}, geometry: g }),
  )

  // Union of every drawn boundary, used to clip cells to the resident outline.
  // With a single boundary the union is just that boundary.
  let boundaryUnion: Feature<Polygon | MultiPolygon> | null = boundaryFeatures[0]
  for (let i = 1; i < boundaryFeatures.length; i++) {
    if (!boundaryUnion) break
    boundaryUnion = union(featureCollection([boundaryUnion, boundaryFeatures[i]]))
  }

  // Only grid the area residents actually drew over, not the whole clip bbox
  const drawnBbox = bbox(featureCollection(boundaryFeatures))
  const gridBbox: [number, number, number, number] = [
    Math.max(drawnBbox[0], GRID_BBOX[0]),
    Math.max(drawnBbox[1], GRID_BBOX[1]),
    Math.min(drawnBbox[2], GRID_BBOX[2]),
    Math.min(drawnBbox[3], GRID_BBOX[3]),
  ]

  const grid = squareGrid(gridBbox, CELL_SIZE_KM, { units: 'kilometers' })
  const cells: HeatmapCell[] = []

  for (const cell of grid.features) {
    let count = 0
    for (const boundary of boundaries) {
      if (booleanIntersects(cell, boundary)) count++
    }
    if (count === 0) continue

    // Clip the square to the resident outline so edges hug the drawn line.
    const clipped = boundaryUnion
      ? intersect(featureCollection([cell, boundaryUnion]))
      : cell
    if (!clipped) continue

    cells.push({
      ...clipped,
      properties: { agreementCount: count, agreementPct: count / boundaries.length },
    })
  }

  return featureCollection(cells)
}

// The single "averaged" community shape: the region a MAJORITY (>= threshold) of the
// included resident maps agreed on, dissolved into one polygon. This is what the
// admin publishes as the public-facing output. Reuses the same agreement grid as the
// heatmap, then unions the qualifying cells into one shape.
export function computeAverageShape(
  boundaries: Polygon[],
  threshold = 0.5,
): { geometry: Polygon | MultiPolygon; sourceCount: number } | null {
  if (boundaries.length === 0) return null

  const heatmap = computeHeatmap(boundaries)
  const cells = heatmap.features.filter(f => f.properties.agreementPct >= threshold)
  if (cells.length === 0) return null

  let acc: Feature<Polygon | MultiPolygon> = cells[0]
  for (let i = 1; i < cells.length; i++) {
    const merged = union(featureCollection([acc, cells[i]]))
    if (merged) acc = merged
  }
  return { geometry: acc.geometry, sourceCount: boundaries.length }
}

// Share of the resident consensus area (cells at/above the agreement threshold)
// that falls inside an official boundary, as a whole percent. The official layer
// must be a single meaningful unit (e.g. the Memphis 3.0 South District), not a
// tiling layer like all census tracts, which would trivially cover everything.
export function computeOverlapStat(
  heatmapCells: FeatureCollection<Polygon | MultiPolygon, HeatmapCellProps>,
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
      const clipped = intersect(featureCollection([cell, poly]))
      if (clipped) cellBest = Math.max(cellBest, area(clipped))
    }
    intersectionArea += cellBest
  }

  if (consensusArea === 0) return null
  return Math.round((intersectionArea / consensusArea) * 100)
}
