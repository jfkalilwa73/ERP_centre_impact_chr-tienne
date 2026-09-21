import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useIsAuthenticated } from '@/stores/authStore'

export function ProtectedRoute() {
  const isAuthenticated = useIsAuthenticated()
  const location = useLocation()

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/connexion"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    )
  }

  return <Outlet />
}

/** Réservé aux visiteurs non connectés (écran de connexion). */
export function GuestRoute() {
  const isAuthenticated = useIsAuthenticated()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from

  if (isAuthenticated) {
    return <Navigate to={from && from !== '/connexion' ? from : '/'} replace />
  }

  return <Outlet />
}
