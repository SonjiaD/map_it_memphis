import { GeoJSON } from 'react-leaflet'
import type { Polygon, MultiPolygon } from 'geojson'

// The single published community-average boundary. This is the ONLY resident-data
// layer the public map shows; individual resident-drawn maps and asset pins stay
// private to the collector who submitted them and to admins (see migration 0007).
export function PublishedAverageLayer({ geometry }: { geometry: Polygon | MultiPolygon }) {
  const data = { type: 'Feature' as const, properties: {}, geometry }
  return (
    <GeoJSON
      key={JSON.stringify(geometry.coordinates).length} // remount when the shape changes
      data={data}
      style={{ color: '#b8593a', weight: 2.5, fill: true, fillColor: '#b8593a', fillOpacity: 0.18 }}
    />
  )
}
