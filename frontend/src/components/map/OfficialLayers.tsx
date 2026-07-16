import { GeoJSON, Tooltip } from 'react-leaflet'
import { useStaticGeojson } from './useStaticGeojson'

// Official administrative boundaries, rendered as outlines only (near-zero fill) so
// resident-drawn layers stay legible on top. Default SVG renderer throughout: the old
// TinyHome canvas renderer had per-feature click handlers silently fail in production
// builds (commit 9090121), so nothing here uses canvas or per-feature interactivity.

function BoundaryLayer({ url, style, labelProp }: {
  url: string
  style: L.PathOptions
  labelProp?: string
}) {
  const data = useStaticGeojson(url)
  if (!data) return null
  return (
    <GeoJSON
      // Re-mount if the data object changes; react-leaflet's GeoJSON doesn't rerender on prop change
      key={url + (data.features?.length ?? 0)}
      data={data}
      style={() => style}
      onEachFeature={(feature, layer) => {
        if (labelProp && feature.properties?.[labelProp]) {
          layer.bindTooltip(String(feature.properties[labelProp]), { sticky: true })
        }
      }}
    />
  )
}

export function CensusTractsLayer() {
  return (
    <BoundaryLayer
      url="/memphis/census_tracts.geojson"
      style={{ color: '#6b7280', weight: 1.2, fill: true, fillOpacity: 0.02 }}
      labelProp="NAME"
    />
  )
}

export function ZipCodesLayer() {
  return (
    <BoundaryLayer
      url="/memphis/zip_codes.geojson"
      style={{ color: '#374151', weight: 1.5, dashArray: '6 4', fill: true, fillOpacity: 0.02 }}
      labelProp="ZCTA5"
    />
  )
}

export function SouthDistrictLayer() {
  const data = useStaticGeojson('/memphis/memphis30_south_district.geojson')
  if (!data) return null
  const isPlaceholder = data.features?.[0]?.properties?.is_placeholder
  return (
    <GeoJSON
      key={'south-district' + (data.features?.length ?? 0)}
      data={data}
      style={() => ({ color: '#b8593a', weight: 2.5, fill: true, fillOpacity: 0.03 })}
    >
      {isPlaceholder && (
        <Tooltip sticky>Memphis 3.0 South District (placeholder outline, real boundary pending)</Tooltip>
      )}
    </GeoJSON>
  )
}
