import { useEffect } from 'react'
import { MapContainer, TileLayer, GeoJSON, Marker, useMap } from 'react-leaflet'
import { useStaticGeojson } from '../map/useStaticGeojson'
import { BOUNDARY_COLORS } from '../map/OfficialLayers'
import { KNOWLEDGE_QUEST_ICON } from '../map/pins'

// The sticky map behind the Story page narrative. The active chapter index
// drives the camera and which layers are visible. Entirely non-interactive:
// the story controls the map, the reader controls the story.

export interface ChapterView {
  center: [number, number]
  zoom: number
}

export const CHAPTER_VIEWS: ChapterView[] = [
  { center: [35.125, -90.01], zoom: 12 },     // 0 title: city-wide South Memphis
  { center: [35.105, -90.0225], zoom: 13.6 }, // 1 this is Soulsville
  { center: [35.105, -90.0225], zoom: 12.7 }, // 2 the official lines
  { center: [35.105, -90.0225], zoom: 13.3 }, // 3 residents draw
  { center: [35.105, -90.0225], zoom: 13.3 }, // 4 the mismatch
  { center: [35.11, -90.02], zoom: 12.9 },    // 5 CTA
]

function FlyTo({ chapter }: { chapter: number }) {
  const map = useMap()
  useEffect(() => {
    const view = CHAPTER_VIEWS[Math.min(chapter, CHAPTER_VIEWS.length - 1)]
    map.flyTo(view.center, view.zoom, { duration: 1.4, easeLinearity: 0.2 })
  }, [chapter, map])
  return null
}

export function ScrollyMap({ chapter }: { chapter: number }) {
  const studyArea = useStaticGeojson('/memphis/soulsville_study_area.geojson')
  const tracts = useStaticGeojson(chapter >= 1 ? '/memphis/census_tracts.geojson' : null)
  const zips = useStaticGeojson(chapter >= 1 ? '/memphis/zip_codes.geojson' : null)
  const demo = useStaticGeojson(chapter >= 2 ? '/memphis/story_demo_boundaries.geojson' : null)
  const kq = useStaticGeojson('/memphis/knowledge_quest.geojson')

  const kqFeat = kq?.features?.[0]
  const kqPos: [number, number] | null =
    kqFeat && kqFeat.geometry.type === 'Point'
      ? [kqFeat.geometry.coordinates[1], kqFeat.geometry.coordinates[0]]
      : null

  // Chapter 4 thickens the resident fills so the overlap visibly darkens
  const demoFillOpacity = chapter >= 4 ? 0.22 : 0.06

  return (
    <MapContainer
      center={CHAPTER_VIEWS[0].center}
      zoom={CHAPTER_VIEWS[0].zoom}
      className="absolute inset-0"
      zoomControl={false}
      dragging={false}
      scrollWheelZoom={false}
      doubleClickZoom={false}
      touchZoom={false}
      keyboard={false}
      attributionControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      <FlyTo chapter={chapter} />

      {/* Study area: present from chapter 1 on */}
      {chapter >= 1 && studyArea && (
        <GeoJSON
          key={`sa-${studyArea.features.length}`}
          data={studyArea}
          style={() => ({ color: BOUNDARY_COLORS.studyArea, weight: 2.5, dashArray: '10 6', fill: false })}
        />
      )}
      {chapter >= 1 && kqPos && <Marker position={kqPos} icon={KNOWLEDGE_QUEST_ICON} />}

      {/* Official lines: chapters 2+ (kept underneath the resident story) */}
      {chapter >= 2 && tracts && (
        <GeoJSON
          key={`tr-${tracts.features.length}`}
          data={tracts}
          style={() => ({ color: BOUNDARY_COLORS.censusTracts, weight: 1.1, fill: false, opacity: 0.8 })}
        />
      )}
      {chapter >= 2 && zips && (
        <GeoJSON
          key={`zip-${zips.features.length}`}
          data={zips}
          style={() => ({ color: BOUNDARY_COLORS.zipCodes, weight: 1.4, dashArray: '6 4', fill: false, opacity: 0.75 })}
        />
      )}

      {/* Illustrative resident boundaries: chapters 3+ */}
      {chapter >= 3 && demo && (
        <GeoJSON
          key={`demo-${demoFillOpacity}`}
          data={demo}
          style={() => ({
            color: '#cd5423',
            weight: 2.5,
            fill: true,
            fillColor: '#cd5423',
            fillOpacity: demoFillOpacity,
          })}
        />
      )}
    </MapContainer>
  )
}
