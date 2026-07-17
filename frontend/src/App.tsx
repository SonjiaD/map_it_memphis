import { BrowserRouter as Router, Routes, Route, NavLink, Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AuthGuard, ResearcherGuard } from './components/AuthGuard'
import AboutPage from './pages/AboutPage'
import MethodologyPage from './pages/MethodologyPage'
import ExplorePage from './pages/ExplorePage'
import CollectPage from './pages/CollectPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ProfilePage from './pages/ProfilePage'

function NavBar() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `relative px-3 py-2 text-sm font-medium transition-colors ${
      isActive
        ? 'text-primary-800 after:absolute after:left-3 after:right-3 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-accent-400'
        : 'text-gray-500 hover:text-primary-800'
    }`

  return (
    <nav className="bg-white border-b border-border">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl bg-primary-700 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" style={{ width: 17, height: 17 }} className="text-accent-400" fill="currentColor">
              <path d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7zm0 9.5A2.5 2.5 0 1112 6a2.5 2.5 0 010 5.5z" />
            </svg>
          </span>
          <span className="font-display font-bold text-lg text-primary-900 tracking-tight">
            MAPP It Memphis
          </span>
        </Link>
        <div className="flex items-center gap-1">
          <NavLink to="/" end className={navLinkClass}>
            Explore
          </NavLink>
          <NavLink to="/about" className={navLinkClass}>
            About
          </NavLink>
          <NavLink to="/methodology" className={navLinkClass}>
            Methodology
          </NavLink>

          {user && profile?.is_researcher && (
            <NavLink to="/collect" className={navLinkClass}>
              Collect
            </NavLink>
          )}

          {user ? (
            <>
              <NavLink to="/profile" className={navLinkClass}>
                Profile
              </NavLink>
              <button
                onClick={handleSignOut}
                className="ml-3 px-4 py-1.5 rounded-full text-sm font-medium text-gray-500 border border-border hover:text-primary-800 hover:border-primary-300 transition-colors"
              >
                Log out
              </button>
            </>
          ) : (
            <NavLink
              to="/login"
              className="ml-3 px-4 py-1.5 rounded-full text-sm font-semibold bg-primary-700 text-white hover:bg-primary-600 transition-colors"
            >
              Researcher Login
            </NavLink>
          )}
        </div>
      </div>
    </nav>
  )
}

function AppShell() {
  const location = useLocation()
  const isExplorePage = location.pathname === '/'

  return (
    <div className="h-screen bg-surface-page flex flex-col overflow-hidden">
      <NavBar />
      <div className={`flex-1 min-h-0 flex flex-col ${isExplorePage ? 'overflow-hidden' : 'overflow-auto'}`}>
        <Routes>
          <Route path="/" element={<ExplorePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/methodology" element={<MethodologyPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/collect" element={<ResearcherGuard><CollectPage /></ResearcherGuard>} />
          <Route path="/profile" element={<AuthGuard><ProfilePage /></AuthGuard>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  )
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </Router>
  )
}

export default App
