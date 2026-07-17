import { Marker, Tooltip } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import { useStaticGeojson } from './useStaticGeojson'
import type { PinCategory } from './pins'

// One amenity category (grocery, parks, ...) rendered as teardrop pins with a name
// tooltip, clustered at low zoom (churches alone have 1000+ points citywide).
// One cluster group per category so toggles stay independent and clusters carry
// the category's color.
export function AmenityLayer({ category }: { category: PinCategory }) {
  const data = useStaticGeojson(`/memphis/amenities/${category.key}.geojson`)
  if (!data) return null

  const clusterIcon = (cluster: { getChildCount: () => number }) =>
    L.divIcon({
      className: '',
      html: `<div style="background:${category.color};color:white;width:34px;height:34px;border-radius:50%;
        display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;
        border:3px solid white;box-shadow:0 1px 5px rgba(0,0,0,0.35);">${cluster.getChildCount()}</div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    })

  return (
    <MarkerClusterGroup
      chunkedLoading
      showCoverageOnHover={false}
      maxClusterRadius={46}
      iconCreateFunction={clusterIcon}
    >
      {data.features.map((feat, i) => {
        if (feat.geometry.type !== 'Point') return null
        const [lng, lat] = feat.geometry.coordinates
        const name = feat.properties?.name
        return (
          <Marker key={`${category.key}-${i}`} position={[lat, lng]} icon={category.icon}>
            <Tooltip direction="top" offset={[0, -28]}>
              {name ? String(name) : category.label.replace(/s$/, '')}
            </Tooltip>
          </Marker>
        )
      })}
    </MarkerClusterGroup>
  )
}
