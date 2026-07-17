import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { AuthGuard } from './components/AuthGuard'
import { NavBar } from './components/NavBar'
import StoryPage from './pages/StoryPage'
import ExplorePage from './pages/ExplorePage'
import CollectPage from './pages/CollectPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ProfilePage from './pages/ProfilePage'

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
          {/* Legacy content routes fold into the story page */}
          <Route path="/about" element={<Navigate to="/story" replace />} />
          <Route path="/methodology" element={<Navigate to="/story#method" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          {/* Open collection: any signed-in account can collect for now. Display on
              the public map is curated separately via is_published (see AuthContext). */}
          <Route path="/collect" element={<AuthGuard><CollectPage /></AuthGuard>} />
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
