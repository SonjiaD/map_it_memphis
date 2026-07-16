import { useState, useEffect, useRef } from 'react'
import { useMap, Polygon, Polyline, CircleMarker } from 'react-leaflet'
import type { LatLng } from 'leaflet'

// Extracted from ParkingVotePage.tsx (the parking-spot marquee-select tool).
// Mouse/keyboard version as-copied; reworked for touch + external control in
// the MAPP Memphis collection tool (see CollectPage).
export function PolygonDrawTool({ active, onComplete }: { active: boolean; onComplete: (verts: LatLng[]) => void }) {
  const map = useMap()
  const [vertices, setVertices] = useState<LatLng[]>([])
  const [cursorPos, setCursorPos] = useState<LatLng | null>(null)
  const [nearFirst, setNearFirst] = useState(false)
  const verticesRef = useRef<LatLng[]>([])
  const lastClickTimeRef = useRef(0)

  useEffect(() => {
    if (!active) {
      verticesRef.current = []
      setVertices([]); setCursorPos(null); setNearFirst(false)
      return
    }
    map.getContainer().style.cursor = 'crosshair'
    map.dragging.disable()

    const pt = (e: MouseEvent) => map.mouseEventToLatLng(e as any)

    const click = (e: MouseEvent) => {
      const now = Date.now()
      const timeSinceLast = now - lastClickTimeRef.current
      lastClickTimeRef.current = now
      const pos = pt(e)
      const verts = verticesRef.current

      if (timeSinceLast < 300) {
        // Double-click: close if enough vertices placed
        if (verts.length >= 3) {
          const closeVerts = [...verts]
          verticesRef.current = []
          setVertices([]); setCursorPos(null); setNearFirst(false)
          onComplete(closeVerts)
        }
        return
      }

      // Snap-to-first: click near first vertex to close
      if (verts.length >= 3) {
        const firstPx = map.latLngToContainerPoint(verts[0])
        const posPx = map.latLngToContainerPoint(pos)
        if (Math.hypot(firstPx.x - posPx.x, firstPx.y - posPx.y) < 12) {
          const closeVerts = [...verts]
          verticesRef.current = []
          setVertices([]); setCursorPos(null); setNearFirst(false)
          onComplete(closeVerts)
          return
        }
      }

      const newVerts = [...verts, pos]
      verticesRef.current = newVerts
      setVertices(newVerts)
    }

    const move = (e: MouseEvent) => {
      const pos = pt(e)
      setCursorPos(pos)
      const verts = verticesRef.current
      if (verts.length >= 3) {
        const firstPx = map.latLngToContainerPoint(verts[0])
        const posPx = map.latLngToContainerPoint(pos)
        setNearFirst(Math.hypot(firstPx.x - posPx.x, firstPx.y - posPx.y) < 12)
      } else {
        setNearFirst(false)
      }
    }

    const contextmenu = (e: MouseEvent) => {
      e.preventDefault()
      const newVerts = verticesRef.current.slice(0, -1)
      verticesRef.current = newVerts
      setVertices(newVerts)
    }

    const keydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        verticesRef.current = []
        setVertices([]); setCursorPos(null); setNearFirst(false)
        onComplete([])  // empty signals cancel to parent
      }
    }

    const c = map.getContainer()
    c.addEventListener('click', click)
    c.addEventListener('mousemove', move)
    c.addEventListener('contextmenu', contextmenu)
    document.addEventListener('keydown', keydown, { capture: true })
    return () => {
      c.removeEventListener('click', click)
      c.removeEventListener('mousemove', move)
      c.removeEventListener('contextmenu', contextmenu)
      document.removeEventListener('keydown', keydown, { capture: true })
      map.getContainer().style.cursor = ''
      map.dragging.enable()
    }
  }, [active, map, onComplete])

  if (!active || vertices.length === 0) return null

  return (
    <>
      {/* Committed polygon fill — shows enclosed area as you build */}
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
      {/* Rubber-band line: last vertex → cursor */}
      {cursorPos && (
        <Polyline
          positions={[vertices[vertices.length - 1], cursorPos]}
          pathOptions={{ color: '#f97316', weight: 2, dashArray: '4 4', opacity: 0.7 }}
        />
      )}
      {/* Vertex dots */}
      {vertices.map((v, i) => (
        <CircleMarker
          key={i}
          center={v}
          radius={i === 0 && nearFirst && vertices.length >= 3 ? 7 : 5}
          pathOptions={{ color: '#ea580c', fillColor: '#f97316', fillOpacity: 1, weight: 1.5 }}
        />
      ))}
      {/* Snap ring pulses on first vertex when cursor is close */}
      {nearFirst && vertices.length >= 3 && (
        <CircleMarker
          center={vertices[0]}
          radius={14}
          pathOptions={{ color: '#f97316', fillOpacity: 0, weight: 1.5, opacity: 0.55, dashArray: '3 3' }}
        />
      )}
    </>
  )
}
