import { Outlet, useLocation } from 'react-router-dom'
import { useApplicationPageAccess, applicationPageFromPath } from '@/features/auth/applicationPageAccess'
import { ChargementCentre } from '@/components/ui/Chargement'
import { ForbiddenPage } from '@/pages/ForbiddenPage'

export function AppPageAccessRoute() {
  const location = useLocation()
  const pageAccess = useApplicationPageAccess()
  const page = applicationPageFromPath(location.pathname)

  if (page === null) return <Outlet />
  if (pageAccess.isLoading) return <ChargementCentre label="Vérification de l’accès aux pages…" page />
  if (!pageAccess.canView(page)) return <ForbiddenPage />

  return <Outlet />
}
