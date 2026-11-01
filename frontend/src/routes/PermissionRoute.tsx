import { Outlet } from 'react-router-dom'
import { useCurrentUser, useSessionProfil } from '@/stores/authStore'
import { ForbiddenPage } from '@/pages/ForbiddenPage'

type PermissionRouteProps = {
  permission: string | string[]
}

export function PermissionRoute({ permission }: PermissionRouteProps) {
  const userPermissions = useCurrentUser()?.permissions ?? []
  const sessionPermissions =
    (useSessionProfil() as { permissions?: string[] } | null)?.permissions ?? []
  const permissions = userPermissions.length > 0 ? userPermissions : sessionPermissions
  const required = Array.isArray(permission) ? permission : [permission]
  const allowed = required.some((code) => permissions.includes(code))

  if (!allowed) return <ForbiddenPage />

  return <Outlet />
}