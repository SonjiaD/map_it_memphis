import type { LatLng } from 'leaflet'

// Converts Leaflet draw vertices ([lat, lng] objects) into a GeoJSON Polygon:
// coordinates become [lng, lat] and the ring is explicitly closed (first point
// repeated at the end), which is what the GeoJSON spec and shapely/turf expect.
export function verticesToGeojsonPolygon(vertices: LatLng[]): GeoJSON.Polygon {
  if (vertices.length < 3) {
    throw new Error('A polygon needs at least 3 vertices')
  }
  const ring = vertices.map(v => [v.lng, v.lat])
  ring.push([vertices[0].lng, vertices[0].lat])
  return { type: 'Polygon', coordinates: [ring] }
}
