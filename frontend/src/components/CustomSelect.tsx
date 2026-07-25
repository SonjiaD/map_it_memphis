import { useState, useRef, useEffect } from 'react'

export interface CustomSelectOption {
  value: string
  label: string
}

interface CustomSelectProps {
  // Plain strings (used as both value and label) or explicit {value, label} pairs
  // for when the value must be a stable id distinct from its display label (e.g.
  // filtering by a person's id when two people could share the same display name).
  options: string[] | CustomSelectOption[]
  value: string
  onChange: (value: string) => void
  className?: string
}

function normalize(options: string[] | CustomSelectOption[]): CustomSelectOption[] {
  return options.map(o => (typeof o === 'string' ? { value: o, label: o } : o))
}

export function CustomSelect({ options, value, onChange, className = '' }: CustomSelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const normalized = normalize(options)
  const selectedLabel = normalized.find(o => o.value === value)?.label ?? value

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className="w-full text-left bg-white border border-border-input rounded-lg px-4 py-2.5 pr-10 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 hover:border-primary-500/50 transition-colors cursor-pointer"
      >
        {selectedLabel}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {open && (
        <ul className="absolute z-20 mt-1 w-full bg-white border border-border rounded-lg shadow-lg py-1 max-h-60 overflow-auto">
          {normalized.map(option => (
            <li
              key={option.value}
              onClick={() => {
                onChange(option.value)
                setOpen(false)
              }}
              className={`px-4 py-2 text-sm cursor-pointer transition-colors ${
                option.value === value
                  ? 'bg-primary-50 text-primary-800 font-medium'
                  : 'text-gray-700 hover:bg-surface-muted'
              }`}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
