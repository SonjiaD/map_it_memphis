// The project's visual signature: an irregular hand-drawn boundary line, echoing
// the shapes residents draw on the map. Used as a decorative divider/accent.
export function BoundaryMotif({ color = '#cd5423', className = '' }: {
  color?: string
  className?: string
}) {
  return (
    <svg viewBox="0 0 220 28" className={className} fill="none" aria-hidden="true">
      <path
        d="M6 18 C 28 6, 52 24, 78 14 S 128 4, 152 16 S 196 22, 214 10"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="9 7"
      />
    </svg>
  )
}
