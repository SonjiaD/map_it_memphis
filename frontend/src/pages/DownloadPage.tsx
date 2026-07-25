import { usePublishedAverage } from '../hooks/usePublishedAverage'
import { downloadShapefile, downloadGeojson } from '../lib/shapefileExport'
import { Footer } from '../components/Footer'

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 19h16" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function DownloadPage() {
  const { average, loading } = usePublishedAverage()

  const filenameBase = average
    ? `soulsville-community-boundary-${average.publishedAt.slice(0, 10)}`
    : 'soulsville-community-boundary'

  const properties = average
    ? {
        neighborhood: 'Soulsville',
        published_at: average.publishedAt,
        source_map_count: average.sourceCount,
        agreement_threshold: average.threshold,
        license: 'CC BY-NC',
      }
    : {}

  return (
    <div className="flex-1 overflow-auto bg-surface-page flex flex-col">
      <div className="max-w-2xl mx-auto px-4 pt-24 pb-16 w-full flex-1">
        <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-primary-400 mb-2">Public data</p>
        <h1 className="font-display text-4xl text-primary-900 mb-3">Download the community boundary</h1>
        <p className="text-sm text-primary-500 leading-relaxed mb-8">
          This is the single boundary the study team has published: the area where a
          majority of residents' drawn maps agreed. Individual resident submissions are
          never published or downloadable, to protect participant confidentiality.
        </p>

        {loading ? (
          <div className="flex items-center gap-2 text-primary-400 text-sm">
            <span className="w-4 h-4 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
            Loading...
          </div>
        ) : !average ? (
          <div className="bg-white rounded-2xl border border-border shadow-sm p-6 text-center">
            <p className="text-sm text-primary-500">
              Nothing has been published yet. Check back once the study team has enough
              resident maps to publish a community boundary.
            </p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl border border-border shadow-sm p-6 mb-6">
              <h2 className="font-display text-xl text-primary-900 mb-4">Soulsville community boundary</h2>
              <dl className="grid grid-cols-2 gap-y-3 text-sm">
                <dt className="text-primary-400">Published</dt>
                <dd className="text-primary-800 font-medium">{fmtDate(average.publishedAt)}</dd>
                <dt className="text-primary-400">Source maps</dt>
                <dd className="text-primary-800 font-medium">{average.sourceCount}</dd>
                <dt className="text-primary-400">Agreement threshold</dt>
                <dd className="text-primary-800 font-medium">{Math.round(average.threshold * 100)}% majority</dd>
                <dt className="text-primary-400">License</dt>
                <dd className="text-primary-800 font-medium">CC BY-NC</dd>
              </dl>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => downloadGeojson(average.geometry, properties, filenameBase)}
                className="flex-1 flex items-center justify-center gap-2 bg-primary-900 hover:bg-primary-700 text-white font-semibold px-5 py-3 rounded-lg transition-colors"
              >
                <DownloadIcon />
                Download GeoJSON
              </button>
              <button
                onClick={() => downloadShapefile(average.geometry, properties, filenameBase)}
                className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-surface-muted border border-border text-primary-900 font-semibold px-5 py-3 rounded-lg transition-colors"
              >
                <DownloadIcon />
                Download Shapefile (.zip)
              </button>
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  )
}
