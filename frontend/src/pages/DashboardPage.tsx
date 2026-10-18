import { Navigate } from 'react-router-dom'
import { Alert } from '@/components/ui/Alert'
import { useAccessScope } from '@/features/auth/accessScope'
import { permissionLabelFromCode } from '@/features/permissions/labels'
import { useCurrentUser, useSessionProfil } from '@/stores/authStore'

export function DashboardPage() {
  const user = useCurrentUser()
  const profil = useSessionProfil()
  const scope = useAccessScope()

  if (!user) {
    if (!profil) return null
    return (
      <h1 className="text-2xl font-semibold text-slate-900">Bonjour {profil.name}</h1>
    )
  }
  if (scope.isScoped) {
    if (scope.isLoading) {
      return <p className="text-sm text-slate-500">Chargement de votre espace…</p>
    }
    if (scope.homePath !== '/') {
      return <Navigate to={scope.homePath} replace />
    }
  }

  const sansRole = user.roles.length === 0
  const sansDroit = user.permissions.length === 0

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Bonjour {user.personne.prenom} 👋
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {sansDroit
            ? 'Votre connexion a réussi, mais votre compte n’ouvre encore aucune page.'
            : 'Voici les rôles et les droits actuellement ouverts sur votre compte.'}
        </p>
      </div>

      {sansDroit && (
        <Alert variant="warning" title="Vous n’avez aucun accès à l’application">
          {sansRole ? (
            <p>
              Aucun rôle n’est rattaché à votre compte. Sans rôle, vous ne pouvez rien consulter
              ni modifier. Contactez un administrateur pour qu’il vous attribue un rôle.
            </p>
          ) : (
            <p>
              Un rôle vous a été donné, mais il est inactif ou sans permission. Vous ne pouvez
              donc rien faire pour le moment. Demandez à un administrateur de réactiver ce rôle
              ou de lui ajouter des droits.
            </p>
          )}
        </Alert>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Rôles</h2>
        {sansRole ? (
          <p className="mt-2 text-sm text-slate-500">
            Aucun rôle n’est attribué à ce compte — c’est pour cela que l’application reste fermée.
          </p>
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
          Droits ouverts ({user.permissions.length})
        </h2>
        {sansDroit ? (
          <p className="mt-2 text-sm text-slate-500">
            Aucun droit n’est ouvert : menus, départements et familles restent inaccessibles.
          </p>
        ) : (
          <ul className="mt-3 flex flex-wrap gap-2">
            {user.permissions.map((permission) => (
              <li
                key={permission}
                className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600"
              >
                {permissionLabelFromCode(permission)}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
