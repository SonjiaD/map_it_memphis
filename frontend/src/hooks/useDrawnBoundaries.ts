import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Polygon } from 'geojson'

export interface DrawnBoundary {
  id: string
  geometry: Polygon
  session_date: string | null
}

// Live list of published resident-drawn boundaries. Fetches once on mount (RLS
// already filters anon readers to published rows), then subscribes to realtime
// INSERTs so an open public-map tab updates the moment a researcher saves a new
// boundary in the field, no refresh needed.
export function useDrawnBoundaries(): DrawnBoundary[] {
  const [boundaries, setBoundaries] = useState<DrawnBoundary[]>([])

  useEffect(() => {
    let cancelled = false

    supabase
      .from('drawn_boundaries')
      .select('id, geometry, session_date')
      .then(({ data, error }) => {
        if (error) {
          console.error('Failed to load drawn boundaries:', error.message)
          return
        }
        if (!cancelled && data) setBoundaries(data as DrawnBoundary[])
      })

    const channel = supabase
      .channel('drawn_boundaries-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'drawn_boundaries' },
        payload => {
          const row = payload.new as DrawnBoundary & { is_published?: boolean }
          if (row.is_published === false) return
          setBoundaries(prev =>
            prev.some(b => b.id === row.id)
              ? prev
              : [...prev, { id: row.id, geometry: row.geometry, session_date: row.session_date }],
          )
        },
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [])

  return boundaries
}
