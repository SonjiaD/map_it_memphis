import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        // Split the heavy vendors so the initial bundle stays lean; turf in
        // particular is large and only used by the Explore heatmap.
        manualChunks: {
          leaflet: ['leaflet', 'react-leaflet', 'react-leaflet-cluster'],
          turf: ['@turf/turf'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
})
