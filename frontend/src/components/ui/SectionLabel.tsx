import { type ReactNode } from 'react'

interface SectionLabelProps {
  children: ReactNode
  className?: string
}

export function SectionLabel({ children, className = '' }: SectionLabelProps) {
  return (
    <p className={`font-mono text-xs font-medium tracking-[0.18em] uppercase text-accent-600 ${className}`}>
      {children}
    </p>
  )
}
