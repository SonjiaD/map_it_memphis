import { useEffect, useState } from 'react'

// Fetches a static GeoJSON file from frontend/public/ once and caches it for the
// session, so toggling a layer off and on doesn't refetch.
const cache = new Map<string, GeoJSON.FeatureCollection>()

export function useStaticGeojson(url: string | null): GeoJSON.FeatureCollection | null {
  const [data, setData] = useState<GeoJSON.FeatureCollection | null>(
    url ? cache.get(url) ?? null : null,
  )

  useEffect(() => {
    if (!url || cache.has(url)) {
      setData(url ? cache.get(url)! : null)
      return
    }
    let cancelled = false
    fetch(url)
      .then(r => {
        if (!r.ok) throw new Error(`${r.status} fetching ${url}`)
        return r.json()
      })
      .then((json: GeoJSON.FeatureCollection) => {
        cache.set(url, json)
        if (!cancelled) setData(json)
      })
      .catch(err => console.error('Failed to load map layer:', err))
    return () => { cancelled = true }
  }, [url])

  return data
}
