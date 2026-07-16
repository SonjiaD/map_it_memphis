import { Marker, Tooltip } from 'react-leaflet'
import { useStaticGeojson } from './useStaticGeojson'
import type { PinCategory } from './pins'

// One amenity category (grocery, parks, ...) rendered as teardrop pins with a
// name tooltip. Data is Point features fetched by the data pipeline.
export function AmenityLayer({ category }: { category: PinCategory }) {
  const data = useStaticGeojson(`/memphis/amenities/${category.key}.geojson`)
  if (!data) return null
  return (
    <>
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
    </>
  )
}
