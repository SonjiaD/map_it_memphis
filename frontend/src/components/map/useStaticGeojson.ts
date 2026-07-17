import { useEffect, useState, useSyncExternalStore } from 'react'

// Fetches a static GeoJSON file from frontend/public/ once and caches it for the
// session, so toggling a layer off and on doesn't refetch. Also tracks per-URL
// load status so the layer panel can show a spinner / feature count / error dot.

export interface LayerStatus {
  state: 'idle' | 'loading' | 'ready' | 'error'
  count?: number
}

const cache = new Map<string, GeoJSON.FeatureCollection>()
const statuses = new Map<string, LayerStatus>()
const listeners = new Set<() => void>()

const IDLE: LayerStatus = { state: 'idle' }

function setStatus(url: string, status: LayerStatus) {
  statuses.set(url, status)
  listeners.forEach(fn => fn())
}

function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}

// Live status of one layer file, for panel badges. Rows for never-toggled layers
// stay 'idle' (no badge).
export function useLayerStatus(url: string): LayerStatus {
  return useSyncExternalStore(subscribe, () => statuses.get(url) ?? IDLE)
}

export function useStaticGeojson(url: string | null): GeoJSON.FeatureCollection | null {
  const [data, setData] = useState<GeoJSON.FeatureCollection | null>(
    url ? cache.get(url) ?? null : null,
  )

  useEffect(() => {
    if (!url) {
      setData(null)
      return
    }
    if (cache.has(url)) {
      setData(cache.get(url)!)
      return
    }
    let cancelled = false
    setStatus(url, { state: 'loading' })
    fetch(url)
      .then(r => {
        if (!r.ok) throw new Error(`${r.status} fetching ${url}`)
        return r.json()
      })
      .then((json: GeoJSON.FeatureCollection) => {
        cache.set(url, json)
        setStatus(url, { state: 'ready', count: json.features?.length ?? 0 })
        if (!cancelled) setData(json)
      })
      .catch(err => {
        console.error('Failed to load map layer:', err)
        setStatus(url, { state: 'error' })
      })
    return () => { cancelled = true }
  }, [url])

  return data
}
