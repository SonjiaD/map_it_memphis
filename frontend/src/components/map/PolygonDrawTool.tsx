import { useEffect } from 'react'
import { useMap, Polygon, Polyline, CircleMarker } from 'react-leaflet'
import type { LatLng } from 'leaflet'

// Boundary-drawing tool for the field collection flow, reworked for tablets from
// the original TinyHome parking marquee-select tool:
// - Controlled component: vertex state lives in the parent so toolbar buttons
//   (Undo / Clear / Finish / Cancel) can operate on it.
// - Taps go through Leaflet's map click event, which already suppresses the
//   click fired at the end of a drag, so panning stays enabled mid-draw.
// - No right-click undo, Escape cancel, or double-click close: those conflict
//   with touch gestures. Closing the ring is the parent's Finish button, plus
//   tap-near-first-vertex snapping (generous 24 px threshold for fingers).
export function PolygonDrawTool({ active, vertices, onChange, onComplete }: {
  active: boolean
  vertices: LatLng[]
  onChange: (verts: LatLng[]) => void
  onComplete: () => void
}) {
  const map = useMap()

  useEffect(() => {
    if (!active) return

    map.getContainer().style.cursor = 'crosshair'
    map.doubleClickZoom.disable()

    const onClick = (e: L.LeafletMouseEvent) => {
      // Snap-to-first: tapping near the first vertex closes the ring
      if (vertices.length >= 3) {
        const firstPx = map.latLngToContainerPoint(vertices[0])
        const posPx = map.latLngToContainerPoint(e.latlng)
        if (Math.hypot(firstPx.x - posPx.x, firstPx.y - posPx.y) < 24) {
          onComplete()
          return
        }
      }
      onChange([...vertices, e.latlng])
    }

    map.on('click', onClick)
    return () => {
      map.off('click', onClick)
      map.getContainer().style.cursor = ''
      map.doubleClickZoom.enable()
    }
  }, [active, map, vertices, onChange, onComplete])

  if (!active || vertices.length === 0) return null

  return (
    <>
      {/* Committed polygon fill shows the enclosed area as it builds */}
      {vertices.length >= 3 && (
        <Polygon
          positions={vertices}
          pathOptions={{ color: '#f97316', weight: 0, fillColor: '#f97316', fillOpacity: 0.12 }}
        />
      )}
      {/* Dashed outline through placed vertices */}
      {vertices.length >= 2 && (
        <Polyline
          positions={vertices}
          pathOptions={{ color: '#f97316', weight: 2, dashArray: '6 4' }}
        />
      )}
      {/* Vertex dots; first vertex reads bigger once the ring can be closed */}
      {vertices.map((v, i) => (
        <CircleMarker
          key={i}
          center={v}
          radius={i === 0 && vertices.length >= 3 ? 8 : 5}
          pathOptions={{ color: '#ea580c', fillColor: '#f97316', fillOpacity: 1, weight: 1.5 }}
        />
      ))}
      {/* Snap ring on the first vertex once closing is possible */}
      {vertices.length >= 3 && (
        <CircleMarker
          center={vertices[0]}
          radius={16}
          pathOptions={{ color: '#f97316', fillOpacity: 0, weight: 1.5, opacity: 0.55, dashArray: '3 3' }}
        />
      )}
    </>
  )
}
