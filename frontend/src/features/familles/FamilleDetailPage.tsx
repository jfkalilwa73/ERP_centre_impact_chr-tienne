import { useMemo, useState, useSyncExternalStore, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, User, UserPlus, UserRound, Users } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogContent } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { ActivitesPanel } from '@/features/departements/ActivitesPanel'
import { DepartementBanner } from '@/features/departements/banner'
import { BudgetCards } from '@/features/departements/BudgetCards'
import { BudgetPanel } from '@/features/departements/BudgetPanel'
import {
  ChartPanel,
  EvolutionActivitesChart,
  EvolutionMembresChart,
  PresenceMembresChart,
} from '@/features/departements/charts'
import { EquipePanel } from '@/features/departements/EquipePanel'
import { DepartementLoading } from '@/features/departements/loading'
import { personneName } from '@/features/departements/personneName'
import { tauxPresenceMembres } from '@/features/departements/presence'
import { FeuillePresence } from '@/features/sprint1/FeuillePresence'
import { useFeuillePresence } from '@/features/sprint1/hooks'
import { tauxDepuisPresences } from '@/features/sprint1/presence'
import { RapportsPanel } from '@/features/departements/RapportsPanel'
import { StatCard } from '@/features/departements/StatCard'
import { useAccessScope } from '@/features/auth/accessScope'
import { useUnitPageAccess } from '@/features/auth/unitPageAccess'
import { cn } from '@/lib/cn'
import { PERMISSIONS } from '@/lib/permissions'
import { useCurrentUser, useHasPermission } from '@/stores/authStore'
import type { AffectationFamille, Personne } from '@/types'
import { ForbiddenPage } from '@/pages/ForbiddenPage'
import { usePersonnes, usePersonnesFamilles } from '@/features/personnes/hooks'
import {
  activitesFamilleApi,
  getActivitesFamilleVersion,
  listActivitesFamille,
  subscribeActivitesFamille,
} from './activites'
import { evolutionActivites, evolutionFamille } from './evolution'
import { useAssignPersonneFamille, useFamille, useFamilles, useUnassignPersonneFamille } from './hooks'
import { isLeadershipRole, roleFamille, ROLES_EQUIPE_FAMILLE, type RoleFamille } from './roles'

const TABS = [
  { id: 'tableau', label: 'Synthèse' },
  { id: 'membres', label: 'Membres' },
  { id: 'activites', label: 'Activités' },
  { id: 'budget', label: 'Budget', permission: PERMISSIONS.BUDGET_READ },
  { id: 'rapports', label: 'Rapports', permission: PERMISSIONS.RAPPORTS_READ },
] as const

type TabId = (typeof TABS)[number]['id']

