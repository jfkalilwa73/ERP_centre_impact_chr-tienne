import { useMemo, useState, useSyncExternalStore, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, Plus, Trash2, User, UserPlus, UserRound, Users } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogContent } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { DepartementBanner } from '@/features/departements/banner'
import {
  ChartPanel,
  EvolutionActivitesChart,
  EvolutionMembresChart,
} from '@/features/departements/charts'
import { DepartementLoading } from '@/features/departements/loading'
import { StatCard } from '@/features/departements/StatCard'
import { useAccessScope } from '@/features/auth/accessScope'
import { PersonneAvatar } from '@/features/personnes/PersonneAvatar'
import { usePersonnes, usePersonnesFamilles } from '@/features/personnes/hooks'
import { cn } from '@/lib/cn'
import { PERMISSIONS } from '@/lib/permissions'
import { useCurrentUser, useHasPermission } from '@/stores/authStore'
import type { AffectationFamille, Personne } from '@/types'
import {
  addActiviteFamille,
  deleteActiviteFamille,
  getActivitesFamilleVersion,
  listActivitesFamille,
  marquerActiviteFamilleFaite,
  subscribeActivitesFamille,
} from './activites'
import { evolutionActivites, evolutionFamille } from './evolution'
import { useAssignPersonneFamille, useFamille, useUnassignPersonneFamille } from './hooks'
import { isLeadershipRole, roleFamille, ROLES_FAMILLE, type RoleFamille } from './roles'

const TABS = [
  { id: 'tableau', label: 'Tableau de bord' },
  { id: 'membres', label: 'Membres' },
  { id: 'activites', label: 'Activités' },
] as const

type TabId = (typeof TABS)[number]['id']

function personneName(personne: Personne) {
  return `${personne.prenom} ${personne.nom}`
}

