import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Polygon, MultiPolygon } from 'geojson'

export interface PublishedAverage {
  geometry: Polygon | MultiPolygon
  threshold: number
  sourceCount: number
  publishedAt: string
}

// The single current community-average shape (the public-facing output of the
// admin's curation + publish step). Loads the latest published row, then
// subscribes to realtime inserts so the public map updates the moment an admin
// publishes again, no refresh needed. Individual resident maps are never fetched
// here; RLS blocks anon reads on drawn_boundaries entirely (see migration 0007).
export function usePublishedAverage(): { average: PublishedAverage | null; loading: boolean } {
  const [average, setAverage] = useState<PublishedAverage | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    supabase
      .from('published_averages')
      .select('geometry, threshold, source_count, published_at')
      .order('published_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) console.error('Failed to load the published average:', error.message)
        if (!cancelled) {
          if (data) {
            setAverage({
              geometry: data.geometry,
              threshold: data.threshold,
              sourceCount: data.source_count,
              publishedAt: data.published_at,
            })
          }
          setLoading(false)
        }
      })

    const channel = supabase
      .channel('published-averages-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'published_averages' },
        payload => {
          const row = payload.new as {
            geometry: Polygon | MultiPolygon
            threshold: number
            source_count: number
            published_at: string
          }
          setAverage({
            geometry: row.geometry,
            threshold: row.threshold,
            sourceCount: row.source_count,
            publishedAt: row.published_at,
          })
        },
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [])

  return { average, loading }
}
