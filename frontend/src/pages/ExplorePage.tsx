import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { MapContainer, TileLayer, ZoomControl } from 'react-leaflet'
import { LayerTogglePanel, DEFAULT_LAYER_STATE, type LayerState } from '../components/map/LayerTogglePanel'
import { CensusTractsLayer, ZipCodesLayer, SouthDistrictLayer, SoulsvilleStudyAreaLayer } from '../components/map/OfficialLayers'
import { AmenityLayer } from '../components/map/AmenityLayer'
import { TransitLayer } from '../components/map/TransitLayer'
import { KnowledgeQuestMarker } from '../components/map/KnowledgeQuestMarker'
import { ConsensusHeatmapLayer, DrawnBoundariesLayer, AssetPinsLayer } from '../components/map/ResidentLayers'
import { StatCallout } from '../components/map/StatCallout'
import { Legend } from '../components/map/Legend'
import { AMENITY_CATEGORIES } from '../components/map/pins'
import { useDrawnBoundaries } from '../hooks/useDrawnBoundaries'
import { computeHeatmap } from '../lib/consensusHeatmap'
import { useAuth } from '../contexts/AuthContext'

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

function EmptyResidentDataCard({ signedIn }: { signedIn: boolean }) {
  return (
    <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[1000] w-[min(92vw,26rem)] bg-primary-900 text-white rounded-xl shadow-lg px-5 py-4">
      <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-accent-300 mb-1.5">No resident drawings yet</p>
      <p className="text-sm leading-relaxed text-primary-100">
        Youth researchers are collecting resident-drawn boundaries now. They will appear
        here as they come in.
      </p>
      <div className="flex items-center gap-4 mt-3">
        <Link to="/story#method" className="text-sm font-semibold text-white hover:text-accent-300 transition-colors">
          See how it works
        </Link>
        {signedIn && (
          <Link to="/collect" className="text-sm font-semibold text-accent-300 hover:text-accent-200 transition-colors">
            Start collecting
          </Link>
        )}
      </div>
    </div>
  )
}

export default function ExplorePage() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  // Arriving from the Story CTA (/?data=1) pre-enables the resident layers so the
  // "residents draw it differently" payoff is the first thing you see.
  const [layers, setLayers] = useState<LayerState>(() =>
    searchParams.get('data') === '1'
      ? { ...DEFAULT_LAYER_STATE, residentHeatmap: true, residentBoundaries: true }
      : DEFAULT_LAYER_STATE,
  )
  const [showWelcome, setShowWelcome] = useState(
    () => !localStorage.getItem(WELCOME_DISMISSED_KEY),
  )

  // Live resident data: initial fetch + realtime inserts, shared by the heatmap,
  // the raw-boundaries layer, and the stat callout so only one channel is open.
  const boundaries = useDrawnBoundaries()
  const heatmap = useMemo(
    () => computeHeatmap(boundaries.map(b => b.geometry)),
    [boundaries],
  )

  // The first time real resident data arrives, reveal the consensus + boundaries so
  // the map teaches the thesis on its own. Runs once, so it never fights a visitor
  // who then toggles the layers back off.
  const autoRevealed = useRef(false)
  useEffect(() => {
    if (!autoRevealed.current && boundaries.length > 0) {
      autoRevealed.current = true
      setLayers(prev => ({ ...prev, residentHeatmap: true, residentBoundaries: true }))
    }
  }, [boundaries.length])

  const residentLayerOn = layers.residentHeatmap || layers.residentBoundaries || layers.residentPins

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

        {layers.residentHeatmap && <ConsensusHeatmapLayer heatmap={heatmap} />}
        {layers.residentBoundaries && <DrawnBoundariesLayer boundaries={boundaries} />}
        {layers.residentPins && <AssetPinsLayer />}
      </MapContainer>

      <LayerTogglePanel layers={layers} onChange={setLayers} residentBoundaryCount={boundaries.length} />
      <Legend layers={layers} />
      {residentLayerOn && boundaries.length === 0 && <EmptyResidentDataCard signedIn={!!user} />}
      {(layers.residentHeatmap || layers.residentBoundaries) && (
        <StatCallout heatmap={heatmap} boundaryCount={boundaries.length} />
      )}
      {showWelcome && <WelcomeCard onDismiss={dismissWelcome} />}
    </div>
  )
}
