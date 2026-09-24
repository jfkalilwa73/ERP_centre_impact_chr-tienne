import { Outlet } from 'react-router-dom'
import { useCurrentUser } from '@/stores/authStore'
import { ForbiddenPage } from '@/pages/ForbiddenPage'

type PermissionRouteProps = {
  permission: string | string[]
}

/** Bloque l'entrée dans une section si aucun des droits n'est présent. */
export function PermissionRoute({ permission }: PermissionRouteProps) {
  const permissions = useCurrentUser()?.permissions ?? []
  const required = Array.isArray(permission) ? permission : [permission]
  const allowed = required.some((code) => permissions.includes(code))

  if (!allowed) return <ForbiddenPage />

  return <Outlet />
}
