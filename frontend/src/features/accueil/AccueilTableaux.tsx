import { useState, useSyncExternalStore, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { CarteOsm } from '@/features/familles/CarteOsm'
import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { getActivitesVersion, listAllActivites, subscribeActivites } from '@/features/departements/activites'
import {
  formatMontant,
  getBudgetVersion,
  listToutesRentrees,
  subscribeBudget,
} from '@/features/departements/budget'
import { useInboxScope } from '@/features/notifications/inbox'
import {
  getCirculationsVersion,
  kindLabel,
  subscribeCirculations,
  visibleCirculations,
} from '@/features/notifications/circulation'
import {
  getDemandesVersion,
  listDemandes,
  subscribeDemandes,
} from '@/features/notifications/store'
import { cn } from '@/lib/cn'
import {
  getActivitesFamilleVersion,
  listAllActivitesFamille,
  subscribeActivitesFamille,
} from '@/features/familles/activites'
import {
  contributionsMensuelles,
  croissanceEglise,
  estDime,
  estOffrande,
  progressionCultes,
  repartitionMembres,
  sommeMois,
  sommeMotifs,
} from './indicateurs'

const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

const COULEURS_MEMBRES: Record<string, string> = {
  Femmes: '#047bca',
  Hommes: '#3c0173',
  Enfants: '#ecb708',
}

const ORDRE_MEMBRES = ['Femmes', 'Hommes', 'Enfants']

const BLEUS_CONTRIBUTIONS = ['#d6e6f5', '#b7d2ee', '#8fb8e4', '#5b93cf', '#2f6eaf', '#1e3a5f']

const COULEURS_MARQUES = {
  culte: '#1e3a5f',
  programme: '#c4a035',
  evenement: '#111827',
  planification: '#e8c547',
} as const

const LIBELLES_MARQUES = [
  { id: 'culte', label: 'Cultes' },
  { id: 'programme', label: 'Programmes' },
  { id: 'evenement', label: 'Événements' },
  { id: 'planification', label: 'Planification' },
] as const

type MembreAccueil = {
  sexe?: string | null
  dateNaissance?: string | null
  dateCreation?: string | null
  statut?: string | null
}

export function useProgressionCultes(departements: { id: string; nom: string }[]) {
  useSyncExternalStore(subscribeActivites, getActivitesVersion, getActivitesVersion)
  return progressionCultes(departements, listAllActivites())
}

export function useContributionsAccueil() {
  useSyncExternalStore(subscribeBudget, getBudgetVersion, getBudgetVersion)
  const rentrees = listToutesRentrees()
  return {
    offrandes: sommeMotifs(rentrees, estOffrande),
    dimes: sommeMotifs(rentrees, estDime),
    total: rentrees.reduce((sum, item) => sum + item.montant, 0),
    offrandesMois: sommeMois(rentrees, estOffrande),
    dimesMois: sommeMois(rentrees, estDime),
  }
}

export function AccueilTableaux({
  departements,
  familles,
  personnes = [],
}: {
  departements: { id: string; nom: string }[]
  familles: {
    id: string
    nom: string
    zone?: string | null
    latitude?: number | null
    longitude?: number | null
    personnes?: number
  }[]
  personnes?: MembreAccueil[]
}) {
  useSyncExternalStore(subscribeActivites, getActivitesVersion, getActivitesVersion)
  useSyncExternalStore(subscribeActivitesFamille, getActivitesFamilleVersion, getActivitesFamilleVersion)
  useSyncExternalStore(subscribeBudget, getBudgetVersion, getBudgetVersion)

  const [moisVisible, setMoisVisible] = useState(() => debutMois(new Date()))
  const membres = ORDRE_MEMBRES.map((nom) => repartitionMembres(personnes).find((item) => item.nom === nom)!)
  const croissance = croissanceEglise(personnes)
  const totalMembres = membres.reduce((sum, item) => sum + item.total, 0)
  const contributions = contributionsMensuelles(listToutesRentrees())
  const famillesPlacees = familles.flatMap((famille) => {
    if (famille.latitude == null || famille.longitude == null) return []
    const personnes = famille.personnes ?? 0
    const zone = famille.zone?.trim()
    return [{
      id: famille.id,
      nom: famille.nom,
      latitude: famille.latitude,
      longitude: famille.longitude,
      detail: [zone, `${personnes} personne${personnes > 1 ? 's' : ''}`].filter(Boolean).join(' · '),
    }]
  })
  const noms = new Map([
    ...departements.map((item) => [item.id, item.nom] as const),
    ...familles.map((item) => [item.id, item.nom] as const),
  ])
  const calendrier = calendrierInterieur(
    [
      ...listAllActivites().map((item) => ({
        id: item.id,
        date: item.date,
        titre: item.titre,
        lieu: noms.get(item.idDepartement) ?? 'Département',
        origine: 'departement' as const,
        statut: item.statut,
      })),
      ...listAllActivitesFamille().map((item) => ({
        id: item.id,
        date: item.date,
        titre: item.titre,
        lieu: noms.get(item.idFamille) ?? 'Famille',
        origine: 'famille' as const,
        statut: item.statut,
      })),
    ],
    moisVisible,
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <Panneau
          className="lg:col-span-2"
          titre="Cartographie des familles d'impact"
          sousTitre="Répartition géographique des foyers par zone d'influence."
        >
          <CarteOsm marqueurs={famillesPlacees} hauteur="h-80" />
        </Panneau>

        <VueNotifications />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panneau titre="Contributions mensuelles" sousTitre="Offrandes et cotisations enregistrées.">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={contributions} barCategoryGap="30%">
                <XAxis
                  dataKey="mois"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickFormatter={libelleMoisCourt}
                />
                <Tooltip formatter={(value) => formatMontant(Number(value))} />
                <Bar dataKey="montant" name="Contributions" radius={[6, 6, 0, 0]} maxBarSize={28}>
                  {contributions.map((item, index) => (
                    <Cell
                      key={item.mois}
                      fill={
                        index === contributions.length - 1
                          ? '#1e293b'
                          : BLEUS_CONTRIBUTIONS[index % BLEUS_CONTRIBUTIONS.length]
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panneau>

        <Panneau titre="Croissance de l'église" sousTitre="Effectif cumulé sur les douze derniers mois.">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={croissance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="mois" tick={{ fontSize: 12 }} tickFormatter={libelleMoisCourt} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="effectif" name="Membres" stroke="#3c0173" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panneau>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panneau titre="Répartition des membres" sousTitre="Hommes, femmes et enfants de moins de 18 ans.">
          <div className="flex flex-1 flex-col items-center justify-center gap-8">
            <div className="relative h-44 w-44 shrink-0">
              {totalMembres === 0 ? (
                <span className="absolute inset-3 rounded-full border-[18px] border-slate-200" aria-hidden="true" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={membres.filter((item) => item.total > 0)}
                      dataKey="total"
                      nameKey="nom"
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={70}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {membres
                        .filter((item) => item.total > 0)
                        .map((item) => (
                          <Cell key={item.nom} fill={COULEURS_MEMBRES[item.nom]} />
                        ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-2xl font-semibold tracking-tight text-slate-900">
                  {totalMembres.toLocaleString('fr-FR')}
                </p>
                <p className="text-xs text-slate-500">Total</p>
              </div>
            </div>
            <ul className="flex w-full max-w-xs flex-col gap-3">
              {membres.map((item) => {
                const part =
                  totalMembres === 0 ? '0,0' : ((item.total / totalMembres) * 100).toFixed(1).replace('.', ',')
                return (
                  <li key={item.nom} className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 text-sm">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: COULEURS_MEMBRES[item.nom] }}
                      aria-hidden="true"
                    />
                    <span className="text-slate-700">{item.nom}</span>
                    <span className="whitespace-nowrap text-slate-500 tabular-nums">{part} %</span>
                    <span className="w-10 text-right font-semibold text-slate-900 tabular-nums">
                      {item.total.toLocaleString('fr-FR')}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        </Panneau>

        <Panneau
          className="lg:col-span-2"
          titre={`Calendrier des activités — ${calendrier.libelle}`}
          sousTitre="Vue mensuelle des programmes et événements."
          action={
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="flex size-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
                aria-label="Mois précédent"
                onClick={() => setMoisVisible((courant) => debutMois(new Date(courant.getFullYear(), courant.getMonth() - 1, 1)))}
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                className="flex size-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
                aria-label="Mois suivant"
                onClick={() => setMoisVisible((courant) => debutMois(new Date(courant.getFullYear(), courant.getMonth() + 1, 1)))}
              >
                <ChevronRight className="size-4" aria-hidden="true" />
              </button>
            </div>
          }
        >
          <div className="grid grid-cols-7 text-center text-xs text-slate-400">
            {JOURS.map((jour) => (
              <div key={jour} className="py-2 font-medium tracking-wide uppercase">
                {jour}
              </div>
            ))}
            {calendrier.cases.map((jour) => (
              <div
                key={jour.cle}
                title={jour.titres.length > 0 ? jour.titres.join(', ') : undefined}
                className={cn(
                  'flex h-12 flex-col items-center justify-center border-t border-slate-100',
                  jour.dansMois ? 'text-slate-800' : 'text-slate-300',
                  jour.aujourdhui && 'font-semibold text-slate-950',
                )}
              >
                <span>{jour.numero}</span>
                {jour.marques.length > 0 && (
                  <span className="mt-1 flex gap-0.5" aria-hidden="true">
                    {jour.marques.map((marque) => (
                      <span
                        key={marque}
                        className="h-0.5 w-4 rounded-full"
                        style={{ backgroundColor: COULEURS_MARQUES[marque] }}
                      />
                    ))}
                  </span>
                )}
              </div>
            ))}
          </div>
          <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
            {LIBELLES_MARQUES.map((item) => (
              <li key={item.id} className="flex items-center gap-2 text-xs text-slate-500">
                <span className="size-2 rounded-full" style={{ backgroundColor: COULEURS_MARQUES[item.id] }} aria-hidden="true" />
                {item.label}
              </li>
            ))}
          </ul>
        </Panneau>
      </div>
    </div>
  )
}

function VueNotifications() {
  const { user, isAdmin, isPasteur, isDge, chefDepartementIds, superviseurDepartementIds } = useInboxScope()
  useSyncExternalStore(subscribeDemandes, getDemandesVersion, getDemandesVersion)
  useSyncExternalStore(subscribeCirculations, getCirculationsVersion, getCirculationsVersion)

  const idPersonne = user?.personne?.idPersonne
  const demandes = listDemandes().filter((demande) =>
    isAdmin ? true : demande.idDemandeur === idPersonne,
  )
  const circulations = idPersonne
    ? visibleCirculations({
        idPersonne,
        isAdmin,
        isPasteur,
        isDge,
        superviseurDepartementIds,
        chefDepartementIds,
      })
    : []
  const entrees = [
    ...circulations.map((item) => ({
      id: item.id,
      titre: item.titre,
      detail: `${kindLabel(item.kind)} · ${item.nomDepartementSource}`,
      date: item.dateCreation,
      nonLu: idPersonne ? !item.luPar.includes(idPersonne) : false,
    })),
    ...demandes.map((demande) => ({
      id: demande.id,
      titre: demande.nomCible,
      detail: `${demande.roleCible === 'Chef' ? 'Chef de département' : 'Superviseur'} · ${demande.nomDepartement}`,
      date: demande.dateCreation,
      nonLu: isAdmin
        ? demande.statut === 'en_attente' && !demande.luAdmin
        : demande.statut !== 'en_attente' && !demande.luDemandeur,
    })),
  ].sort((left, right) => right.date.localeCompare(left.date))

  return (
    <Panneau
      titre="Notifications"
      sousTitre="Messages et alertes de l'église."
      action={
        <Link to="/notifications" className="text-xs font-medium text-brand-700 hover:underline">
          Voir tout
        </Link>
      }
    >
      {entrees.length === 0 ? (
        <p className="flex h-64 items-center justify-center text-center text-sm text-slate-500">
          Aucune notification pour le moment.
        </p>
      ) : (
        <ul className="flex h-64 flex-col gap-1 overflow-y-auto">
          {entrees.map((item) => (
            <li key={item.id} className="flex items-start gap-3 border-b border-slate-100 py-2 last:border-0">
              <span
                className={cn('mt-1.5 size-2 shrink-0 rounded-full', item.nonLu ? 'bg-brand-600' : 'bg-slate-200')}
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">{item.titre}</p>
                <p className="truncate text-xs text-slate-500">{item.detail}</p>
              </div>
              <time className="shrink-0 text-xs text-slate-400" dateTime={item.date}>
                {new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(new Date(item.date))}
              </time>
            </li>
          ))}
        </ul>
      )}
    </Panneau>
  )
}

function Panneau({
  titre,
  sousTitre,
  action,
  className,
  children,
}: {
  titre: string
  sousTitre?: string
  action?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <section className={cn('flex min-w-0 flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]', className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">{titre}</h2>
          {sousTitre && <p className="mt-1 text-xs text-slate-500">{sousTitre}</p>}
        </div>
        {action}
      </div>
      <div className="mt-4 flex flex-1 flex-col">{children}</div>
    </section>
  )
}

function debutMois(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function libelleMoisCourt(mois: string) {
  const propre = mois.replace('.', '')
  return propre.charAt(0).toUpperCase() + propre.slice(1)
}

type MarqueCalendrier = keyof typeof COULEURS_MARQUES

type ActiviteCalendrier = {
  id: string
  date: string
  titre: string
  lieu: string
  origine: 'departement' | 'famille'
  statut: 'planifiee' | 'faite'
}

function marqueActivite(activite: ActiviteCalendrier): MarqueCalendrier {
  if (/culte/i.test(activite.titre)) return 'culte'
  if (activite.origine === 'famille') return 'programme'
  if (activite.statut === 'planifiee') return 'planification'
  return 'evenement'
}

function calendrierInterieur(activites: ActiviteCalendrier[], maintenant = new Date()) {
  const annee = maintenant.getFullYear()
  const mois = maintenant.getMonth()
  const premier = new Date(annee, mois, 1)
  const decalage = (premier.getDay() + 6) % 7
  const nombre = new Date(annee, mois + 1, 0).getDate()
  const precedent = new Date(annee, mois, 0).getDate()
  const prefixe = `${annee}-${String(mois + 1).padStart(2, '0')}`
  const aujourdHui = new Date()
  const parJour = new Map<number, { marques: MarqueCalendrier[]; titres: string[] }>()
  for (const activite of activites) {
    if (!activite.date.startsWith(prefixe)) continue
    const jour = Number(activite.date.slice(8, 10))
    const courant = parJour.get(jour) ?? { marques: [], titres: [] }
    const marque = marqueActivite(activite)
    if (!courant.marques.includes(marque)) courant.marques.push(marque)
    courant.titres.push(`${activite.titre} · ${activite.lieu}`)
    parJour.set(jour, courant)
  }
  const cases = [
    ...Array.from({ length: decalage }, (_, index) => ({
      cle: `avant-${index}`,
      dansMois: false,
      numero: precedent - decalage + index + 1,
      marques: [] as MarqueCalendrier[],
      titres: [] as string[],
      aujourdhui: false,
    })),
    ...Array.from({ length: nombre }, (_, index) => {
      const detail = parJour.get(index + 1)
      return {
        cle: `${prefixe}-${index + 1}`,
        dansMois: true,
        numero: index + 1,
        marques: detail?.marques ?? [],
        titres: detail?.titres ?? [],
        aujourdhui:
          aujourdHui.getFullYear() === annee &&
          aujourdHui.getMonth() === mois &&
          aujourdHui.getDate() === index + 1,
      }
    }),
  ]
  let suivant = 1
  while (cases.length % 7 !== 0) {
    cases.push({
      cle: `apres-${suivant}`,
      dansMois: false,
      numero: suivant,
      marques: [],
      titres: [],
      aujourdhui: false,
    })
    suivant += 1
  }
  const brut = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(premier)
  return {
    libelle: brut.charAt(0).toUpperCase() + brut.slice(1),
    cases,
  }
}
