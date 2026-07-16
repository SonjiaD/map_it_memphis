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

  return (
    <nav className="bg-primary-900 border-b border-primary-800">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
        <Link to="/" className="text-lg font-semibold text-white tracking-tight">
          MAPP It Memphis
        </Link>
        <div className="flex items-center gap-1">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isActive ? 'text-white bg-primary-800' : 'text-primary-100 hover:text-white hover:bg-primary-800'
              }`
            }
          >
            Explore
          </NavLink>
          <NavLink
            to="/about"
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isActive ? 'text-white bg-primary-800' : 'text-primary-100 hover:text-white hover:bg-primary-800'
              }`
            }
          >
            About
          </NavLink>
          <NavLink
            to="/methodology"
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isActive ? 'text-white bg-primary-800' : 'text-primary-100 hover:text-white hover:bg-primary-800'
              }`
            }
          >
            Methodology
          </NavLink>

          {user && profile?.is_researcher && (
            <NavLink
              to="/collect"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive ? 'text-white bg-primary-800' : 'text-primary-100 hover:text-white hover:bg-primary-800'
                }`
              }
            >
              Collect
            </NavLink>
          )}

          {user ? (
            <>
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive ? 'text-white bg-primary-800' : 'text-primary-100 hover:text-white hover:bg-primary-800'
                  }`
                }
              >
                Profile
              </NavLink>
              <button
                onClick={handleSignOut}
                className="ml-3 px-3 py-1.5 rounded-md text-sm font-medium text-primary-300 hover:text-white hover:bg-primary-800 transition-colors"
              >
                Log out
              </button>
            </>
          ) : (
            <NavLink
              to="/login"
              className="ml-3 px-3 py-1.5 rounded-md text-sm font-medium text-primary-300 hover:text-white hover:bg-primary-800 transition-colors"
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
