import { type ReactNode } from 'react'

interface SectionLabelProps {
  children: ReactNode
  className?: string
}

export function SectionLabel({ children, className = '' }: SectionLabelProps) {
  return (
    <p className={`font-mono text-xs tracking-[0.2em] uppercase text-primary-500 ${className}`}>
      {children}
    </p>
  )
}
