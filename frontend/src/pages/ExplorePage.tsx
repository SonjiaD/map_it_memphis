import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, ZoomControl } from 'react-leaflet'
import { LayerTogglePanel, DEFAULT_LAYER_STATE, type LayerState } from '../components/map/LayerTogglePanel'
import { CensusTractsLayer, ZipCodesLayer, SouthDistrictLayer, SoulsvilleStudyAreaLayer } from '../components/map/OfficialLayers'
import { AmenityLayer } from '../components/map/AmenityLayer'
import { TransitLayer } from '../components/map/TransitLayer'
import { KnowledgeQuestMarker } from '../components/map/KnowledgeQuestMarker'
import { PublishedAverageLayer } from '../components/map/PublishedAverageLayer'
import { StatCallout } from '../components/map/StatCallout'
import { Legend } from '../components/map/Legend'
import { AMENITY_CATEGORIES } from '../components/map/pins'
import { usePublishedAverage } from '../hooks/usePublishedAverage'

const SOULSVILLE_CENTER: [number, number] = [35.104, -90.025]
// Keep visitors around Memphis: padded clip bbox, matching the data extent
const MAX_BOUNDS: [[number, number], [number, number]] = [[34.85, -90.35], [35.35, -89.70]]
const WELCOME_DISMISSED_KEY = 'mapp-welcome-dismissed'

function WelcomeCard({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="absolute top-24 left-4 z-[1000] max-w-sm bg-white rounded-2xl shadow-xl border border-border p-5">
      <div className="flex items-center gap-2.5 mb-2">
        <span className="w-8 h-8 rounded-lg bg-primary-900 flex items-center justify-center shrink-0">
          <svg viewBox="0 0 24 24" className="text-accent-500" fill="currentColor" style={{ width: 18, height: 18 }}>
            <path d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7zm0 9.5A2.5 2.5 0 1112 6a2.5 2.5 0 010 5.5z" />
          </svg>
        </span>
        <h2 className="font-display text-xl text-primary-900">Whose Soulsville?</h2>
      </div>
      <p className="text-sm text-primary-600 leading-relaxed mb-2.5">
        Residents draw their own neighborhood boundary and mark the places that matter
        to them. This map compares their answers with official lines.
      </p>
      <p className="text-xs text-primary-400 leading-relaxed mb-3.5">
        Blue outlines are census tracts. The dashed rust box is the approximate study
        area. Open the layer panel to explore more.
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={onDismiss}
          className="bg-primary-900 hover:bg-primary-700 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
        >
          Explore the map
        </button>
        <Link to="/story" className="text-sm text-accent-600 hover:text-accent-500 font-medium">
          Read the story
        </Link>
      </div>
    </div>
  )
}

// Shown when the community layer is toggled on but nothing has been published yet.
// Individual resident maps are never shown here (confidentiality), so this is the
// only "not there yet" state to explain, rather than a live count of submissions.
function EmptyAverageCard() {
  return (
    <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[1000] w-[min(92vw,26rem)] bg-primary-900 text-white rounded-xl shadow-lg px-5 py-4">
      <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-accent-300 mb-1.5">Not published yet</p>
      <p className="text-sm leading-relaxed text-primary-100">
        Youth researchers are collecting resident-drawn boundaries now. The study team
        publishes a single community-drawn boundary once enough maps come in.
      </p>
      <Link to="/story#method" className="inline-block text-sm font-semibold text-white hover:text-accent-300 transition-colors mt-3">
        See how it works
      </Link>
    </div>
  )
}

export default function ExplorePage() {
  const [layers, setLayers] = useState<LayerState>(DEFAULT_LAYER_STATE)
  const [showWelcome, setShowWelcome] = useState(
    () => !localStorage.getItem(WELCOME_DISMISSED_KEY),
  )

  // The single public-facing resident-data output: whatever the admin last
  // published. Individual submissions are never fetched on the public map.
  const { average } = usePublishedAverage()

  function dismissWelcome() {
    localStorage.setItem(WELCOME_DISMISSED_KEY, '1')
    setShowWelcome(false)
  }

  return (
    <div className="relative flex-1 min-h-0">
      <MapContainer
        center={SOULSVILLE_CENTER}
        zoom={14}
        minZoom={11}
        maxBounds={MAX_BOUNDS}
        maxBoundsViscosity={0.8}
        className="absolute inset-0"
        zoomControl={false}
      >
        <ZoomControl position="bottomright" />
        {/* CARTO Positron: light desaturated basemap so data layers stay legible */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        {layers.censusTracts && <CensusTractsLayer />}
        {layers.zipCodes && <ZipCodesLayer />}
        {layers.southDistrict && <SouthDistrictLayer />}
        {layers.studyArea && <SoulsvilleStudyAreaLayer />}

        {AMENITY_CATEGORIES.map(cat =>
          layers.amenities[cat.key] ? <AmenityLayer key={cat.key} category={cat} /> : null,
        )}

        {layers.transit && <TransitLayer />}
        {layers.knowledgeQuest && <KnowledgeQuestMarker />}

        {layers.communityAverage && average && <PublishedAverageLayer geometry={average.geometry} />}
      </MapContainer>

      <LayerTogglePanel layers={layers} onChange={setLayers} />
      <Legend layers={layers} />
      {layers.communityAverage && !average && <EmptyAverageCard />}
      {layers.communityAverage && average && <StatCallout average={average} />}
      {showWelcome && <WelcomeCard onDismiss={dismissWelcome} />}
    </div>
  )
}
