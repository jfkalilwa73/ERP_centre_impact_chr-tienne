import { useMemo, type ReactNode } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Coins, Crown, HandCoins, Heart, Layers, Users } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { ChargementCentre } from '@/components/ui/Chargement'
import { useAccessScope } from '@/features/auth/accessScope'
import { canSeePilotageDge } from '@/features/auth/orgRoles'
import {
  effectifUnite,
  entreesUniteCeMois,
  indicationMois,
  inscriptionsCeMois,
  nombreResponsables,
  responsablesCeMois,
} from '@/features/accueil/indicateurs'
import { AccueilTableaux, useContributionsAccueil, useProgressionCultes } from '@/features/accueil/AccueilTableaux'
import { DepartementBanner } from '@/features/departements/banner'
import { formatMontant } from '@/features/departements/budget'
import { useDepartements } from '@/features/departements/hooks'
import { PilotageConsolide } from '@/features/departements/PilotageConsolide'
import { useFamilles } from '@/features/familles/hooks'
import { usePersonnes, usePersonnesAffectations, usePersonnesFamilles } from '@/features/personnes/hooks'
import { cn } from '@/lib/cn'
import { PERMISSIONS } from '@/lib/permissions'
import { useCurrentUser, useHasPermission, useSessionProfil } from '@/stores/authStore'
import type { Personne } from '@/types'

const AUCUNE_PERSONNE: Personne[] = []

