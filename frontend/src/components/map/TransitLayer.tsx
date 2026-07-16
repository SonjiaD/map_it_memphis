import { GeoJSON, Marker, Tooltip } from 'react-leaflet'
import { useStaticGeojson } from './useStaticGeojson'
import { TRANSIT_STOP_ICON } from './pins'

// MATA transit: routes as blue lines, stops as bus icons. The stops file is
// currently empty (OSM has no tagged stops in this bbox; see data/README.md) but the
// layer renders whatever is in the file, so a swapped-in official MATA dataset
// appears with no code change.
export function TransitLayer() {
  const routes = useStaticGeojson('/memphis/transit/routes.geojson')
  const stops = useStaticGeojson('/memphis/transit/stops.geojson')

  return (
    <>
      {routes && (
        <GeoJSON
          key={'transit-routes' + (routes.features?.length ?? 0)}
          data={routes}
          style={() => ({ color: '#2563eb', weight: 2, opacity: 0.55 })}
          onEachFeature={(feature, layer) => {
            const label = feature.properties?.name || (feature.properties?.ref ? `Route ${feature.properties.ref}` : 'Bus route')
            layer.bindTooltip(String(label), { sticky: true })
          }}
        />
      )}
      {stops?.features.map((feat, i) => {
        if (feat.geometry.type !== 'Point') return null
        const [lng, lat] = feat.geometry.coordinates
        return (
          <Marker key={`stop-${i}`} position={[lat, lng]} icon={TRANSIT_STOP_ICON}>
            <Tooltip direction="top" offset={[0, -28]}>
              {feat.properties?.name ? String(feat.properties.name) : 'Transit stop'}
            </Tooltip>
          </Marker>
        )
      })}
    </>
  )
}
