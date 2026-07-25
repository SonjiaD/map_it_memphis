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