export function DashboardPage() {
  const user = useCurrentUser()
  const profil = useSessionProfil()
  const scope = useAccessScope()
  const permissions = user?.permissions?.length ? user.permissions : (profil?.permissions ?? [])
  const voitPilotage = canSeePilotageDge(user, permissions)
  const canDepartements = useHasPermission(PERMISSIONS.DEPARTEMENTS_READ)
  const canFamilles = useHasPermission(PERMISSIONS.FAMILLES_READ)
  const canMembres = useHasPermission(PERMISSIONS.MEMBRES_READ)
  const contributions = useContributionsAccueil()
  const departementsQuery = useDepartements(
    { page: 1, limit: 100 },
    voitPilotage && canDepartements,
  )
  const famillesQuery = useFamilles({ page: 1, limit: 100 }, voitPilotage && canFamilles)
  const personnesQuery = usePersonnes({ page: 1, limit: 100 }, voitPilotage && canMembres)
  const personnes = personnesQuery.data?.data ?? AUCUNE_PERSONNE
  const personneIds = useMemo(() => personnes.map((personne) => personne.idPersonne), [personnes])
  const affectationsDepartementQueries = usePersonnesAffectations(personneIds, false)
  const affectationsFamilleQueries = usePersonnesFamilles(personneIds, false)
  const departements = departementsQuery.data?.data ?? []
  const familles = famillesQuery.data?.data ?? []
  const departementsActifs = departements.filter((item) => item.actif)
  const famillesActives = familles.filter((item) => item.actif)
  const cultes = useProgressionCultes(
    departementsActifs.map((item) => ({ id: item.idDepartement, nom: item.nom })),
  )
  const pointsCultes = cultes.lignes.flatMap((ligne) =>
    ligne.points.map((point) => ({
      id: point.id,
      titre: point.titre,
      fait: point.fait,
      contexte: ligne.nom,
      vers: `/departements/${ligne.id}?onglet=activites`,
    })),
  )
  const premierePreparation = pointsCultes.find((point) => !point.fait)

  if (!user && !profil) {
    return <ChargementCentre label="Chargement de votre session…" page />
  }
  if (scope.isScoped) {
    if (scope.isLoading) {
      return <ChargementCentre label="Chargement de votre espace…" page />
    }
    if (scope.homePath !== '/') {
      return <Navigate to={scope.homePath} replace />
    }
  }

  const sansRole = (user?.roles.length ?? 0) === 0
  const sansDroit = permissions.length === 0
  const affectationsDepartement = affectationsDepartementQueries.flatMap((query) => query.data ?? [])
  const affectationsFamille = affectationsFamilleQueries.flatMap((query) => query.data ?? [])
  const membresEglise = personnes.filter(
    (personne) => personne.statut !== 'inactif' && personne.statut !== 'archive',
  ).length
  const responsables = nombreResponsables([...affectationsDepartement, ...affectationsFamille])
  const nouvellesPersonnes = inscriptionsCeMois(personnes)
  const nouveauxResponsables = responsablesCeMois([...affectationsDepartement, ...affectationsFamille])
  const partResponsables =
    membresEglise === 0 ? 0 : Math.round((responsables / membresEglise) * 100)
  const unites = [
    ...departementsActifs.map((item) => ({ id: item.idDepartement, nom: item.nom })),
    ...famillesActives.map((item) => ({ id: item.idFamille, nom: item.nom })),
  ]
  const pilotageEnChargement =
    voitPilotage && (departementsQuery.isLoading || famillesQuery.isLoading)

  return (
    <div className="flex flex-col gap-6">
      <DepartementBanner
        prenom={
          [user?.personne.prenom, user?.personne.nom].filter(Boolean).join(' ') ||
          profil?.name ||
          ''
        }
        message="Le tableau de bord de l'église."
        compact
        progressions={[
          {
            id: 'cultes',
            label: 'Préparation des cultes',
            valeur: cultes.valeur,
            detail:
              cultes.total === 0
                ? 'Aucun point à cocher pour le moment.'
                : cultes.faits === cultes.total
                  ? 'Toutes les préparations sont cochées.'
                  : undefined,
            points: pointsCultes,
            action: premierePreparation
              ? { label: 'Compléter la préparation', to: premierePreparation.vers }
              : undefined,
          },
        ]}
      />

      {sansDroit && (
        <Alert variant="warning" title="Vous n'avez aucun accès à l'application">
          {sansRole ? (
            <p>
              Aucun rôle n'est rattaché à votre compte. Sans rôle, vous ne pouvez rien consulter
              ni modifier. Contactez un administrateur pour qu'il vous attribue un rôle.
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

      {voitPilotage && pilotageEnChargement && (
        <ChargementCentre label="Chargement du tableau de bord…" />
      )}

      {voitPilotage && !pilotageEnChargement && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <IndicateurCarte
            label="Offrandes"
            valeur={formatMontant(contributions.offrandes)}
            indication={`+${formatMontant(contributions.offrandesMois)} ce mois`}
            icon={HandCoins}
            accent
          />
          <IndicateurCarte
            label="Dîmes"
            valeur={formatMontant(contributions.dimes)}
            indication={`${
              contributions.total === 0 ? 0 : Math.round((contributions.dimes / contributions.total) * 100)
            }% des rentrées`}
            icon={Coins}
          />
          {canMembres && (
            <IndicateurCarte
              label="Membres de l'église"
              valeur={String(membresEglise)}
              indication={indicationMois(nouvellesPersonnes)}
              icon={Users}
            />
          )}
          {canMembres && (
            <IndicateurCarte
              label="Responsables"
              valeur={String(responsables)}
              indication={
                membresEglise === 0
                  ? indicationMois(nouveauxResponsables)
                  : `${partResponsables}% des membres`
              }
              icon={Crown}
            />
          )}
        </div>
      )}

      {voitPilotage && !pilotageEnChargement && canDepartements && departements.length > 0 && (
        <UniteSection titre="Départements">
          {departements.map((departement) => (
            <UniteCarte
              key={departement.idDepartement}
              to={`/departements/${departement.idDepartement}`}
              nom={departement.nom}
              personnes={effectifUnite(
                affectationsDepartement.map((item) => ({
                  idUnite: item.idDepartement,
                  idPersonne: item.idPersonne,
                  actif: item.actif,
                })),
                departement.idDepartement,
              )}
              inactif={!departement.actif}
              indication={indicationMois(
                entreesUniteCeMois(
                  affectationsDepartement.map((item) => ({
                    idUnite: item.idDepartement,
                    idPersonne: item.idPersonne,
                    dateDebut: item.dateDebut,
                  })),
                  departement.idDepartement,
                ),
              )}
              icon={Layers}
            />
          ))}
        </UniteSection>
      )}

      {voitPilotage && !pilotageEnChargement && canFamilles && familles.length > 0 && (
        <UniteSection titre="Familles d'impact">
          {familles.map((famille) => (
            <UniteCarte
              key={famille.idFamille}
              to={`/familles/${famille.idFamille}`}
              nom={famille.nom}
              personnes={effectifUnite(
                affectationsFamille.map((item) => ({
                  idUnite: item.idFamille,
                  idPersonne: item.idPersonne,
                  actif: item.actif,
                })),
                famille.idFamille,
              )}
              inactif={!famille.actif}
              indication={indicationMois(
                entreesUniteCeMois(
                  affectationsFamille.map((item) => ({
                    idUnite: item.idFamille,
                    idPersonne: item.idPersonne,
                    dateDebut: item.dateDebut,
                  })),
                  famille.idFamille,
                ),
              )}
              icon={Heart}
            />
          ))}
        </UniteSection>
      )}

      {voitPilotage && !pilotageEnChargement && (
        <AccueilTableaux
          departements={departementsActifs.map((item) => ({ id: item.idDepartement, nom: item.nom }))}
          familles={famillesActives.map((item) => ({
            id: item.idFamille,
            nom: item.nom,
            zone: item.zone,
            latitude: item.latitude,
            longitude: item.longitude,
            personnes: effectifUnite(
              affectationsFamille.map((affectation) => ({
                idUnite: affectation.idFamille,
                idPersonne: affectation.idPersonne,
                actif: affectation.actif,
              })),
              item.idFamille,
            ),
          }))}
          personnes={personnes.map((personne) => ({
            sexe: personne.sexe,
            dateNaissance: personne.dateNaissance,
            dateCreation: personne.dateCreation,
            statut: personne.statut,
          }))}
        />
      )}

      {voitPilotage && !pilotageEnChargement && unites.length > 0 && (
        <PilotageConsolide unites={unites} entete={false} />
      )}
    </div>
  )
}

function IndicateurCarte({
  label,
  valeur,
  indication,
  icon: Icon,
  accent = false,
}: {
  label: string
  valeur: string
  indication: string
  icon: typeof Layers
  accent?: boolean
}) {
  return (
    <section
      className={cn(
        'px-5 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]',
        accent ? 'bg-brand-500 text-white' : 'border border-slate-100 bg-white',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className={cn('text-sm', accent ? 'text-white/80' : 'text-slate-500')}>{label}</p>
        <span
          className={cn(
            'flex size-8 shrink-0 items-center justify-center',
            accent ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-400',
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </div>
      <p className={cn('mt-3 text-3xl font-semibold tracking-tight', accent ? 'text-white' : 'text-slate-900')}>
        {valeur}
      </p>
      <p className={cn('mt-3 text-sm font-medium', accent ? 'text-emerald-200' : 'text-emerald-600')}>
        {indication}
      </p>
    </section>
  )
}

function UniteSection({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-slate-900">{titre}</h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{children}</div>
    </section>
  )
}

function UniteCarte({
  to,
  nom,
  personnes,
  inactif,
  indication,
  icon: Icon,
}: {
  to: string
  nom: string
  personnes: number
  inactif: boolean
  indication: string
  icon: typeof Layers
}) {
  return (
    <Link
      to={to}
      className="border border-slate-100 bg-white px-5 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition-colors hover:border-brand-200"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-slate-500">{nom}</p>
        <span className="flex size-8 shrink-0 items-center justify-center bg-amber-50 text-amber-400">
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{personnes}</p>
      <p className="mt-3 text-sm font-medium text-emerald-600">
        {inactif ? `Inactif · ${indication}` : indication}
      </p>
    </Link>
  )
}
