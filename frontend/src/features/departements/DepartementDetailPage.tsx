import { useMemo, useState, useSyncExternalStore, type FormEvent } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, User, UserPlus, UserRound, Users } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogContent } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useAccessScope } from '@/features/auth/accessScope'
import { useUnitPageAccess } from '@/features/auth/unitPageAccess'
import { usePersonnes, usePersonnesAffectations } from '@/features/personnes/hooks'
import { cn } from '@/lib/cn'
import { PERMISSIONS } from '@/lib/permissions'
import { useCurrentUser, useHasPermission } from '@/stores/authStore'
import type { AffectationDepartement, Personne } from '@/types'
import { ActivitesPanel } from './ActivitesPanel'
import { getActivitesVersion, listActivites, subscribeActivites } from './activites'
import { DepartementBanner } from './banner'
import { BudgetCards } from './BudgetCards'
import { BudgetPanel } from './BudgetPanel'
import { ChartPanel, EvolutionActivitesChart, EvolutionMembresChart, PresenceMembresChart } from './charts'
import { EquipePanel } from './EquipePanel'
import { evolutionActivites, evolutionDepartement } from './evolution'
import { tauxPresenceMembres } from './presence'
import {
  useAssignPersonneDepartement,
  useDepartement,
  useDepartements,
  useUnassignPersonneDepartement,
} from './hooks'
import { DepartementLoading } from './loading'
import { personneName } from './personneName'
import { RapportsPanel } from './RapportsPanel'
import { isLeadershipRole, roleDepartement, ROLES_EQUIPE, type RoleDepartement } from './roles'
import { StatCard } from './StatCard'
import { ForbiddenPage } from '@/pages/ForbiddenPage'

const TABS = [
  { id: 'tableau', label: 'Synthèse' },
  { id: 'membres', label: 'Membres' },
  { id: 'activites', label: 'Activités' },
  { id: 'budget', label: 'Budget', permission: PERMISSIONS.BUDGET_READ },
  { id: 'rapports', label: 'Rapports', permission: PERMISSIONS.RAPPORTS_READ },
] as const

type TabId = (typeof TABS)[number]['id']

function ongletInitial(valeur: string | null): TabId {
  if (valeur === 'membres' || valeur === 'activites' || valeur === 'budget' || valeur === 'rapports') {
    return valeur
  }
  return 'tableau'
}

