export const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

// Memphis is Central Time. Session start/end are stored UTC; show them in the field
// team's local time so the numbers match what happened on the ground.
export const MEMPHIS_TZ = 'America/Chicago'
export const fmtDateCT = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { timeZone: MEMPHIS_TZ, month: 'short', day: 'numeric', year: 'numeric' }) : '—'
export const fmtTimeCT = (iso: string | null) =>
  iso ? new Date(iso).toLocaleTimeString('en-US', { timeZone: MEMPHIS_TZ, hour: 'numeric', minute: '2-digit' }) : '—'
