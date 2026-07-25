import { useEffect, useRef, useState } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function PinGlyph({ className = '' }: { className?: string }) {
  return (
    <span className={`w-8 h-8 rounded-lg bg-primary-900 flex items-center justify-center shrink-0 ${className}`}>
      <svg viewBox="0 0 24 24" style={{ width: 16, height: 16 }} className="text-accent-500" fill="currentColor">
        <path d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7zm0 9.5A2.5 2.5 0 1112 6a2.5 2.5 0 010 5.5z" />
      </svg>
    </span>
  )
}

function UserChip() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const name = profile?.full_name || (user?.user_metadata?.full_name as string) || user?.email || ''
  const initial = (name.trim()[0] || '?').toUpperCase()

  const role = profile?.is_admin
    ? { label: 'Administrator', cls: 'bg-primary-900 text-white' }
    : profile?.is_researcher
      ? { label: 'Collector', cls: 'bg-accent-50 text-accent-700' }
      : { label: 'Pending approval', cls: 'bg-surface-muted text-primary-600' }

  async function handleSignOut() {
    setOpen(false)
    await signOut()
    navigate('/')
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-9 h-9 rounded-full bg-primary-900 text-white font-semibold text-sm flex items-center justify-center hover:bg-primary-700 transition-colors"
        aria-label="Account menu"
      >
        {initial}
      </button>
      {open && (
        <div className="absolute right-0 top-11 w-60 bg-white rounded-xl shadow-xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold text-primary-900 truncate">{name}</p>
            <p className="font-mono text-[11px] text-primary-500 truncate">{user?.email}</p>
            <span className={`inline-block mt-2 font-mono text-[10px] tracking-wider uppercase px-2 py-0.5 rounded ${role.cls}`}>
              {role.label}
            </span>
          </div>
          {profile?.is_admin && (
            <Link to="/admin" onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm font-medium text-primary-900 hover:bg-surface-muted transition-colors">
              Admin console
            </Link>
          )}
          <Link to="/profile" onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm text-primary-700 hover:bg-surface-muted transition-colors">
            Profile
          </Link>
          <button onClick={handleSignOut}
            className="w-full text-left px-4 py-2.5 text-sm text-primary-700 hover:bg-surface-muted transition-colors">
            Log out
          </button>
        </div>
      )}
    </div>
  )
}

// Floating navigation island. Fixed over every page (the map runs edge to edge
// underneath on Explore). Rectangular geometry, hairline border, soft shadow.
export function NavBar() {
  const { user, profile } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const canCollect = !!(profile?.is_researcher || profile?.is_admin)

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `relative px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
      isActive
        ? 'text-primary-900 after:absolute after:left-3 after:right-3 after:-bottom-px after:h-[2px] after:rounded-full after:bg-accent-500'
        : 'text-primary-500 hover:text-primary-900'
    }`

  return (
    <>
      <header className="fixed top-4 inset-x-0 z-[1100] px-4 pointer-events-none">
        <div className="max-w-3xl mx-auto pointer-events-auto">
          <div className="bg-white/90 backdrop-blur rounded-2xl shadow-lg border border-border px-3 py-2 flex items-center justify-between gap-2">
            <Link to="/" className="flex items-center gap-2.5 pl-1" onClick={() => setMobileOpen(false)}>
              <PinGlyph />
              <span className="font-display text-xl text-primary-900 leading-none whitespace-nowrap">
                MAPP It Memphis
              </span>
            </Link>

            {/* Desktop links */}
            <nav className="hidden md:flex items-center gap-1">
              <NavLink to="/" end className={linkClass}>Explore</NavLink>
              <NavLink to="/story" className={linkClass}>The Story</NavLink>
              <NavLink to="/download" className={linkClass}>Download</NavLink>
              {canCollect && (
                <NavLink to="/collect" className={({ isActive }) =>
                  `px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors ${
                    isActive ? 'text-accent-700 bg-accent-50' : 'text-accent-600 hover:text-accent-700 hover:bg-accent-50'
                  }`
                }>
                  Collect
                </NavLink>
              )}
              {user ? (
                <div className="ml-2"><UserChip /></div>
              ) : (
                <NavLink
                  to="/login"
                  className="ml-2 px-4 py-2 rounded-lg text-sm font-semibold bg-primary-900 text-white hover:bg-primary-700 transition-colors"
                >
                  Researcher Login
                </NavLink>
              )}
            </nav>

            {/* Mobile: hamburger */}
            <button
              className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center text-primary-900 hover:bg-surface-muted"
              onClick={() => setMobileOpen(o => !o)}
              aria-label="Menu"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                {mobileOpen
                  ? <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                  : <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />}
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile sheet */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[1090] bg-primary-900/97 md:hidden flex flex-col items-center justify-center gap-6">
          {[
            { to: '/', label: 'Explore' },
            { to: '/story', label: 'The Story' },
            { to: '/download', label: 'Download' },
            ...(canCollect ? [{ to: '/collect', label: 'Collect' }] : []),
            ...(profile?.is_admin ? [{ to: '/admin', label: 'Admin' }] : []),
            ...(user ? [{ to: '/profile', label: 'Profile' }] : [{ to: '/login', label: 'Researcher Login' }]),
          ].map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              onClick={() => setMobileOpen(false)}
              className="font-display text-3xl text-white hover:text-accent-300 transition-colors"
            >
              {l.label}
            </NavLink>
          ))}
        </div>
      )}
    </>
  )
}
