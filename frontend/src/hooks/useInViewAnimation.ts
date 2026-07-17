import { useEffect, useRef, useState } from 'react'

// Adds a one-shot fade-in-up when the element scrolls into view.
// Usage: const { ref, className } = useInViewAnimation(); <section ref={ref} className={className}>
export function useInViewAnimation<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return { ref, className: inView ? 'animate-fade-in-up' : 'opacity-0' }
}
