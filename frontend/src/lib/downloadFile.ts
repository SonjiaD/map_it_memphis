// Shared blob-download trigger. The anchor must be attached to the DOM and the
// object URL must outlive the click (some browsers lose the suggested filename,
// falling back to a generated name, if the URL is revoked immediately).
export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
