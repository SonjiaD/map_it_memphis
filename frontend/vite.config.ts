import { defineConfig } from 'vite'

export default defineConfig({
  // shp-write (Shapefile export on the downloads page) checks `process.browser` at
  // module load, a browserify-era convention Vite doesn't polyfill by default. This
  // textually replaces it at build time so the reference never reaches the runtime
  // (no `process` global needed, no polyfill package).
  define: {
    'process.browser': 'true',
  },
  build: {
    rollupOptions: {
      output: {
        // Split the heavy vendors so the initial bundle stays lean; turf in
        // particular is large and only used by the Explore heatmap.
        manualChunks: {
          leaflet: ['leaflet', 'react-leaflet', 'react-leaflet-cluster'],
          turf: ['@turf/turf'],
          supabase: ['@supabase/supabase-js'],
          shapefile: ['shp-write'],
        },
      },
    },
  },
})
