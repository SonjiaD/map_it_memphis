import { MapBackdrop } from '../components/MapBackdrop'

// Placeholder for the admin console (step 2 builds the real approve-collectors +
// review-maps + publish interface). Only reachable by admins via AdminGuard.
export default function AdminPage() {
  return (
    <div className="relative flex-1 flex items-center justify-center px-4 py-24">
      <MapBackdrop />
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl border border-border p-8 text-center">
        <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-primary-400 mb-3">Admin console</p>
        <h1 className="font-display text-3xl text-primary-900 mb-2">Coming next</h1>
        <p className="text-sm text-primary-500 leading-relaxed">
          Approve collector requests, choose which resident maps count toward the
          average, and publish the community map. This console is being built.
        </p>
      </div>
    </div>
  )
}
