import { useEffect, useState } from 'react'
import { GeoJSON, Polygon as LeafletPolygon, Marker, Popup } from 'react-leaflet'
import { supabase } from '../../lib/supabase'
import { assetPinIcon } from './pins'
import type { DrawnBoundary } from '../../hooks/useDrawnBoundaries'
import type { HeatmapCellProps } from '../../lib/consensusHeatmap'
import type { FeatureCollection, Polygon } from 'geojson'

// Consensus heatmap: grid cells shaded darker where more residents included the
// cell in their drawn Soulsville. Data computed in ExplorePage and passed down.
export function ConsensusHeatmapLayer({ heatmap }: { heatmap: FeatureCollection<Polygon, HeatmapCellProps> }) {
  if (heatmap.features.length === 0) return null
  return (
    <GeoJSON
      // Key by feature count + max agreement so a realtime update remounts the layer
      key={`heatmap-${heatmap.features.length}-${Math.max(...heatmap.features.map(f => f.properties.agreementCount))}`}
      data={heatmap}
      style={feature => ({
        stroke: false,
        fill: true,
        fillColor: '#b8593a',
        fillOpacity: 0.08 + 0.62 * (feature?.properties?.agreementPct ?? 0),
      })}
    />
  )
}

// Each resident's raw drawn boundary as a translucent outline; overlaps darken
// naturally, complementing the aggregated heatmap.
export function DrawnBoundariesLayer({ boundaries }: { boundaries: DrawnBoundary[] }) {
  return (
    <>
      {boundaries.map(b => (
        <LeafletPolygon
          key={b.id}
          positions={b.geometry.coordinates[0].map(([lng, lat]) => [lat, lng] as [number, number])}
          pathOptions={{ color: '#c96d4f', weight: 1.5, fillColor: '#c96d4f', fillOpacity: 0.04 }}
        />
      ))}
    </>
  )
}

interface AssetPin {
  id: string
  lat: number
  lng: number
  category: string
  name: string | null
  why_it_matters: string | null
}

// Published resident asset pins with the place's story in a popup.
export function AssetPinsLayer() {
  const [pins, setPins] = useState<AssetPin[]>([])

  useEffect(() => {
    let cancelled = false
    supabase
      .from('asset_pins')
      .select('id, lat, lng, category, name, why_it_matters')
      .then(({ data, error }) => {
        if (error) {
          console.error('Failed to load asset pins:', error.message)
          return
        }
        if (!cancelled && data) setPins(data as AssetPin[])
      })
    return () => { cancelled = true }
  }, [])

  return (
    <>
      {pins.map(p => (
        <Marker key={p.id} position={[p.lat, p.lng]} icon={assetPinIcon(p.category)}>
          <Popup>
            <div className="text-sm">
              <p className="font-bold mb-0.5">{p.name || 'A place that matters'}</p>
              {p.why_it_matters && <p className="text-gray-600 italic">"{p.why_it_matters}"</p>}
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  )
}
