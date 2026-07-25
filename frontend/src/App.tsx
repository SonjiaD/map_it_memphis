import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { AuthGuard, ResearcherGuard, AdminGuard } from './components/AuthGuard'
import { NavBar } from './components/NavBar'
import StoryPage from './pages/StoryPage'
import ExplorePage from './pages/ExplorePage'
import CollectPage from './pages/CollectPage'
import AdminPage from './pages/AdminPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ProfilePage from './pages/ProfilePage'

// Lazy: pulls in shp-write (jszip + a dbf writer) for Shapefile export, which would
// otherwise add real weight to every page's initial load, including the field
// Collect tool on tablets. Only fetched when someone actually visits /download.
const DownloadPage = lazy(() => import('./pages/DownloadPage'))

function PageLoading() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <span className="w-6 h-6 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

// The map workspace needs room and isn't built for phones. Below md (768px) this
// covers the app with a "use a larger screen" message. Pure CSS (md:hidden), so it
// appears/disappears automatically as the viewport crosses the breakpoint.
function SmallScreenGate() {
  return (
    <div className="md:hidden fixed inset-0 z-[3000] bg-primary-900 text-white flex flex-col items-center justify-center text-center px-8">
      <span className="w-14 h-14 rounded-2xl bg-primary-800 flex items-center justify-center mb-6">
        <svg viewBox="0 0 24 24" className="text-accent-500" fill="currentColor" style={{ width: 28, height: 28 }}>
          <path d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7zm0 9.5A2.5 2.5 0 1112 6a2.5 2.5 0 010 5.5z" />
        </svg>
      </span>
      <h1 className="font-display text-3xl mb-3">Best viewed on a larger screen</h1>
      <p className="text-primary-200 max-w-xs leading-relaxed">
        MAPP It Memphis is an interactive map workspace that needs more room than a phone.
        Please open it on a tablet (landscape), laptop, or desktop.
      </p>
    </div>
  )
}

function AppShell() {
  const location = useLocation()
  // The Explore map is a fixed workspace; every other page scrolls normally.
  const isExplorePage = location.pathname === '/'

  return (
    <div className="h-screen bg-surface-page flex flex-col overflow-hidden">
      <NavBar />
      <div className={`flex-1 min-h-0 flex flex-col ${isExplorePage ? 'overflow-hidden' : 'overflow-auto'}`}>
        <Routes>
          <Route path="/" element={<ExplorePage />} />
          <Route path="/story" element={<StoryPage />} />
          <Route path="/download" element={
            <Suspense fallback={<PageLoading />}><DownloadPage /></Suspense>
          } />
          {/* Legacy content routes fold into the story page */}
          <Route path="/about" element={<Navigate to="/story" replace />} />
          <Route path="/methodology" element={<Navigate to="/story#method" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          {/* Collection requires an approved collector or an admin (ResearcherGuard);
              unapproved signups see a pending notice. */}
          <Route path="/collect" element={<ResearcherGuard><CollectPage /></ResearcherGuard>} />
          <Route path="/admin" element={<AdminGuard><AdminPage /></AdminGuard>} />
          <Route path="/profile" element={<AuthGuard><ProfilePage /></AuthGuard>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <SmallScreenGate />
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
