/**
 * ProtectedRoute — guards authenticated pages.
 *
 * - No token → redirect to /login
 * - Token present but profile incomplete → redirect to /onboarding
 *   (except when already on /onboarding)
 * - Loading state → show nothing (avoid flash)
 */
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="loading-screen">
        <span className="label">LOADING...</span>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (
    user &&
    !user.profile_complete &&
    location.pathname !== '/onboarding'
  ) {
    return <Navigate to="/onboarding" replace />
  }

  return children
}
