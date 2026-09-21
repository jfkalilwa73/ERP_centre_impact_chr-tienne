import { Outlet } from 'react-router-dom'
import { useHasPermission } from '@/stores/authStore'
import { ForbiddenPage } from '@/pages/ForbiddenPage'

type PermissionRouteProps = {
  permission: string
}

/** Bloque l'entrée dans une section si le droit effectif est absent. */
export function PermissionRoute({ permission }: PermissionRouteProps) {
  const allowed = useHasPermission(permission)

  if (!allowed) return <ForbiddenPage />

  return <Outlet />
}