export function FamilleDetailPage() {
  const { familleId } = useParams<{ familleId: string }>()
  const [tab, setTab] = useState<TabId>('tableau')
  const [assignOpen, setAssignOpen] = useState(false)
  const [membreSearch, setMembreSearch] = useState('')
  const [roleDraft, setRoleDraft] = useState<RoleFamille>('Membre')
  const [selectedPersonneId, setSelectedPersonneId] = useState('')
  const [activiteTitre, setActiviteTitre] = useState('')
  const [activiteDate, setActiviteDate] = useState('')
  const [activiteDescription, setActiviteDescription] = useState('')

  useSyncExternalStore(subscribeActivitesFamille, getActivitesFamilleVersion, getActivitesFamilleVersion)

  const user = useCurrentUser()
  const { isScoped } = useAccessScope()
  const canManageFamilles = useHasPermission(PERMISSIONS.FAMILLES_UPDATE)
  const canUpdateMembres = useHasPermission(PERMISSIONS.MEMBRES_UPDATE)

  const familleQuery = useFamille(familleId)
  const personnesQuery = usePersonnes({ page: 1, limit: 100 })
  const personnes = personnesQuery.data?.data ?? []
  const personneIds = useMemo(() => personnes.map((personne) => personne.idPersonne), [personnes])
  const affectationQueries = usePersonnesFamilles(personneIds, false)

  const assignMutation = useAssignPersonneFamille()
  const unassignMutation = useUnassignPersonneFamille()

  const allAffectations = useMemo(() => {
    const items: AffectationFamille[] = []
    affectationQueries.forEach((query) => {
      query.data?.forEach((affectation) => {
        if (affectation.idFamille === familleId) items.push(affectation)
      })
    })
    return items
  }, [affectationQueries, familleId])

  const actives = allAffectations.filter((affectation) => affectation.actif)
  const membres = actives
    .map((affectation) => {
      const personne = personnes.find((item) => item.idPersonne === affectation.idPersonne)
      return personne ? { personne, affectation } : null
    })
    .filter((item): item is { personne: Personne; affectation: AffectationFamille } => Boolean(item))
    .sort((left, right) => {
      const order = { Chef: 0, Adjoint: 1, Membre: 2 }
      return order[roleFamille(left.affectation.fonction)] - order[roleFamille(right.affectation.fonction)]
    })

  const leadsHere = actives.some(
    (affectation) =>
      affectation.idPersonne === user?.personne.idPersonne && isLeadershipRole(affectation.fonction),
  )
  const canAssign = canUpdateMembres || leadsHere || canManageFamilles
  const activites = familleId ? listActivitesFamille(familleId) : []
  const evolution = evolutionFamille(allAffectations)
  const evolutionActs = evolutionActivites(activites)
  const chef = membres.find((item) => roleFamille(item.affectation.fonction) === 'Chef')
  const hommes = membres.filter((item) => item.personne.sexe === 'M').length
  const femmes = membres.filter((item) => item.personne.sexe === 'F').length
  const activitesFaites = activites.filter((item) => item.statut === 'faite').length
  const activitesPlanifiees = activites.filter((item) => item.statut === 'planifiee').length

  const candidats = personnes.filter((personne) => {
    if (actives.some((affectation) => affectation.idPersonne === personne.idPersonne)) return false
    const needle = membreSearch.trim().toLowerCase()
    if (!needle) return true
    return personneName(personne).toLowerCase().includes(needle)
  })

  const applyRole = async (personneId: string, role: RoleFamille) => {
    if (!familleId) return
    const current = actives.find((affectation) => affectation.idPersonne === personneId)
    const previousChef =
      role === 'Chef'
        ? actives.find(
            (affectation) =>
              roleFamille(affectation.fonction) === 'Chef' && affectation.idPersonne !== personneId,
          )
        : undefined

    try {
      if (previousChef) {
        await unassignMutation.mutateAsync({
          personneId: previousChef.idPersonne,
          familleId,
        })
        await assignMutation.mutateAsync({
          personneId: previousChef.idPersonne,
          payload: { idFamille: familleId, fonction: 'Membre' },
        })
      }
      if (current) {
        await unassignMutation.mutateAsync({ personneId, familleId })
      } else {
        const other = affectationQueries
          .flatMap((query) => query.data ?? [])
          .find(
            (affectation) =>
              affectation.idPersonne === personneId &&
              affectation.idFamille !== familleId &&
              affectation.actif,
          )
        if (other) {
          await unassignMutation.mutateAsync({
            personneId,
            familleId: other.idFamille,
          })
        }
      }
      await assignMutation.mutateAsync({
        personneId,
        payload: { idFamille: familleId, fonction: role },
      })
      setAssignOpen(false)
      setSelectedPersonneId('')
      setMembreSearch('')
      setRoleDraft('Membre')
    } catch {
      /* mutation error already displayed */
    }
  }

  const onAssign = (event: FormEvent) => {
    event.preventDefault()
    if (!selectedPersonneId) return
    void applyRole(selectedPersonneId, roleDraft)
  }

  const onAddActivite = (event: FormEvent) => {
    event.preventDefault()
    if (!familleId || !activiteTitre.trim() || !activiteDate) return
    addActiviteFamille(familleId, {
      titre: activiteTitre,
      date: activiteDate,
      description: activiteDescription,
    })
    setActiviteTitre('')
    setActiviteDate('')
    setActiviteDescription('')
  }

  if (familleQuery.isLoading) {
    return (
      <div className="flex flex-col gap-6">
        {!isScoped && (
          <Link
            to="/familles"
            className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Toutes les familles d'impact
          </Link>
        )}
        <DepartementLoading label="Chargement de la famille…" />
      </div>
    )
  }

  if (familleQuery.isError || !familleQuery.data) {
    return (
      <div className="flex flex-col gap-4">
        <Alert variant="error" title="Famille introuvable">
          {familleQuery.error?.message ?? "Cette famille d'impact n'existe pas."}
        </Alert>
        {!isScoped && (
          <Link to="/familles" className="text-sm font-medium text-brand-600 hover:text-brand-700">
            Retour aux familles d'impact
          </Link>
        )}
      </div>
    )
  }

  const famille = familleQuery.data
  const busy = assignMutation.isPending || unassignMutation.isPending

  return (
    <div className="flex flex-col gap-6">
      <div>
        {!isScoped && (
          <Link
            to="/familles"
            className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Toutes les familles d'impact
          </Link>
        )}
        <div className="mt-3">
          <DepartementBanner
            prenom={user?.personne.prenom ?? ''}
            titre={famille.nom}
            message={
              chef
                ? `${famille.description || "Que cette famille serve l'Église avec fidélité."} · Chef : ${personneName(chef.personne)}`
                : famille.description || "Que cette famille serve l'Église avec fidélité."
            }
            action={
              canAssign ? (
                <Button
                  variant="glass"
                  onClick={() => {
                    assignMutation.reset()
                    setAssignOpen(true)
                  }}
                >
                  <UserPlus className="size-4" aria-hidden="true" />
                  Affecter un membre
                </Button>
              ) : undefined
            }
          />
        </div>
      </div>

      <div role="tablist" aria-label="Sections de la famille" className="flex flex-wrap gap-6 border-b border-slate-200">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={cn(
              '-mb-px border-b-2 pb-3 text-sm font-medium',
              tab === item.id
                ? 'border-gerbe-or text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800',
            )}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'tableau' && (
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Membres affectés"
              value={actives.length}
              hint="Affectations en cours"
              icon={Users}
              accent
            />
            <StatCard label="Hommes" value={hommes} hint="Membres actuellement affectés" icon={User} />
            <StatCard
              label="Femmes"
              value={femmes}
              hint="Membres actuellement affectées"
              icon={UserRound}
            />
            <StatCard
              label="Activités"
              value={activites.length}
              hint={`${activitesFaites} réalisées · ${activitesPlanifiees} planifiées`}
              icon={CalendarDays}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <ChartPanel title="Évolution de la famille" hint="Affectations et retraits sur les 12 derniers mois.">
              <EvolutionMembresChart data={evolution} />
            </ChartPanel>
            <ChartPanel title="Évolution des activités" hint="Activités planifiées et réalisées chaque mois.">
              <EvolutionActivitesChart data={evolutionActs} />
            </ChartPanel>
          </div>
        </div>
      )}

      {tab === 'membres' && (
        <div className="overflow-hidden border border-slate-200 bg-white">
          {membres.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-slate-500">Aucun membre affecté.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Membre</th>
                  <th className="px-4 py-3 font-medium">Rôle</th>
                  {canAssign && <th className="px-4 py-3 text-right font-medium">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {membres.map(({ personne, affectation }) => (
                  <tr key={personne.idPersonne} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <PersonneAvatar
                          personne={personne}
                          className="size-9 text-xs"
                          initialsClassName="bg-brand-50 text-brand-700"
                        />
                        {isScoped ? (
                          <span className="font-medium text-slate-900">{personneName(personne)}</span>
                        ) : (
                          <Link
                            to={`/personnes/${personne.idPersonne}`}
                            className="font-medium text-slate-900 hover:text-brand-700"
                          >
                            {personneName(personne)}
                          </Link>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {canAssign ? (
                        <Select
                          aria-label={`Rôle de ${personneName(personne)}`}
                          value={roleFamille(affectation.fonction)}
                          disabled={busy}
                          onChange={(event) =>
                            void applyRole(personne.idPersonne, event.target.value as RoleFamille)
                          }
                        >
                          {ROLES_FAMILLE.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </Select>
                      ) : (
                        roleFamille(affectation.fonction)
                      )}
                    </td>
                    {canAssign && (
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          disabled={busy}
                          onClick={() => {
                            if (!familleId) return
                            unassignMutation.mutate({
                              personneId: personne.idPersonne,
                              familleId,
                            })
                          }}
                        >
                          Retirer
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'activites' && (
        <div className="flex flex-col gap-4">
          {canAssign && (
            <form onSubmit={onAddActivite} className="border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-slate-900">Nouvelle activité</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Input
                  value={activiteTitre}
                  onChange={(event) => setActiviteTitre(event.target.value)}
                  placeholder="Réunion de famille"
                  aria-label="Titre de l'activité"
                />
                <Input
                  type="date"
                  value={activiteDate}
                  onChange={(event) => setActiviteDate(event.target.value)}
                  aria-label="Date de l'activité"
                />
                <Input
                  value={activiteDescription}
                  onChange={(event) => setActiviteDescription(event.target.value)}
                  placeholder="Description (optionnel)"
                  aria-label="Description de l'activité"
                  className="sm:col-span-2"
                />
              </div>
              <Button type="submit" className="mt-4">
                <Plus className="size-4" aria-hidden="true" />
                Ajouter l'activité
              </Button>
            </form>
          )}

          {activites.length === 0 ? (
            <p className="border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500">
              Aucune activité pour cette famille.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {activites.map((activite) => (
                <li
                  key={activite.id}
                  className="flex items-start justify-between gap-3 border border-slate-200 bg-white px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">{activite.titre}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(
                        new Date(activite.date),
                      )}
                      {activite.statut === 'faite' ? ' · Faite' : ' · Planifiée'}
                    </p>
                    {activite.description && (
                      <p className="mt-1 text-sm text-slate-600">{activite.description}</p>
                    )}
                  </div>
                  {canAssign && (
                    <div className="flex gap-1">
                      {activite.statut !== 'faite' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => marquerActiviteFamilleFaite(famille.idFamille, activite.id)}
                        >
                          Marquer faite
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        aria-label="Supprimer l'activité"
                        onClick={() => deleteActiviteFamille(famille.idFamille, activite.id)}
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {(assignMutation.isError || unassignMutation.isError) && (
        <Alert variant="error" title="Mise à jour impossible">
          {assignMutation.error?.message ?? unassignMutation.error?.message}
        </Alert>
      )}

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent
          title="Affecter un membre"
          description="Recherchez une personne existante, puis choisissez son rôle dans cette famille."
        >
          <form onSubmit={onAssign} className="flex flex-col gap-4">
            <Input
              value={membreSearch}
              onChange={(event) => setMembreSearch(event.target.value)}
              placeholder="Rechercher une personne…"
              aria-label="Rechercher une personne à affecter"
            />
            <Select
              aria-label="Personne à affecter"
              value={selectedPersonneId}
              onChange={(event) => setSelectedPersonneId(event.target.value)}
            >
              <option value="">Choisir une personne</option>
              {candidats.map((personne) => (
                <option key={personne.idPersonne} value={personne.idPersonne}>
                  {personneName(personne)}
                </option>
              ))}
            </Select>
            <Select
              aria-label="Rôle dans la famille"
              value={roleDraft}
              onChange={(event) => setRoleDraft(event.target.value as RoleFamille)}
            >
              {ROLES_FAMILLE.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </Select>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setAssignOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" isLoading={busy} disabled={!selectedPersonneId}>
                Affecter
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
