import { Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoginPage } from '@/features/auth/LoginPage'
import { DepartementsPage } from '@/features/departements/DepartementsPage'
import { DepartementDetailPage } from '@/features/departements/DepartementDetailPage'
import { FamillesPage } from '@/features/familles/FamillesPage'
import { FamilleDetailPage } from '@/features/familles/FamilleDetailPage'
import { PersonnesPage } from '@/features/personnes/PersonnesPage'
import { PersonneDetailPage } from '@/features/personnes/PersonneDetailPage'
import { ComptesPage } from '@/features/comptes/ComptesPage'
import { CompteDetailPage } from '@/features/comptes/CompteDetailPage'
import { RolesPage } from '@/features/roles/RolesPage'
import { RoleDetailPage } from '@/features/roles/RoleDetailPage'
import { PermissionsPage } from '@/features/permissions/PermissionsPage'
import { AuditPage } from '@/features/audit/AuditPage'
import { AuditDetailPage } from '@/features/audit/AuditDetailPage'
import { NotificationsPage } from '@/features/notifications/NotificationsPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { PERMISSIONS } from '@/lib/permissions'
import { GuestRoute, ProtectedRoute } from './ProtectedRoute'
import { PermissionRoute } from './PermissionRoute'
import { DepartementAccessRoute } from './DepartementAccessRoute'
import { FamilleAccessRoute } from './FamilleAccessRoute'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/connexion" element={<LoginPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />

          <Route element={<PermissionRoute permission={PERMISSIONS.DEMANDES_READ} />}>
            <Route path="notifications" element={<NotificationsPage />} />
          </Route>

          <Route element={<PermissionRoute permission={PERMISSIONS.MEMBRES_READ} />}>
            <Route path="personnes" element={<PersonnesPage />} />
            <Route path="personnes/:personneId" element={<PersonneDetailPage />} />
          </Route>

          <Route element={<PermissionRoute permission={PERMISSIONS.COMPTES_READ} />}>
            <Route path="comptes" element={<ComptesPage />} />
            <Route path="comptes/:compteId" element={<CompteDetailPage />} />
          </Route>

          <Route element={<PermissionRoute permission={PERMISSIONS.DEPARTEMENTS_READ} />}>
            <Route path="departements" element={<DepartementsPage />} />
          </Route>
          <Route element={<DepartementAccessRoute />}>
            <Route path="departements/:departementId" element={<DepartementDetailPage />} />
          </Route>

          <Route element={<PermissionRoute permission={PERMISSIONS.FAMILLES_READ} />}>
            <Route path="familles" element={<FamillesPage />} />
          </Route>
          <Route element={<FamilleAccessRoute />}>
            <Route path="familles/:familleId" element={<FamilleDetailPage />} />
          </Route>

          <Route
            element={
              <PermissionRoute permission={[PERMISSIONS.ROLES_READ, PERMISSIONS.ROLES_MANAGE]} />
            }
          >
            <Route path="roles" element={<RolesPage />} />
            <Route path="roles/:roleId" element={<RoleDetailPage />} />
            <Route path="permissions" element={<PermissionsPage />} />
          </Route>

          <Route element={<PermissionRoute permission={PERMISSIONS.AUDIT_READ} />}>
            <Route path="audit" element={<AuditPage />} />
            <Route path="audit/:auditId" element={<AuditDetailPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
