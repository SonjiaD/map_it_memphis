import { GeoJSON } from 'react-leaflet'
import type { Layer, PathOptions } from 'leaflet'
import { useStaticGeojson } from './useStaticGeojson'

// Official administrative boundaries, rendered as outlines with near-zero fill so
// resident-drawn layers stay legible on top. Hovering a tract/zip tints that
// polygon's interior and shows its label (no click selection; the browser focus
// rectangle is suppressed in index.css). Default SVG renderer throughout: the old
// TinyHome canvas renderer had per-feature handlers silently fail in production
// builds (commit 9090121), so nothing here uses canvas.

// Layer hues (also mirrored by the panel swatches in LayerTogglePanel):
export const BOUNDARY_COLORS = {
  censusTracts: '#4f7ecd',   // slate blue (primary-400)
  zipCodes: '#7c3aed',       // violet
  southDistrict: '#d99c14',  // gold (accent-500)
  studyArea: '#b8593a',      // rust (resident-adjacent, it's the study focus)
}

function HoverBoundaryLayer({ url, baseStyle, hoverStyle, labelFor }: {
  url: string
  baseStyle: PathOptions
  hoverStyle: PathOptions
  labelFor?: (props: Record<string, any>) => string | null
}) {
  const data = useStaticGeojson(url)
  if (!data) return null
  return (
    <GeoJSON
      key={url + (data.features?.length ?? 0)}
      data={data}
      style={() => baseStyle}
      onEachFeature={(feature, layer: Layer) => {
        const label = labelFor?.(feature.properties ?? {})
        if (label) layer.bindTooltip(label, { sticky: true })
        layer.on('mouseover', () => (layer as any).setStyle(hoverStyle))
        layer.on('mouseout', () => (layer as any).setStyle(baseStyle))
      }}
    />
  )
}

export function CensusTractsLayer() {
  const c = BOUNDARY_COLORS.censusTracts
  return (
    <HoverBoundaryLayer
      url="/memphis/census_tracts.geojson"
      baseStyle={{ color: c, weight: 1.2, fill: true, fillColor: c, fillOpacity: 0.02 }}
      hoverStyle={{ color: c, weight: 2, fill: true, fillColor: c, fillOpacity: 0.25 }}
      labelFor={p => (p.NAME ? `Census tract ${p.NAME}` : null)}
    />
  )
}

export function ZipCodesLayer() {
  const c = BOUNDARY_COLORS.zipCodes
  return (
    <HoverBoundaryLayer
      url="/memphis/zip_codes.geojson"
      baseStyle={{ color: c, weight: 1.5, dashArray: '6 4', fill: true, fillColor: c, fillOpacity: 0.02 }}
      hoverStyle={{ color: c, weight: 2.5, dashArray: '6 4', fill: true, fillColor: c, fillOpacity: 0.22 }}
      labelFor={p => (p.ZCTA5 ? `ZIP ${p.ZCTA5}` : null)}
    />
  )
}

export function SouthDistrictLayer() {
  const c = BOUNDARY_COLORS.southDistrict
  const data = useStaticGeojson('/memphis/memphis30_south_district.geojson')
  if (!data) return null
  const isPlaceholder = data.features?.[0]?.properties?.is_placeholder
  const label = isPlaceholder
    ? 'Memphis 3.0 South District (placeholder outline, real boundary pending)'
    : 'Memphis 3.0 South District'
  return (
    <GeoJSON
      key={'south-district' + (data.features?.length ?? 0)}
      data={data}
      style={() => ({ color: c, weight: 2.5, fill: true, fillColor: c, fillOpacity: 0.04 })}
      onEachFeature={(_f, layer) => layer.bindTooltip(label, { sticky: true })}
    />
  )
}

// Approximate study-area outline: Soulsville has no official boundary (that is
// the research premise); this dashed box just orients visitors.
export function SoulsvilleStudyAreaLayer() {
  const c = BOUNDARY_COLORS.studyArea
  const data = useStaticGeojson('/memphis/soulsville_study_area.geojson')
  if (!data) return null
  return (
    <GeoJSON
      key={'study-area' + (data.features?.length ?? 0)}
      data={data}
      style={() => ({ color: c, weight: 2.5, dashArray: '10 6', fill: false })}
      onEachFeature={(_f, layer) =>
        layer.bindTooltip('Soulsville study area (approximate)', { sticky: true })}
    />
  )
}