export function FamilleDetailPage() {
  const { familleId } = useParams<{ familleId: string }>()
  const [tab, setTab] = useState<TabId>('tableau')
  const [assignOpen, setAssignOpen] = useState(false)
  const [membreSearch, setMembreSearch] = useState('')
  const [roleDraft, setRoleDraft] = useState<RoleFamille>('Responsable')
  const [selectedPersonneId, setSelectedPersonneId] = useState('')

  useSyncExternalStore(subscribeActivitesFamille, getActivitesFamilleVersion, getActivitesFamilleVersion)

  const user = useCurrentUser()
  const permissions = user?.permissions ?? []
  const { isScoped, ledFamilleIds } = useAccessScope()
  const pageAccess = useUnitPageAccess('famille', familleId, user?.personne.idPersonne)
  const canManageFamilles = useHasPermission(PERMISSIONS.FAMILLES_UPDATE)

  const familleQuery = useFamille(familleId)
  const feuilleQuery = useFeuillePresence(familleId)
  const destinatairesQuery = useFamilles(
    { page: 1, limit: 100 },
    permissions.includes(PERMISSIONS.RAPPORTS_READ) ||
      permissions.includes(PERMISSIONS.FAMILLES_READ) ||
      permissions.includes(PERMISSIONS.BUDGET_REQUEST) ||
      permissions.includes(PERMISSIONS.ACTIVITES_CREATE),
  )
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
      const order = { Superviseur: 0, Chef: 1, Adjoint: 2, Responsable: 3, Membre: 4 }
      return order[roleFamille(left.affectation.fonction)] - order[roleFamille(right.affectation.fonction)]
    })

  const leadsHere = actives.some(
    (affectation) =>
      affectation.idPersonne === user?.personne.idPersonne && isLeadershipRole(affectation.fonction),
  )
  const auteur = user
    ? { idPersonne: user.personne.idPersonne, nom: `${user.personne.prenom} ${user.personne.nom}` }
    : undefined
  const destList = destinatairesQuery.data?.data.filter((item) => item.actif) ?? []
  const destinataires = destList.length
    ? destList.map((item) => ({ idDepartement: item.idFamille, nom: item.nom }))
    : familleId && familleQuery.data
      ? [{ idDepartement: familleId, nom: familleQuery.data.nom }]
      : []
  const canAssign = leadsHere || (canManageFamilles && !isScoped)
  const canManageEquipe = useHasPermission(PERMISSIONS.EQUIPES_MANAGE) || leadsHere
  const canWriteActivites =
    useHasPermission(PERMISSIONS.ACTIVITES_CREATE) ||
    useHasPermission(PERMISSIONS.ACTIVITES_UPDATE) ||
    leadsHere
  const canRequestBudget = useHasPermission(PERMISSIONS.BUDGET_REQUEST)
  const canWriteRapports =
    useHasPermission(PERMISSIONS.RAPPORTS_CREATE) ||
    useHasPermission(PERMISSIONS.OBJECTIFS_MANAGE) ||
    leadsHere
  const visibleTabs = TABS.filter((item) =>
    pageAccess.canView(item.id, !('permission' in item) || permissions.includes(item.permission)),
  )
  const activeTab = visibleTabs.some((item) => item.id === tab) ? tab : visibleTabs[0]?.id
  const activites = familleId ? listActivitesFamille(familleId) : []
  const evolution = evolutionFamille(allAffectations)
  const evolutionActs = evolutionActivites(activites)
  const tauxApi = tauxDepuisPresences(feuilleQuery.data?.presences ?? [])
  const tauxPresence = tauxApi.length > 0 ? tauxApi : tauxPresenceMembres(activites)
  const chef = membres.find((item) => roleFamille(item.affectation.fonction) === 'Chef')
  const superviseur = membres.find((item) => roleFamille(item.affectation.fonction) === 'Superviseur')
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

    try {
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
      setRoleDraft('Responsable')
    } catch {
      /* mutation error already displayed */
    }
  }

  const onAssign = (event: FormEvent) => {
    event.preventDefault()
    if (!selectedPersonneId) return
    void applyRole(selectedPersonneId, roleDraft)
  }

  if (!activeTab) return <ForbiddenPage />

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
            message={[
              famille.description || "Que cette famille serve l'Église avec fidélité.",
              [famille.jourReunion, famille.heureReunion, famille.lieuReunion].filter(Boolean).join(' · '),
              famille.capaciteMax ? `Capacité ${famille.capaciteMax}` : '',
              superviseur ? `Superviseur : ${personneName(superviseur.personne)}` : '',
              chef ? `Chef : ${personneName(chef.personne)}` : '',
            ]
              .filter(Boolean)
              .join(' · ')}
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
        {visibleTabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={activeTab === item.id}
            className={cn(
              '-mb-px border-b-2 pb-3 text-sm font-medium',
              activeTab === item.id
                ? 'border-gerbe-or text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800',
            )}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {activeTab === 'tableau' && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
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

          {familleId && permissions.includes(PERMISSIONS.BUDGET_READ) && (
            <BudgetCards departementId={familleId} hintEnveloppe="Enveloppe de la famille" />
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <ChartPanel title="Évolution de la famille" hint="Affectations et retraits sur les 12 derniers mois.">
              <EvolutionMembresChart data={evolution} />
            </ChartPanel>
            <ChartPanel title="Évolution des activités" hint="Activités planifiées et réalisées chaque mois.">
              <EvolutionActivitesChart data={evolutionActs} />
            </ChartPanel>
            <div className="md:col-span-2">
              <ChartPanel
                title="Taux de présence des membres"
                hint={
                  tauxApi.length > 0
                    ? 'Selon les feuilles de présence des réunions.'
                    : 'Selon les comptes rendus des activités réalisées.'
                }
                bodyClassName="h-auto min-h-52"
              >
                <PresenceMembresChart data={tauxPresence} />
              </ChartPanel>
            </div>
          </div>

          {familleId && <FeuillePresence familleId={familleId} canWrite={canAssign || canWriteActivites} />}
        </div>
      )}

      {activeTab === 'membres' && familleId && (
        <EquipePanel
          departementId={familleId}
          membres={membres}
          canAssign={canAssign}
          canManage={canManageEquipe}
          isScoped={isScoped}
          busy={busy}
          unassigningId={
            unassignMutation.isPending ? unassignMutation.variables?.personneId : undefined
          }
          onApplyRole={(personneId, role) => void applyRole(personneId, role as RoleFamille)}
          onUnassign={(personneId) =>
            unassignMutation.mutate({
              personneId,
              familleId: famille.idFamille,
            })
          }
        />
      )}

      {activeTab === 'activites' && familleId && (
        <ActivitesPanel
          departementId={familleId}
          nomDepartement={famille.nom}
          activites={activites}
          membres={membres.map((item) => item.personne)}
          canWrite={canWriteActivites}
          auteur={auteur}
          store={activitesFamilleApi}
          unite="famille"
        />
      )}

      {activeTab === 'budget' && familleId && (
        <BudgetPanel
          departementId={familleId}
          nomDepartement={famille.nom}
          canRequest={canRequestBudget}
          auteur={auteur}
          unite="famille"
        />
      )}

      {activeTab === 'rapports' && familleId && (
        <RapportsPanel
          departementId={familleId}
          nomDepartement={famille.nom}
          destinataires={destinataires}
          canWrite={canWriteRapports}
          canConsolidate={permissions.includes(PERMISSIONS.RAPPORTS_CONSOLIDATE)}
          consolidationIds={ledFamilleIds.length ? ledFamilleIds : [familleId]}
          auteur={auteur}
        />
      )}

      {(assignMutation.isError || unassignMutation.isError) && (
        <Alert variant="error" title="Mise à jour impossible">
          {assignMutation.error?.message ?? unassignMutation.error?.message}
        </Alert>
      )}

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent
          title="Affecter un membre"
          description="Recherchez une personne existante, puis choisissez adjoint ou responsable."
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
              {ROLES_EQUIPE_FAMILLE.map((role) => (
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
