import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, CalendarDays, UsersRound } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Alert } from '@/components/ui/Alert'
import { ChargementCentre } from '@/components/ui/Chargement'
import { getFamilleDisciple, listFamillesDisciples, type FamilleDisciple } from './api'

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

function FamilleCard({ famille }: { famille: FamilleDisciple }) {
  const represente = famille.nbDepartementsRepresentes
  const total = famille.nbDepartementsActifsTotal
  return (
    <Link
      to={`/familles-disciples/${famille.idFamilleDisciple}`}
      className="group flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-950 group-hover:text-brand-800">{famille.nom}</h2>
          <p className="mt-1 text-sm text-slate-500">Responsable : {famille.responsableNom || 'À désigner'}</p>
        </div>
        <Badge good={famille.statut === 'actif'}>{famille.statut}</Badge>
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
        <span className="inline-flex items-center gap-2"><CalendarDays className="size-4" />{periodeLabel(famille)}</span>
        <span className="inline-flex items-center gap-2"><UsersRound className="size-4" />
          {represente ?? '—'}{total === undefined ? '' : ` / ${total}`} départements
        </span>
      </div>
      {famille.statutCompletude && (
        <div><Badge good={famille.statutCompletude === 'COMPLET'}>{famille.statutCompletude}</Badge></div>
      )}
    </Link>
  )
}

export function FamillesDisciplesPage() {
  const query = useQuery({ queryKey: queryKeys.all, queryFn: listFamillesDisciples })
  const families = query.data?.data ?? []

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-700">Organisation spirituelle</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Familles des Disciples</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">Groupes transversaux et représentation des départements actifs.</p>
      </header>

      {query.isLoading && <ChargementCentre label="Chargement des Familles des Disciples…" page />}
      {query.isError && (
        <Alert variant="error" title="Impossible de charger les Familles des Disciples">
          {query.error.message}
        </Alert>
      )}
      {query.isSuccess && families.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-10 text-center">
          <UsersRound className="mx-auto size-8 text-slate-400" aria-hidden="true" />
          <h2 className="mt-3 font-semibold text-slate-900">Aucune famille pour le moment</h2>
          <p className="mt-1 text-sm text-slate-600">Les groupes apparaîtront ici dès qu’ils seront créés.</p>
        </div>
      )}
      {families.length > 0 && (
        <section aria-label="Liste des Familles des Disciples" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {families.map((famille) => <FamilleCard key={famille.idFamilleDisciple} famille={famille} />)}
        </section>
      )}
    </main>
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
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white/80 shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="font-semibold text-slate-950">Composition du groupe</h2>
              <p className="mt-1 text-sm text-slate-600">Membres et départements d’origine.</p>
            </div>
            {!famille.compositions?.length ? (
              <p className="p-6 text-sm text-slate-600">Aucun membre n’est encore affecté à cette famille.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr><th className="px-5 py-3 font-semibold">Membre</th><th className="px-5 py-3 font-semibold">Département d’origine</th><th className="px-5 py-3 font-semibold">Statut</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {famille.compositions.map((composition) => (
                      <tr key={composition.idComposition}>
                        <td className="px-5 py-4 font-medium text-slate-900">
                          {[composition.prenom, composition.nom].filter(Boolean).join(' ') || composition.numeroMembre || 'Membre'}
                          {composition.numeroMembre && <span className="ml-2 text-xs font-normal text-slate-500">{composition.numeroMembre}</span>}
                        </td>
                        <td className="px-5 py-4 text-slate-600">{composition.departementOrigineNom}</td>
                        <td className="px-5 py-4"><Badge good={composition.actif}>{composition.actif ? 'Actif' : 'Inactif'}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  )
}
