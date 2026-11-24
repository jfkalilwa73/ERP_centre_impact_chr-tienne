import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { PERMISSIONS } from '@/lib/permissions'
import { GuestRoute, ProtectedRoute } from './ProtectedRoute'
import { PermissionRoute } from './PermissionRoute'
import { DepartementAccessRoute } from './DepartementAccessRoute'
import { FamilleAccessRoute } from './FamilleAccessRoute'
import { PilotageDgeRoute } from './PilotageDgeRoute'

const LoginPage = lazy(() =>
  import('@/features/auth/LoginPage').then(({ LoginPage }) => ({ default: LoginPage })),
)
const DepartementsPage = lazy(() =>
  import('@/features/departements/DepartementsPage').then(({ DepartementsPage }) => ({ default: DepartementsPage })),
)
const DepartementDetailPage = lazy(() =>
  import('@/features/departements/DepartementDetailPage').then(({ DepartementDetailPage }) => ({ default: DepartementDetailPage })),
)
const FamillesPage = lazy(() =>
  import('@/features/familles/FamillesPage').then(({ FamillesPage }) => ({ default: FamillesPage })),
)
const FamilleDetailPage = lazy(() =>
  import('@/features/familles/FamilleDetailPage').then(({ FamilleDetailPage }) => ({ default: FamilleDetailPage })),
)
const PersonnesPage = lazy(() =>
  import('@/features/personnes/PersonnesPage').then(({ PersonnesPage }) => ({ default: PersonnesPage })),
)
const PersonneDetailPage = lazy(() =>
  import('@/features/personnes/PersonneDetailPage').then(({ PersonneDetailPage }) => ({ default: PersonneDetailPage })),
)
const ComptesPage = lazy(() =>
  import('@/features/comptes/ComptesPage').then(({ ComptesPage }) => ({ default: ComptesPage })),
)
const CompteDetailPage = lazy(() =>
  import('@/features/comptes/CompteDetailPage').then(({ CompteDetailPage }) => ({ default: CompteDetailPage })),
)
const RolesPage = lazy(() =>
  import('@/features/roles/RolesPage').then(({ RolesPage }) => ({ default: RolesPage })),
)
const RoleDetailPage = lazy(() =>
  import('@/features/roles/RoleDetailPage').then(({ RoleDetailPage }) => ({ default: RoleDetailPage })),
)
const PermissionsPage = lazy(() =>
  import('@/features/permissions/PermissionsPage').then(({ PermissionsPage }) => ({ default: PermissionsPage })),
)
const AuditPage = lazy(() =>
  import('@/features/audit/AuditPage').then(({ AuditPage }) => ({ default: AuditPage })),
)
const AuditDetailPage = lazy(() =>
  import('@/features/audit/AuditDetailPage').then(({ AuditDetailPage }) => ({ default: AuditDetailPage })),
)
const NotificationsPage = lazy(() =>
  import('@/features/notifications/NotificationsPage').then(({ NotificationsPage }) => ({ default: NotificationsPage })),
)
const DashboardPage = lazy(() =>
  import('@/pages/DashboardPage').then(({ DashboardPage }) => ({ default: DashboardPage })),
)
const NotFoundPage = lazy(() =>
  import('@/pages/NotFoundPage').then(({ NotFoundPage }) => ({ default: NotFoundPage })),
)

export function AppRoutes() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-center text-slate-500" role="status">
          Chargement de la page…
        </div>
      }
    >
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
              <Route element={<PilotageDgeRoute />}>
                <Route path="departements/suivi" element={<DepartementsPage />} />
                <Route path="departements/rapports" element={<DepartementsPage />} />
              </Route>
            </Route>
            <Route element={<DepartementAccessRoute />}>
              <Route path="departements/:departementId" element={<DepartementDetailPage />} />
            </Route>

            <Route element={<PermissionRoute permission={PERMISSIONS.FAMILLES_READ} />}>
              <Route path="familles" element={<FamillesPage />} />
              <Route element={<PilotageDgeRoute />}>
                <Route path="familles/suivi" element={<FamillesPage />} />
                <Route path="familles/rapports" element={<FamillesPage />} />
              </Route>
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
    </Suspense>
  )
}
