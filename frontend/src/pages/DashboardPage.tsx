import { Navigate } from 'react-router-dom'
import { useAccessScope } from '@/features/auth/accessScope'
import { useCurrentUser } from '@/stores/authStore'

export function DashboardPage() {
  const user = useCurrentUser()
  const scope = useAccessScope()

  if (!user) return null
  if (scope.isScoped) {
    if (scope.isLoading) {
      return <p className="text-sm text-slate-500">Chargement de votre espace…</p>
    }
    if (scope.homePath !== '/') {
      return <Navigate to={scope.homePath} replace />
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Bonjour {user.personne.prenom} 👋
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Session ouverte sur le socle transverse de la Phase 0.
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Rôles</h2>
        {user.roles.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Aucun rôle attribué.</p>
        ) : (
          <ul className="mt-3 flex flex-wrap gap-2">
            {user.roles.map((role) => (
              <li
                key={role.idRole}
                className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700"
              >
                {role.nom}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">
          Permissions effectives ({user.permissions.length})
        </h2>
        {user.permissions.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Aucune permission effective.</p>
        ) : (
          <ul className="mt-3 flex flex-wrap gap-2">
            {user.permissions.map((permission) => (
              <li
                key={permission}
                className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-600"
              >
                {permission}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
