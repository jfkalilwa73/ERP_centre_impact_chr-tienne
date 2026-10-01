import { Outlet } from 'react-router-dom'
import { canSeePilotageDge } from '@/features/auth/orgRoles'
import { ForbiddenPage } from '@/pages/ForbiddenPage'
import { useCurrentUser } from '@/stores/authStore'

/** Suivi et rapports consolidés : DGE et administrateur seulement. */
export function PilotageDgeRoute() {
  if (!canSeePilotageDge(useCurrentUser())) return <ForbiddenPage />
  return <Outlet />
}
