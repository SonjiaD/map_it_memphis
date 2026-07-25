import * as shpwrite from 'shp-write'
import type { Polygon, MultiPolygon, Feature, FeatureCollection } from 'geojson'

// shp-write's polygon exporter matches features by the literal string "Polygon"
// and silently drops anything else (see its src/geojson.js isType check), so a
// MultiPolygon geometry would zip up as an empty, seemingly-valid-but-broken
// archive. The union of many resident boundaries can legitimately produce a
// MultiPolygon (disjoint agreement areas), so normalize into one Polygon feature
// per part before handing off to shp-write.
function toPolygonFeatures(
  geometry: Polygon | MultiPolygon,
  properties: Record<string, unknown>,
): Feature<Polygon>[] {
  if (geometry.type === 'Polygon') {
    return [{ type: 'Feature', properties, geometry }]
  }
  return geometry.coordinates.map(coordinates => ({
    type: 'Feature' as const,
    properties,
    geometry: { type: 'Polygon' as const, coordinates },
  }))
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// Zipped Shapefile (.shp/.shx/.dbf/.prj), generated entirely client-side.
export function downloadShapefile(
  geometry: Polygon | MultiPolygon,
  properties: Record<string, unknown>,
  filenameBase: string,
) {
  const collection: FeatureCollection<Polygon> = {
    type: 'FeatureCollection',
    features: toPolygonFeatures(geometry, properties),
  }
  const base64 = shpwrite.zip(collection, {
    folder: filenameBase,
    types: { polygon: filenameBase },
  })
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  triggerDownload(new Blob([bytes], { type: 'application/zip' }), `${filenameBase}.zip`)
}

export function downloadGeojson(
  geometry: Polygon | MultiPolygon,
  properties: Record<string, unknown>,
  filenameBase: string,
) {
  const feature: Feature<Polygon | MultiPolygon> = { type: 'Feature', properties, geometry }
  const blob = new Blob([JSON.stringify(feature, null, 2)], { type: 'application/geo+json' })
  triggerDownload(blob, `${filenameBase}.geojson`)
}
