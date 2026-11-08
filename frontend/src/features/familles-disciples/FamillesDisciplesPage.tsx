import { useQuery } from '@tanstack/react-query'
import { useSyncExternalStore } from 'react'
import { ArrowLeft, Building2, UsersRound, UserRoundPlus } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Alert } from '@/components/ui/Alert'
import { ChargementCentre } from '@/components/ui/Chargement'
import { ApparitionScroll } from '@/components/ui/ApparitionScroll'
import { DepartementBanner } from '@/features/departements/banner'
import { useDepartements } from '@/features/departements/hooks'
import { useCurrentUser } from '@/stores/authStore'
import { getDateChecklistCulte, setDateChecklistCulte, subscribeDateChecklistCulte } from './checklistDate'
import { getChecklistPreparationCulte, getFamilleDisciple, listFamillesDisciples, type FamilleDisciple } from './api'
import { FamilleDiscipleOperations } from './FamilleDiscipleOperations'

const queryKeys = {
  all: ['familles-disciples'] as const,
  detail: (id: string) => ['familles-disciples', id] as const,
}

function dateLabel(value?: string | null) {
  if (!value) return 'Non définie'
  const parsed = new Date(`${value.slice(0, 10)}T00:00:00`)
  return Number.isNaN(parsed.getTime())
    ? value
    : new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(parsed)
}

function periodeLabel(famille: FamilleDisciple) {
  return `${dateLabel(famille.periodeDebut)} – ${dateLabel(famille.periodeFin)}`
}

function Badge({ children, good = false }: { children: string; good?: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${good ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}
    >
      {children}
    </span>
  )
}

export function FamillesDisciplesPage() {
  const user = useCurrentUser()
  const query = useQuery({ queryKey: queryKeys.all, queryFn: listFamillesDisciples })
  const families = query.data?.data ?? []
  const famille = families.find((item) => item.nom.trim().toLocaleLowerCase('fr-FR') === 'famille royal') ?? families[0]
  const familleQuery = useQuery({
    queryKey: queryKeys.detail(famille?.idFamilleDisciple ?? 'aucune-famille'),
    queryFn: () => getFamilleDisciple(famille!.idFamilleDisciple),
    enabled: Boolean(famille),
    staleTime: 30_000,
  })
  const familleTableau = familleQuery.data ?? famille
  const departementsQuery = useDepartements({ page: 1, limit: 100 }, Boolean(familleTableau))
  const dateCulte = useSyncExternalStore(
    subscribeDateChecklistCulte,
    getDateChecklistCulte,
    getDateChecklistCulte,
  )
  const checklistQuery = useQuery({
    queryKey: ['familles-disciples', familleTableau?.idFamilleDisciple, 'checklist', dateCulte],
    queryFn: () => getChecklistPreparationCulte(familleTableau!.idFamilleDisciple, dateCulte),
    enabled: Boolean(familleTableau),
    staleTime: 30_000,
  })
  const departementsActifs = (departementsQuery.data?.data ?? []).filter((item) => item.actif)
  const checklistParDepartement = new Map(
    (checklistQuery.data?.departements ?? []).map((item) => [item.idDepartement, item]),
  )
  const departementsPrets = departementsActifs.filter(
    (departement) => checklistParDepartement.get(departement.idDepartement)?.pret,
  ).length
  const nombreDepartementsChecklist = departementsActifs.length
  const progressionCulte = nombreDepartementsChecklist
    ? Math.round((departementsPrets / nombreDepartementsChecklist) * 100)
    : 0
  const membres = familleTableau?.compositions ?? []
  const membresActifs = membres.filter((membre) => membre.actif)
  const nouveauxVenus = membresActifs.filter((membre) => membre.nouveauVenu)

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <ApparitionScroll>
        <DepartementBanner
          prenom={user?.personne.prenom || 'à vous'}
          titre={familleTableau ? `Tableau de bord · ${familleTableau.nom}` : 'Tableau de bord de la famille'}
          compact
          message=""
          action={familleTableau && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-white/90">
              <span>
                <span className="text-white/65">Responsable :</span>{' '}
                <strong className="font-semibold">{familleTableau.responsableNom || 'À désigner'}</strong>
              </span>
            </div>
          )}
          progressions={familleTableau ? [{
            id: 'preparation-culte-famille',
            label: 'Préparation des cultes',
            valeur: progressionCulte,
            detail: checklistQuery.isLoading || departementsQuery.isLoading
              ? 'Chargement de la checklist…'
              : checklistQuery.isError || departementsQuery.isError
                ? 'Checklist momentanément indisponible.'
                : nombreDepartementsChecklist
                  ? `${departementsPrets} / ${nombreDepartementsChecklist} départements prêts pour le culte du ${dateLabel(dateCulte)}.`
                  : 'Aucun point à cocher pour le moment.',
          }] : undefined}
        />
      </ApparitionScroll>

      {query.isLoading && <ChargementCentre label="Chargement du tableau de bord de la famille…" page />}
      {query.isError && (
        <Alert variant="error" title="Impossible de charger les Familles des Disciples">
          {query.error.message}
        </Alert>
      )}
      {familleQuery.isError && !familleTableau && (
        <Alert variant="error" title="Impossible de charger cette famille">
          {familleQuery.error.message}
        </Alert>
      )}
      {query.isSuccess && !familleTableau && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-10 text-center">
          <UsersRound className="mx-auto size-8 text-slate-400" aria-hidden="true" />
          <h2 className="mt-3 font-semibold text-slate-900">Aucune famille disponible</h2>
          <p className="mt-1 text-sm text-slate-600">Le tableau de bord apparaîtra dès qu’une famille sera créée.</p>
        </div>
      )}

      {familleTableau && (
        <ApparitionScroll>
          <section aria-label={`Indicateurs de ${familleTableau.nom}`} className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <IndicateurCarte label="Membres actifs" valeur={membresActifs.length} detail="Suivis dans cette famille" icon={UsersRound} />
            <IndicateurCarte label="Nouveaux venus" valeur={nouveauxVenus.length} detail="Accueillis par cette famille" icon={UserRoundPlus} />
            <IndicateurCarte
              label="Départements représentés"
              valeur={`${familleTableau.nbDepartementsRepresentes ?? 0}${familleTableau.nbDepartementsActifsTotal === undefined ? '' : ` / ${familleTableau.nbDepartementsActifsTotal}`}`}
              detail="Couverture des départements actifs"
              icon={Building2}
            />
          </section>
        </ApparitionScroll>
      )}

      {familleTableau && (
        <ApparitionScroll>
          <FamilleDiscipleOperations famille={familleTableau} datePreparationCulte={dateCulte} onDatePreparationCulteChange={setDateChecklistCulte} />
        </ApparitionScroll>
      )}
    </main>
  )
}

