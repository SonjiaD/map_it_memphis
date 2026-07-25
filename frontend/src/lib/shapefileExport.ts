import * as shpwrite from 'shp-write'
import JSZip from 'jszip'
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

// shp-write.zip returns a base64 zip whose files live under `{folderName}/`. One map's
// shapefile = its .shp/.shx/.dbf/.prj under that folder.
function shapefileZipBase64(
  geometry: Polygon | MultiPolygon,
  properties: Record<string, unknown>,
  folderName: string,
): string {
  const collection: FeatureCollection<Polygon> = {
    type: 'FeatureCollection',
    features: toPolygonFeatures(geometry, properties),
  }
  return shpwrite.zip(collection, { folder: folderName, types: { polygon: folderName } })
}

// Zipped Shapefile (.shp/.shx/.dbf/.prj) for one boundary, generated client-side.
export function downloadShapefile(
  geometry: Polygon | MultiPolygon,
  properties: Record<string, unknown>,
  filenameBase: string,
) {
  const base64 = shapefileZipBase64(geometry, properties, filenameBase)
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  triggerDownload(new Blob([bytes], { type: 'application/zip' }), `${filenameBase}.zip`)
}

// One zip containing every map as its own convention-named subfolder, each with its
// own .shp/.shx/.dbf/.prj. Builds each map's shapefile with shp-write, then repacks
// them into a single parent archive so Brenda gets one download for the whole set.
export async function downloadAllShapefiles(
  items: { geometry: Polygon | MultiPolygon; properties: Record<string, unknown>; folderName: string }[],
  zipName: string,
) {
  const parent = new JSZip()
  for (const item of items) {
    const inner = await JSZip.loadAsync(
      shapefileZipBase64(item.geometry, item.properties, item.folderName),
      { base64: true },
    )
    for (const path of Object.keys(inner.files)) {
      const entry = inner.files[path]
      if (entry.dir) continue
      parent.file(path, await entry.async('uint8array'))
    }
  }
  const blob = await parent.generateAsync({ type: 'blob' })
  triggerDownload(blob, `${zipName}.zip`)
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
