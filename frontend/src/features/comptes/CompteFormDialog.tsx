import { useEffect, useMemo, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert } from '@/components/ui/Alert'
import { ChargementCentre } from '@/components/ui/Chargement'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogContent } from '@/components/ui/Dialog'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useDepartements } from '@/features/departements/hooks'
import { usePersonneAffectations } from '@/features/personnes/hooks'
import { errorId } from '@/lib/form'
import { canonicalRoleCode, ROLE_CODES } from '@/lib/roleCodes'
import { useCurrentUser } from '@/stores/authStore'
import type { Compte, Personne, Role } from '@/types'
import { useCompteRoles } from './hooks'
import { compteSchema, emptyCompteForm, type CompteFormValues } from './schema'

function isChefAssignment(fonction?: string) {
  const normalized = (fonction ?? '').trim().toLowerCase()
  return normalized === 'chef' || normalized.includes('chef de département')
}

type CompteFormDialogProps = {
  open: boolean
  compte?: Compte | null
  personnes: Personne[]
  roles: Role[]
  rolesError?: string
  errorMessage?: string
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: CompteFormValues) => void | Promise<void>
}

export function CompteFormDialog({
  open,
  compte,
  personnes,
  roles,
  rolesError,
  errorMessage,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: CompteFormDialogProps) {
  const isEditing = Boolean(compte)
  const user = useCurrentUser()
  const assignedQuery = useCompteRoles(open && isEditing ? compte?.idCompte : undefined)
  const chefRoleId = roles.find((role) => canonicalRoleCode(role) === ROLE_CODES.CHEF_DEPARTEMENT)?.idRole
  const superviseurRoleId = roles.find((role) => canonicalRoleCode(role) === ROLE_CODES.SUPERVISEUR)?.idRole
  const scopedRoleIds = useMemo(
    () => ({ chefDepartement: chefRoleId, superviseur: superviseurRoleId }),
    [chefRoleId, superviseurRoleId],
  )
  const resolver = useMemo(
    () => zodResolver(compteSchema(isEditing, scopedRoleIds)),
    [isEditing, scopedRoleIds],
  )
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CompteFormValues>({
    resolver,
    defaultValues: emptyCompteForm,
  })

  const idRoles = watch('idRoles')
  const targetPersonId = isEditing ? compte?.idPersonne : watch('idPersonne')
  const affectationsQuery = usePersonneAffectations(open ? targetPersonId : undefined)
  const wantsChefRole = Boolean(chefRoleId && idRoles.includes(chefRoleId))
  const wantsSuperviseurRole = Boolean(superviseurRoleId && idRoles.includes(superviseurRoleId))
  const departementsQuery = useDepartements(
    { page: 1, limit: 100 },
    open && (wantsChefRole || wantsSuperviseurRole),
  )
  const createPersonneInitialisee = useRef<string | null>(null)
  const roleDepartments = watch('roleDepartments')
  const departementsChef = roleDepartments?.chefDepartement ?? []
  const departementsSuperviseur = roleDepartments?.superviseur ?? []
  const departementsDisponibles = (departementsQuery.data?.data ?? []).filter((departement) => departement.actif)

  useEffect(() => {
    if (!open) {
      createPersonneInitialisee.current = null
      return
    }
    if (!isEditing) {
      reset(emptyCompteForm)
    }
  }, [isEditing, open, reset])

  useEffect(() => {
    if (!open || !compte) return
    if (assignedQuery.isLoading || affectationsQuery.isLoading) return
    const idRolesActifs = (assignedQuery.data ?? [])
      .filter((affectation) => affectation.actif)
      .map((affectation) => affectation.idRole)
    const affectationsActives = (affectationsQuery.data ?? []).filter(
      (affectation) => affectation.actif,
    )
    reset({
      idPersonne: compte.idPersonne,
      email: compte.email,
      motDePasse: '',
      confirmationMotDePasse: '',
      statut: compte.statut,
      mfaActive: compte.mfaActive ? 'true' : 'false',
      idRoles: idRolesActifs,
      roleDepartments: {
        chefDepartement: affectationsActives
          .filter((affectation) => isChefAssignment(affectation.fonction))
          .map((affectation) => affectation.idDepartement),
        superviseur: affectationsActives
          .filter((affectation) =>
            (affectation.fonction ?? '').trim().toLowerCase().includes('superviseur'),
          )
          .map((affectation) => affectation.idDepartement),
      },
    })
  }, [
    affectationsQuery.data,
    affectationsQuery.isLoading,
    assignedQuery.data,
    assignedQuery.isLoading,
    compte,
    open,
    reset,
  ])

  useEffect(() => {
    if (!open || isEditing || !targetPersonId || affectationsQuery.isLoading) return
    if (createPersonneInitialisee.current === targetPersonId) return
    createPersonneInitialisee.current = targetPersonId
    const affectationsActives = (affectationsQuery.data ?? []).filter(
      (affectation) => affectation.actif,
    )
    setValue(
      'roleDepartments',
      {
        chefDepartement: affectationsActives
          .filter((affectation) => isChefAssignment(affectation.fonction))
          .map((affectation) => affectation.idDepartement),
        superviseur: affectationsActives
          .filter((affectation) =>
            (affectation.fonction ?? '').trim().toLowerCase().includes('superviseur'),
          )
          .map((affectation) => affectation.idDepartement),
      },
      { shouldValidate: true },
    )
  }, [affectationsQuery.data, affectationsQuery.isLoading, isEditing, open, setValue, targetPersonId])

  const toggleRole = (idRole: string, checked: boolean) => {
    const next = checked ? [...idRoles, idRole] : idRoles.filter((id) => id !== idRole)
    setValue('idRoles', next, { shouldDirty: true, shouldValidate: true })
  }

  const toggleDepartment = (kind: 'chefDepartement' | 'superviseur', departmentId: string) => {
    const selected = kind === 'chefDepartement' ? departementsChef : departementsSuperviseur
    const next = selected.includes(departmentId)
      ? selected.filter((id) => id !== departmentId)
      : [...selected, departmentId]
    setValue(`roleDepartments.${kind}`, next, { shouldDirty: true, shouldValidate: true })
  }

  const rolesActifs = [...roles]
    .filter((role) => role.actif || idRoles.includes(role.idRole))
    .sort((left, right) => left.nom.localeCompare(right.nom, 'fr'))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={isEditing ? 'Modifier le compte' : 'Nouveau compte'}
        description="Attribuez un ou plusieurs rôles : sans rôle, la personne ne peut rien faire dans l’application."
      >
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          {errorMessage && (
            <Alert variant="error" title="Enregistrement impossible">
              {errorMessage}
            </Alert>
          )}

          {!isEditing && (
            <FormField id="compte-personne" label="Personne rattachée" error={errors.idPersonne?.message}>
              <Select
                id="compte-personne"
                hasError={Boolean(errors.idPersonne)}
                aria-describedby={errors.idPersonne ? errorId('compte-personne') : undefined}
                {...register('idPersonne')}
              >
                <option value="">Choisir une personne</option>
                {personnes.map((personne) => (
                  <option key={personne.idPersonne} value={personne.idPersonne}>
                    {personne.prenom} {personne.nom}
                  </option>
                ))}
              </Select>
            </FormField>
          )}

          <FormField id="compte-email" label="Adresse e-mail" error={errors.email?.message}>
            <Input
              id="compte-email"
              type="email"
              autoComplete="email"
              placeholder="jean@eglise.org"
              hasError={Boolean(errors.email)}
              aria-describedby={errors.email ? errorId('compte-email') : undefined}
              {...register('email')}
            />
          </FormField>

          <FormField id="compte-mot-de-passe" label={isEditing ? 'Nouveau mot de passe' : 'Mot de passe'} error={errors.motDePasse?.message}>
            <Input
              id="compte-mot-de-passe"
              type="password"
              autoComplete="new-password"
              hasError={Boolean(errors.motDePasse)}
              aria-describedby={errors.motDePasse ? errorId('compte-mot-de-passe') : undefined}
              {...register('motDePasse')}
            />
          </FormField>

          {isEditing && (
            <>
              <p className="-mt-2 text-xs text-slate-500">
                Laissez vide pour conserver le mot de passe actuel.
              </p>
              <FormField
                id="compte-confirmation-mot-de-passe"
                label="Confirmer le nouveau mot de passe"
                error={errors.confirmationMotDePasse?.message}
              >
                <Input
                  id="compte-confirmation-mot-de-passe"
                  type="password"
                  autoComplete="new-password"
                  hasError={Boolean(errors.confirmationMotDePasse)}
                  aria-describedby={
                    errors.confirmationMotDePasse
                      ? errorId('compte-confirmation-mot-de-passe')
                      : undefined
                  }
                  {...register('confirmationMotDePasse')}
                />
              </FormField>
            </>
          )}

          <FormField id="compte-statut" label="Statut" error={errors.statut?.message}>
            <Select
              id="compte-statut"
              hasError={Boolean(errors.statut)}
              aria-describedby={errors.statut ? errorId('compte-statut') : undefined}
              {...register('statut')}
            >
              <option value="actif">Actif</option>
              <option value="suspendu">Suspendu</option>
              <option value="desactive">Désactivé</option>
            </Select>
          </FormField>

          {isEditing && (
            <FormField
              id="compte-mfa"
              label="Double authentification"
              error={errors.mfaActive?.message}
            >
              <Select
                id="compte-mfa"
                hasError={Boolean(errors.mfaActive)}
                aria-describedby={errors.mfaActive ? errorId('compte-mfa') : undefined}
                {...register('mfaActive')}
              >
                <option value="false">Désactivée</option>
                <option value="true">Activée</option>
              </Select>
            </FormField>
          )}

          <fieldset className="flex flex-col gap-2">
            <legend id="compte-roles-legend" className="text-sm font-medium text-slate-800">
              Rôles d’accès
            </legend>
            <p className="text-xs text-slate-500">
              Cochez les rôles que ce compte peut utiliser. Le changement prend effet tout de suite.
            </p>
            {rolesError && (
              <Alert variant="error" title="Impossible de charger les rôles">
                {rolesError}
              </Alert>
            )}
            {isEditing && assignedQuery.isLoading && (
              <ChargementCentre label="Chargement des rôles actuels…" compact />
            )}
            {isEditing && assignedQuery.isError && (
              <Alert variant="error" title="Impossible de charger les rôles du compte">
                {assignedQuery.error.message}
              </Alert>
            )}
            {errors.idRoles?.message && (
              <p id={errorId('compte-roles')} role="alert" className="text-sm text-red-600">
                {errors.idRoles.message}
              </p>
            )}
            <div
              className="max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50/80 p-3"
              role="group"
              aria-labelledby="compte-roles-legend"
              aria-describedby={errors.idRoles ? errorId('compte-roles') : undefined}
            >
              {rolesActifs.length === 0 ? (
                <p className="text-sm text-slate-500">Aucun rôle actif dans le catalogue.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {rolesActifs.map((role) => {
                    const checked = idRoles.includes(role.idRole)
                    const bloqueAdmin =
                      Boolean(compte) &&
                      compte?.idCompte === user?.compte.idCompte &&
                      role.code === ROLE_CODES.ADMIN_FONCTIONNEL &&
                      checked
                    return (
                      <li key={role.idRole}>
                        <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            className="mt-0.5 size-4 rounded border-slate-300 text-brand-600"
                            checked={checked}
                            disabled={bloqueAdmin}
                            onChange={(event) => toggleRole(role.idRole, event.target.checked)}
                          />
                          <span>
                            <span className="font-medium text-slate-900">{role.nom}</span>
                            <span className="block text-xs text-slate-500">{role.code}</span>
                          </span>
                        </label>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </fieldset>

          {(wantsChefRole || wantsSuperviseurRole) && (
            <section className="flex flex-col gap-3 rounded-lg border border-brand-200 bg-brand-50/40 p-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Départements à gérer</h3>
                <p className="mt-1 text-xs text-slate-600">
                  Sélection obligatoire : ces rôles s’appliquent uniquement aux départements cochés.
                </p>
              </div>

              {departementsQuery.isLoading && <ChargementCentre label="Chargement des départements…" compact />}
              {departementsQuery.isError && (
                <Alert variant="error" title="Départements indisponibles">
                  {departementsQuery.error.message}
                </Alert>
              )}
              {departementsQuery.isSuccess && departementsDisponibles.length === 0 && (
                <p className="text-sm text-slate-600">Aucun département actif n’est disponible.</p>
              )}

              {departementsDisponibles.map((departement) => (
                <label
                  key={`scope-${departement.idDepartement}`}
                  className="flex items-start gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <span className="min-w-0 flex-1">
                    <span className="font-medium text-slate-900">{departement.nom}</span>
                    <span className="ml-2 text-xs text-slate-500">{departement.code}</span>
                  </span>
                  {wantsChefRole && (
                    <span className="flex items-center gap-1.5 text-xs text-slate-700">
                      <input
                        type="checkbox"
                        checked={departementsChef.includes(departement.idDepartement)}
                        onChange={() => toggleDepartment('chefDepartement', departement.idDepartement)}
                        className="size-4 rounded border-slate-300 text-brand-600"
                        aria-label={`${departement.nom} — Chef de département`}
                      />
                      Chef
                    </span>
                  )}
                  {wantsSuperviseurRole && (
                    <span className="flex items-center gap-1.5 text-xs text-slate-700">
                      <input
                        type="checkbox"
                        checked={departementsSuperviseur.includes(departement.idDepartement)}
                        onChange={() => toggleDepartment('superviseur', departement.idDepartement)}
                        className="size-4 rounded border-slate-300 text-brand-600"
                        aria-label={`${departement.nom} — Superviseur`}
                      />
                      Superviseur
                    </span>
                  )}
                </label>
              ))}
              {errors.roleDepartments?.chefDepartement?.message && (
                <p role="alert" className="text-sm text-red-600">{errors.roleDepartments.chefDepartement.message}</p>
              )}
              {errors.roleDepartments?.superviseur?.message && (
                <p role="alert" className="text-sm text-red-600">{errors.roleDepartments.superviseur.message}</p>
              )}
            </section>
          )}

          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              disabled={isEditing && (assignedQuery.isLoading || assignedQuery.isError)}
            >
              {isEditing ? 'Enregistrer' : 'Créer le compte'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