export function DepartementDetailPage() {
  const { departementId } = useParams<{ departementId: string }>()
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState<TabId>(() => ongletInitial(searchParams.get('onglet')))
  const [assignOpen, setAssignOpen] = useState(false)
  const [membreSearch, setMembreSearch] = useState('')
  const [roleDraft, setRoleDraft] = useState<RoleDepartement>('Responsable')
  const [selectedPersonneId, setSelectedPersonneId] = useState('')

  useSyncExternalStore(subscribeActivites, getActivitesVersion, getActivitesVersion)

  const user = useCurrentUser()
  const permissions = user?.permissions ?? []
  const { isScoped, ledDepartementIds } = useAccessScope()
  const pageAccess = useUnitPageAccess('departement', departementId, user?.personne.idPersonne)
  const canManageDepartements = useHasPermission(PERMISSIONS.DEPARTEMENTS_UPDATE)

  const departementQuery = useDepartement(departementId)
  const destinatairesQuery = useDepartements(
    { page: 1, limit: 100 },
    permissions.includes(PERMISSIONS.RAPPORTS_READ) ||
      permissions.includes(PERMISSIONS.DEPARTEMENTS_READ) ||
      permissions.includes(PERMISSIONS.BUDGET_REQUEST) ||
      permissions.includes(PERMISSIONS.ACTIVITES_CREATE),
  )
  const personnesQuery = usePersonnes({ page: 1, limit: 100 })
  const personnes = personnesQuery.data?.data ?? []
  const personneIds = useMemo(() => personnes.map((personne) => personne.idPersonne), [personnes])
  const affectationQueries = usePersonnesAffectations(personneIds, false)

  const assignMutation = useAssignPersonneDepartement()
  const unassignMutation = useUnassignPersonneDepartement()

  const allAffectations = useMemo(() => {
    const items: AffectationDepartement[] = []
    affectationQueries.forEach((query) => {
      query.data?.forEach((affectation) => {
        if (affectation.idDepartement === departementId) items.push(affectation)
      })
    })
    return items
  }, [affectationQueries, departementId])

  const actives = allAffectations.filter((affectation) => affectation.actif)
  const membres = actives
    .map((affectation) => {
      const personne = personnes.find((item) => item.idPersonne === affectation.idPersonne)
      return personne ? { personne, affectation } : null
    })
    .filter((item): item is { personne: Personne; affectation: AffectationDepartement } => Boolean(item))
    .sort((left, right) => {
      const order = { Superviseur: 0, Chef: 1, Adjoint: 2, Responsable: 3, Membre: 4 }
      return order[roleDepartement(left.affectation.fonction)] - order[roleDepartement(right.affectation.fonction)]
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
    ? destList.map((item) => ({ idDepartement: item.idDepartement, nom: item.nom }))
    : departementId && departementQuery.data
      ? [{ idDepartement: departementId, nom: departementQuery.data.nom }]
      : []
  const canAssign = leadsHere || (canManageDepartements && !isScoped)
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
  const activites = departementId ? listActivites(departementId) : []
  const evolution = evolutionDepartement(allAffectations)
  const evolutionActs = evolutionActivites(activites)
  const tauxPresence = tauxPresenceMembres(activites)
  const chef = membres.find((item) => roleDepartement(item.affectation.fonction) === 'Chef')
  const superviseur = membres.find((item) => roleDepartement(item.affectation.fonction) === 'Superviseur')
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

  const applyRole = async (personneId: string, role: RoleDepartement) => {
    if (!departementId) return
    const current = actives.find((affectation) => affectation.idPersonne === personneId)

    try {
      if (current) {
        await unassignMutation.mutateAsync({ personneId, departementId })
      }
      await assignMutation.mutateAsync({
        personneId,
        payload: { idDepartement: departementId, fonction: role },
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

  if (departementQuery.isLoading) {
    return (
      <div className="flex flex-col gap-6">
        {!isScoped && (
          <Link
            to="/departements"
            className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Tous les départements
          </Link>
        )}
        <DepartementLoading label="Chargement du département…" />
      </div>
    )
  }

  if (departementQuery.isError || !departementQuery.data) {
    return (
      <div className="flex flex-col gap-4">
        <Alert variant="error" title="Département introuvable">
          {departementQuery.error?.message ?? "Ce département n'existe pas."}
        </Alert>
        {!isScoped && (
          <Link to="/departements" className="text-sm font-medium text-brand-600 hover:text-brand-700">
            Retour aux départements
          </Link>
        )}
      </div>
    )
  }

  const departement = departementQuery.data
  const busy = assignMutation.isPending || unassignMutation.isPending

  return (
    <div className="flex flex-col gap-6">
      <div>
        {!isScoped && (
          <Link
            to="/departements"
            className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Tous les départements
          </Link>
        )}
        <div className="mt-3">
          <DepartementBanner
            prenom={user?.personne.prenom ?? ''}
            titre={departement.nom}
            message={[
              departement.mission || "Que ce ministère serve l'Église avec fidélité.",
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

      <div role="tablist" aria-label="Sections du département" className="flex flex-wrap gap-6 border-b border-slate-200">
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
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Membres affectés"
              value={actives.length}
              hint="Affectations en cours"
              icon={Users}
              accent
            />
            <StatCard
              label="Hommes"
              value={hommes}
              hint="Membres actuellement affectés"
              icon={User}
            />
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

          {departementId && permissions.includes(PERMISSIONS.BUDGET_READ) && (
            <BudgetCards departementId={departementId} />
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <ChartPanel title="Évolution du département" hint="Affectations et retraits sur les 12 derniers mois.">
              <EvolutionMembresChart data={evolution} />
            </ChartPanel>
            <ChartPanel title="Évolution des activités" hint="Activités planifiées et réalisées chaque mois.">
              <EvolutionActivitesChart data={evolutionActs} />
            </ChartPanel>
            <div className="md:col-span-2">
              <ChartPanel
                title="Taux de présence des membres"
                hint="Selon les comptes rendus des activités réalisées."
                bodyClassName="h-auto min-h-52"
              >
                <PresenceMembresChart data={tauxPresence} />
              </ChartPanel>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'membres' && departementId && (
        <EquipePanel
          departementId={departementId}
          membres={membres}
          canAssign={canAssign}
          canManage={canManageEquipe}
          isScoped={isScoped}
          busy={busy}
          unassigningId={
            unassignMutation.isPending ? unassignMutation.variables?.personneId : undefined
          }
          onApplyRole={(personneId, role) => void applyRole(personneId, role)}
          onUnassign={(personneId) =>
            unassignMutation.mutate({
              personneId,
              departementId: departement.idDepartement,
            })
          }
        />
      )}

      {activeTab === 'activites' && departementId && (
        <ActivitesPanel
          departementId={departementId}
          nomDepartement={departement.nom}
          activites={activites}
          membres={membres.map((item) => item.personne)}
          canWrite={canWriteActivites}
          auteur={auteur}
        />
      )}

      {activeTab === 'budget' && departementId && (
        <BudgetPanel
          departementId={departementId}
          nomDepartement={departement.nom}
          canRequest={canRequestBudget}
          auteur={auteur}
        />
      )}

      {activeTab === 'rapports' && departementId && (
        <RapportsPanel
          departementId={departementId}
          nomDepartement={departement.nom}
          destinataires={destinataires}
          canWrite={canWriteRapports}
          canConsolidate={permissions.includes(PERMISSIONS.RAPPORTS_CONSOLIDATE)}
          consolidationIds={ledDepartementIds.length ? ledDepartementIds : [departementId]}
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
              aria-label="Rôle dans le département"
              value={roleDraft}
              onChange={(event) => setRoleDraft(event.target.value as RoleDepartement)}
            >
              {ROLES_EQUIPE.map((role) => (
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
