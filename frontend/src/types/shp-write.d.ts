// shp-write ships no types. Only the small surface we actually use.
declare module 'shp-write' {
  import type { FeatureCollection, Polygon } from 'geojson'

  interface ShpWriteOptions {
    folder?: string
    types?: { polygon?: string; point?: string; line?: string }
  }

  // Returns a base64-encoded zip archive (.shp/.shx/.dbf/.prj), synchronous.
  export function zip(geojson: FeatureCollection<Polygon>, options?: ShpWriteOptions): string
  export function download(geojson: FeatureCollection<Polygon>, options?: ShpWriteOptions): void
}
