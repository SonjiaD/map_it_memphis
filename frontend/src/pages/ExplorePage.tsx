import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer } from 'react-leaflet'
import { LayerTogglePanel, DEFAULT_LAYER_STATE, type LayerState } from '../components/map/LayerTogglePanel'
import { CensusTractsLayer, ZipCodesLayer, SouthDistrictLayer } from '../components/map/OfficialLayers'
import { AmenityLayer } from '../components/map/AmenityLayer'
import { TransitLayer } from '../components/map/TransitLayer'
import { KnowledgeQuestMarker } from '../components/map/KnowledgeQuestMarker'
import { AMENITY_CATEGORIES } from '../components/map/pins'

const SOULSVILLE_CENTER: [number, number] = [35.104, -90.025]
const WELCOME_DISMISSED_KEY = 'mapp-welcome-dismissed'

function WelcomeCard({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="absolute bottom-6 left-3 z-[1000] max-w-sm bg-white rounded-xl shadow-lg border border-gray-200 p-4">
      <h2 className="font-bold text-gray-900 mb-1.5">What is MAPP Memphis?</h2>
      <p className="text-sm text-gray-600 leading-relaxed mb-3">
        Soulsville residents draw their own neighborhood boundary and mark the places
        that matter to them. This map shows how their answers compare with official
        lines like census tracts and zip codes. Use the layer panel to explore.
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={onDismiss}
          className="bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold px-4 py-1.5 rounded-full transition-colors"
        >
          Got it
        </button>
        <Link to="/about" className="text-sm text-teal-700 hover:text-teal-600 font-medium">
          Learn more
        </Link>
      </div>
    </div>
  )
}

export default function ExplorePage() {
  const [layers, setLayers] = useState<LayerState>(DEFAULT_LAYER_STATE)
  const [showWelcome, setShowWelcome] = useState(
    () => !localStorage.getItem(WELCOME_DISMISSED_KEY),
  )

  function dismissWelcome() {
    localStorage.setItem(WELCOME_DISMISSED_KEY, '1')
    setShowWelcome(false)
  }

  return (
    <div className="relative flex-1 min-h-0">
      <MapContainer
        center={SOULSVILLE_CENTER}
        zoom={14}
        className="absolute inset-0"
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {layers.censusTracts && <CensusTractsLayer />}
        {layers.zipCodes && <ZipCodesLayer />}
        {layers.southDistrict && <SouthDistrictLayer />}

        {AMENITY_CATEGORIES.map(cat =>
          layers.amenities[cat.key] ? <AmenityLayer key={cat.key} category={cat} /> : null,
        )}

        {layers.transit && <TransitLayer />}
        {layers.knowledgeQuest && <KnowledgeQuestMarker />}

        {/* Resident data layers (consensus heatmap, drawn boundaries, asset pins)
            are wired in with the live Supabase data in a later phase. */}
      </MapContainer>

      <LayerTogglePanel layers={layers} onChange={setLayers} />
      {showWelcome && <WelcomeCard onDismiss={dismissWelcome} />}
    </div>
  )
}