function IndicateurCarte({
  label,
  valeur,
  detail,
  icon: Icon,
}: {
  label: string
  valeur: number | string
  detail: string
  icon: typeof UsersRound
}) {
  return (
    <section className="border border-slate-100 bg-white px-5 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-slate-500">{label}</p>
        <span className="flex size-8 shrink-0 items-center justify-center bg-amber-50 text-amber-400">
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{valeur}</p>
      <p className="mt-3 text-sm font-medium text-emerald-600">{detail}</p>
    </section>
  )
}

export function FamilleDiscipleDetailPage() {
  const { familleDiscipleId = '' } = useParams()
  const query = useQuery({
    queryKey: queryKeys.detail(familleDiscipleId),
    queryFn: () => getFamilleDisciple(familleDiscipleId),
    enabled: Boolean(familleDiscipleId),
  })
  const famille = query.data

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <Link
        to="/familles-disciples"
        className="inline-flex h-10 w-fit items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
      >
        <ArrowLeft className="size-4" />Retour aux familles
      </Link>
      {query.isLoading && <ChargementCentre label="Chargement de la famille…" page />}
      {query.isError && <Alert variant="error" title="Impossible de charger cette famille">{query.error.message}</Alert>}
      {famille && (
        <>
          {famille.modeSimulation && (
            <Alert variant="info" title="Mode simulation">
              Tu peux essayer l’accueil, le suivi des présences et la checklist. Les changements ne sont pas enregistrés dans la base.
            </Alert>
          )}
          <header className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-700">Famille des Disciples</p>
                <h1 className="mt-2 text-2xl font-bold text-slate-950">{famille.nom}</h1>
                <p className="mt-2 text-sm text-slate-600">Période : {periodeLabel(famille)}</p>
                <p className="mt-1 text-sm text-slate-600">Responsable : {famille.responsableNom || 'À désigner'}</p>
              </div>
              <div className="flex gap-2">
                <Badge good={famille.statut === 'actif'}>{famille.statut}</Badge>
                {famille.statutCompletude && <Badge good={famille.statutCompletude === 'COMPLET'}>{famille.statutCompletude}</Badge>}
              </div>
            </div>
            {famille.nbDepartementsActifsTotal !== undefined && (
              <p className="mt-5 text-sm font-medium text-slate-700">
                Départements représentés : {famille.nbDepartementsRepresentes ?? 0} / {famille.nbDepartementsActifsTotal}
              </p>
            )}
          </header>
          <FamilleDiscipleOperations famille={famille} />
        </>
      )}
    </main>
  )
}
