// Plain CSV export for tabular analysis (no geometry, no GIS tooling needed).
// Separate from shapefileExport.ts, which handles the spatial download.
import { triggerDownload } from './downloadFile'

function escapeCsvValue(value: string | number): string {
  const s = String(value)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function downloadCsv(rows: Record<string, string | number>[], filenameBase: string) {
  if (rows.length === 0) return
  const headers = Object.keys(rows[0])
  const lines = [
    headers.map(escapeCsvValue).join(','),
    ...rows.map(row => headers.map(h => escapeCsvValue(row[h])).join(',')),
  ]
  // UTF-8 BOM so Excel opens accented characters correctly.
  const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' })
  triggerDownload(blob, `${filenameBase}.csv`)
}
