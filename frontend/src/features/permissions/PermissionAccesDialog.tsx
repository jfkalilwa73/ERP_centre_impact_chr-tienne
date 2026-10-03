import { useMemo, useState } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogContent } from '@/components/ui/Dialog'
import { Select } from '@/components/ui/Select'
import { statutCompteBadgeClass, statutCompteLabels } from '@/features/comptes/statut'
import { useRoles } from '@/features/roles/hooks'
import { ROLE_CODES } from '@/lib/roleCodes'
import { useCurrentUser } from '@/stores/authStore'
import type { CompteStatut, Permission } from '@/types'
import { permissionLabel } from './labels'
import {
  useAssignTitulaireRole,
  useGrantPermissionToRole,
  usePermissionRoles,
  usePermissionTitulaires,
  useRevokePermissionFromRole,
  useUnassignTitulaireRole,
  useUpdateTitulaireCompte,
} from './hooks'

type PermissionAccesDialogProps = {
  permission: Permission | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PermissionAccesDialog({
  permission,
  open,
  onOpenChange,
}: PermissionAccesDialogProps) {
  const permissionId = permission?.idPermission
  const user = useCurrentUser()
  const [roleToGrant, setRoleToGrant] = useState('')
  const [roleToAddByCompte, setRoleToAddByCompte] = useState<Record<string, string>>({})

  const grantingQuery = usePermissionRoles(permissionId, open)
  const titulairesQuery = usePermissionTitulaires(permissionId, open)
  const rolesQuery = useRoles({ page: 1, limit: 100 }, open)

  const grantRole = useGrantPermissionToRole(permissionId ?? '')
  const revokeRole = useRevokePermissionFromRole(permissionId ?? '')
  const assignRole = useAssignTitulaireRole(permissionId ?? '')
  const unassignRole = useUnassignTitulaireRole(permissionId ?? '')
  const updateCompte = useUpdateTitulaireCompte(permissionId ?? '')

  const grantingRoles = grantingQuery.data ?? []
  const grantingIds = new Set(grantingRoles.map((role) => role.idRole))
  const allRoles = (rolesQuery.data?.data ?? []).filter((role) => role.actif)
  const roleNames = new Map(allRoles.map((role) => [role.idRole, role.nom]))
  const roleCodes = new Map(allRoles.map((role) => [role.idRole, role.code]))
  const rolesSansCeDroit = allRoles.filter((role) => !grantingIds.has(role.idRole))
  const titulaires = useMemo(
    () =>
      [...(titulairesQuery.data ?? [])].sort((left, right) =>
        `${left.prenom} ${left.nom}`.localeCompare(`${right.prenom} ${right.nom}`, 'fr'),
      ),
    [titulairesQuery.data],
  )

  const monCompteId = user?.compte.idCompte
  const actionError =
    grantRole.error?.message ||
    revokeRole.error?.message ||
    assignRole.error?.message ||
    unassignRole.error?.message ||
    updateCompte.error?.message

  const estMonCompte = (idCompte: string) => idCompte === monCompteId

  const onGrantRole = () => {
    if (!roleToGrant) return
    grantRole.mutate({ roleId: roleToGrant }, { onSuccess: () => setRoleToGrant('') })
  }

  const onAjouterRole = (idCompte: string) => {
    const idRole = roleToAddByCompte[idCompte]
    if (!idRole) return
    assignRole.mutate(
      { compteId: idCompte, idRole },
      {
        onSuccess: () => setRoleToAddByCompte((current) => ({ ...current, [idCompte]: '' })),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={permission ? `Qui a ce droit — ${permissionLabel(permission)}` : 'Qui a ce droit'}
        description="Personnes qui ont ce droit, et rôles qui le donnent. Suspendre un compte ou retirer un rôle coupe l’accès."
        className="max-w-4xl"
      >
        {!permission ? null : (
          <div className="flex flex-col gap-6">
            {actionError && (
              <Alert variant="error" title="Mise à jour impossible">
                {actionError}
              </Alert>
            )}

            <section>
              <h3 className="text-sm font-semibold text-slate-900">Rôles qui ouvrent ce droit</h3>
              <p className="mt-1 text-xs text-slate-500">
                Retirer ce droit d’un rôle l’enlève à toutes les personnes qui l’ont via ce rôle.
              </p>
              {grantingQuery.isLoading ? (
                <p className="mt-3 text-sm text-slate-500">Chargement des rôles…</p>
              ) : grantingRoles.length === 0 ? (
                <p className="mt-3 rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
                  Aucun rôle n’ouvre ce droit pour le moment.
                </p>
              ) : (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {grantingRoles.map((role) => (
                    <li
                      key={role.idRole}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700"
                    >
                      <span>{role.nom}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-1.5 text-red-600 hover:bg-red-50 hover:text-red-700"
                        aria-label={`Retirer « ${permissionLabel(permission)} » de ${role.nom}`}
                        isLoading={revokeRole.isPending && revokeRole.variables?.roleId === role.idRole}
                        onClick={() => revokeRole.mutate({ roleId: role.idRole })}
                      >
                        Retirer
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <Select
                  aria-label="Rôle à doter de ce droit"
                  value={roleToGrant}
                  onChange={(event) => setRoleToGrant(event.target.value)}
                >
                  <option value="">Donner ce droit à un autre rôle…</option>
                  {rolesSansCeDroit.map((role) => (
                    <option key={role.idRole} value={role.idRole}>
                      {role.nom}
                    </option>
                  ))}
                </Select>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={!roleToGrant}
                  isLoading={grantRole.isPending}
                  onClick={onGrantRole}
                >
                  Ajouter au rôle
                </Button>
              </div>
            </section>

            <section>
              <h3 className="text-sm font-semibold text-slate-900">Personnes qui ont ce droit</h3>
              {titulairesQuery.isError && (
                <Alert variant="error" title="Impossible de charger les personnes" className="mt-3">
                  {titulairesQuery.error.message}
                </Alert>
              )}
              {titulairesQuery.isLoading ? (
                <p className="mt-3 text-sm text-slate-500">Chargement des personnes…</p>
              ) : titulaires.length === 0 ? (
                <p className="mt-3 rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
                  Personne n’a ce droit pour le moment.
                </p>
              ) : (
                <ul className="mt-3 flex flex-col gap-3">
                  {titulaires.map((titulaire) => {
                    const soi = estMonCompte(titulaire.idCompte)
                    const autresRoles = allRoles.filter((role) => !titulaire.idRoles.includes(role.idRole))
                    return (
                      <li
                        key={titulaire.idCompte}
                        className="rounded-xl border border-slate-200 bg-slate-50/60 p-4"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="font-medium text-slate-900">
                              {titulaire.prenom} {titulaire.nom}
                            </p>
                            <p className="text-xs text-slate-500">{titulaire.email}</p>
                          </div>
                          <div className="flex flex-col gap-2 sm:w-52">
                            <span
                              className={`inline-flex w-fit rounded-full px-2 py-0.5 text-xs font-medium ${statutCompteBadgeClass(titulaire.statut)}`}
                            >
                              {statutCompteLabels[titulaire.statut]}
                            </span>
                            <Select
                              aria-label={`Statut de ${titulaire.prenom} ${titulaire.nom}`}
                              value={titulaire.statut}
                              disabled={soi || updateCompte.isPending}
                              onChange={(event) =>
                                updateCompte.mutate({
                                  compteId: titulaire.idCompte,
                                  payload: { statut: event.target.value as CompteStatut },
                                })
                              }
                            >
                              <option value="actif">Actif</option>
                              <option value="suspendu">Suspendu</option>
                              <option value="desactive">Désactivé</option>
                            </Select>
                          </div>
                        </div>

                        <div className="mt-3">
                          <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
                            Rôles
                          </p>
                          <ul className="mt-2 flex flex-wrap gap-2">
                            {titulaire.idRoles.map((idRole) => (
                              <li
                                key={idRole}
                                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700"
                              >
                                <span>{roleNames.get(idRole) ?? 'Rôle'}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-1.5 text-red-600 hover:bg-red-50"
                                  aria-label={`Retirer ${roleNames.get(idRole) ?? 'le rôle'} à ${titulaire.prenom}`}
                                  disabled={soi && roleCodes.get(idRole) === ROLE_CODES.ADMIN_FONCTIONNEL}
                                  isLoading={
                                    unassignRole.isPending &&
                                    unassignRole.variables?.compteId === titulaire.idCompte &&
                                    unassignRole.variables.idRole === idRole
                                  }
                                  onClick={() =>
                                    unassignRole.mutate({
                                      compteId: titulaire.idCompte,
                                      idRole,
                                    })
                                  }
                                >
                                  Retirer
                                </Button>
                              </li>
                            ))}
                          </ul>
                          {autresRoles.length > 0 && (
                            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                              <Select
                                aria-label={`Ajouter un rôle à ${titulaire.prenom} ${titulaire.nom}`}
                                value={roleToAddByCompte[titulaire.idCompte] ?? ''}
                                onChange={(event) =>
                                  setRoleToAddByCompte((current) => ({
                                    ...current,
                                    [titulaire.idCompte]: event.target.value,
                                  }))
                                }
                              >
                                <option value="">Ajouter un rôle…</option>
                                {autresRoles.map((role) => (
                                  <option key={role.idRole} value={role.idRole}>
                                    {role.nom}
                                  </option>
                                ))}
                              </Select>
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                disabled={!roleToAddByCompte[titulaire.idCompte]}
                                isLoading={
                                  assignRole.isPending &&
                                  assignRole.variables?.compteId === titulaire.idCompte
                                }
                                onClick={() => onAjouterRole(titulaire.idCompte)}
                              >
                                Ajouter
                              </Button>
                            </div>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
