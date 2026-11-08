import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, Check, ChevronLeft, ChevronRight, ClipboardCheck, Pencil, Save, UserMinus, UserPlus, UsersRound } from 'lucide-react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Link } from 'react-router-dom'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogContent } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useFamilles } from '@/features/familles/hooks'
import { usePersonnes, usePersonnesFamilles } from '@/features/personnes/hooks'
import { useDepartements } from '@/features/departements/hooks'
import type { Personne } from '@/types'
import {
  admettreNouveauVenu,
  enregistrerChecklistPreparationCulte,
  enregistrerSuiviPresenceCulte,
  getChecklistPreparationCulte,
  getFamilleDiscipleDePersonne,
  getSuiviPresenceCulte,
  modifierStatutMembreFamille,
  type ChecklistPreparationCulte,
  type ChecklistDepartementCulte,
  type CompositionFamilleDisciple,
  type FamilleDisciple,
  type StatutPresenceDisciple,
  type SuiviPresenceCulte,
  type SuiviPresenceDisciple,
  type TypeCulte,
  retirerMembreFamille,
} from './api'

const SERVICES_CULTE: { id: TypeCulte; label: string }[] = [
  { id: 'dimanche', label: 'Dimanche' },
  { id: 'mercredi', label: 'Mercredi' },
  { id: 'vendredi', label: 'Vendredi' },
]

const PRESENCE_LABELS: Record<StatutPresenceDisciple, string> = {
  a_confirmer: 'À confirmer',
  present: 'Présent',
  absent: 'Absent',
  excuse: 'Absent avec justification',
}

const PRESENCE_LABELS_COURTES: Record<StatutPresenceDisciple, string> = {
  a_confirmer: 'À confirmer',
  present: 'Présent',
  absent: 'Absent',
  excuse: 'Excusé',
}

type RapportAudit = {
  cle: string
  titre: string
  dateCulte: string
  typeCulte: TypeCulte
  suivi: SuiviPresenceCulte
}

function dateLocale() {
  const date = new Date()
  const decalage = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - decalage).toISOString().slice(0, 10)
}

function dateLisible(value?: string | null) {
  if (!value) return null
  const date = new Date(`${value.slice(0, 10)}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(date)
}

function normaliserRecherche(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr-FR').trim()
}

function nomPersonne(personne: Pick<Personne, 'prenom' | 'nom'>) {
  return `${personne.prenom} ${personne.nom}`.trim()
}

function Tag({ children, tone = 'blue', title }: { children: ReactNode; tone?: 'blue' | 'green' | 'amber'; title?: string }) {
  const tones = {
    blue: 'bg-sky-50 text-sky-800',
    green: 'bg-emerald-50 text-emerald-800',
    amber: 'bg-amber-50 text-amber-900',
  }
  return <span title={title} className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>
}

function AdmissionNouveauVenuDialog({
  famille,
  open,
  onOpenChange,
}: {
  famille: FamilleDisciple
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [personneId, setPersonneId] = useState('')
  const [dateAccueil, setDateAccueil] = useState(dateLocale())
  const [nouveauVenu, setNouveauVenu] = useState(true)
  const personnesQuery = usePersonnes({ page: 1, limit: 100 }, open)
  const personnes = personnesQuery.data?.data ?? [
    { idPersonne: 'simulation-personne-mireille', prenom: 'Mireille', nom: 'Kalala' },
    { idPersonne: 'simulation-personne-joseph', prenom: 'Joseph', nom: 'Tshibangu' },
    { idPersonne: 'simulation-personne-anne', prenom: 'Anne', nom: 'Beya' },
  ]
  const admission = useMutation({
    mutationFn: () => {
      const personne = personnes.find((item) => item.idPersonne === personneId)
      return admettreNouveauVenu(famille.idFamilleDisciple, {
        idPersonne: personneId,
        dateAccueil,
        nouveauVenu,
        prenom: personne?.prenom,
        nom: personne?.nom,
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['familles-disciples'] })
      void queryClient.invalidateQueries({ queryKey: ['personnes', 'famille-disciple', personneId] })
      onOpenChange(false)
      setPersonneId('')
      setNouveauVenu(true)
    },
  })
  const dejaDansFamille = new Set(famille.compositions?.map((composition) => composition.idPersonne).filter(Boolean))
  const choix = personnes.filter((personne) => {
    const nom = nomPersonne(personne).toLowerCase()
    return !dejaDansFamille.has(personne.idPersonne) && nom.includes(search.trim().toLowerCase())
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="Ajouter une personne à la famille"
        description={`Indiquez si la personne est nouvelle à l’église ou si elle en est déjà membre. Elle sera rattachée à « ${famille.nom} ».`}
      >
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            admission.mutate()
          }}
        >
          {admission.isError && <Alert variant="error" title="Admission impossible">{admission.error.message}</Alert>}
          {personnesQuery.isError && !personnesQuery.data && <Alert variant="info" title="Personnes de démonstration">Le catalogue de personnes est indisponible ; des profils de simulation sont proposés.</Alert>}
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-800">
            Rechercher une personne
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nom ou prénom" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-800">
            Personne à rattacher
            <Select value={personneId} onChange={(event) => setPersonneId(event.target.value)} required>
              <option value="">Choisir une personne</option>
              {choix.map((personne) => (
                <option key={personne.idPersonne} value={personne.idPersonne}>{nomPersonne(personne)}</option>
              ))}
            </Select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-800">
            Situation à l’église
            <Select value={nouveauVenu ? 'nouveau' : 'membre'} onChange={(event) => setNouveauVenu(event.target.value === 'nouveau')}>
              <option value="nouveau">Nouveau venu</option>
              <option value="membre">Membre déjà inscrit à l’église</option>
            </Select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-800">
            Date d’entrée dans la famille
            <Input type="date" value={dateAccueil} onChange={(event) => setDateAccueil(event.target.value)} required />
          </label>
          {personnesQuery.isSuccess && choix.length === 0 && (
            <p className="text-sm text-slate-600">Aucune personne disponible. Créez d’abord sa fiche dans <Link className="font-semibold text-brand-700 underline" to="/personnes" onClick={() => onOpenChange(false)}>Personnes</Link>.</p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button type="submit" isLoading={admission.isPending} disabled={!personneId || !dateAccueil}>
              <UserPlus className="size-4" />Ajouter à cette famille
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function FamilleMembresPanel({ famille, onAdmettre }: { famille: FamilleDisciple; onAdmettre: () => void }) {
  const membres = famille.compositions ?? []
  const queryClient = useQueryClient()
  const [membreARetirer, setMembreARetirer] = useState<CompositionFamilleDisciple | null>(null)
  const [membreAEditer, setMembreAEditer] = useState<CompositionFamilleDisciple | null>(null)
  const [nouveauVenuEdition, setNouveauVenuEdition] = useState(true)
  const [suiviFamilialActifEdition, setSuiviFamilialActifEdition] = useState(true)
  const [recherche, setRecherche] = useState('')
  const [departementFiltre, setDepartementFiltre] = useState('')
  const [familleImpactFiltre, setFamilleImpactFiltre] = useState('')
  const [situationEgliseFiltre, setSituationEgliseFiltre] = useState('')
  const personneIds = [...new Set(membres.map((membre) => membre.idPersonne).filter((id): id is string => Boolean(id)))]
  const affectationsFamilleQueries = usePersonnesFamilles(personneIds, false)
  const affectationsFamille = affectationsFamilleQueries.flatMap((query) => query.data ?? [])
  const famillesImpactQuery = useFamilles({ page: 1, limit: 100 })
  const famillesImpact = famillesImpactQuery.data?.data ?? []
  const nomsFamillesImpact = new Map(famillesImpact.map((item) => [item.idFamille, item.nom]))
  const famillesImpactParPersonne = new Map<string, string[]>()
  for (const affectation of affectationsFamille) {
    if (!affectation.actif) continue
    const ids = famillesImpactParPersonne.get(affectation.idPersonne) ?? []
    ids.push(affectation.idFamille)
    famillesImpactParPersonne.set(affectation.idPersonne, ids)
  }
  const departements = [...new Map(membres.map((membre) => [membre.departementOrigineId, membre.departementOrigineNom])).entries()]
    .map(([id, nom]) => ({ id, nom }))
    .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
  const termeRecherche = normaliserRecherche(recherche)
  const membresFiltres = membres.filter((membre) => {
    const famillesMembre = famillesImpactParPersonne.get(membre.idPersonne ?? '') ?? []
    const texteRecherche = normaliserRecherche([
      membre.prenom,
      membre.nom,
      membre.numeroMembre,
      membre.departementOrigineNom,
      ...famillesMembre.map((id) => nomsFamillesImpact.get(id)),
    ].filter(Boolean).join(' '))
    return (!termeRecherche || texteRecherche.includes(termeRecherche))
      && (!departementFiltre || membre.departementOrigineId === departementFiltre)
      && (!familleImpactFiltre || famillesMembre.includes(familleImpactFiltre))
      && (!situationEgliseFiltre || (membre.nouveauVenu ? 'nouveau' : 'membre') === situationEgliseFiltre)
  })
  const modifierStatut = useMutation({
    mutationFn: () => modifierStatutMembreFamille(famille.idFamilleDisciple, membreAEditer!.idComposition, {
      nouveauVenu: nouveauVenuEdition,
      actif: suiviFamilialActifEdition,
    }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['familles-disciples'] })
      if (membreAEditer?.idPersonne) {
        await queryClient.invalidateQueries({ queryKey: ['personnes', 'famille-disciple', membreAEditer.idPersonne] })
      }
      setMembreAEditer(null)
    },
  })
  const retrait = useMutation({
    mutationFn: () => retirerMembreFamille(famille.idFamilleDisciple, membreARetirer!.idComposition),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['familles-disciples'] })
      setMembreARetirer(null)
    },
  })

  return (
    <>
      <section className="overflow-hidden border border-slate-100 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
        <div className="grid min-w-0 gap-3 border-b border-slate-100 bg-slate-50/50 px-5 py-4 sm:grid-cols-2 2xl:grid-cols-[minmax(11rem,1.2fr)_minmax(10rem,1fr)_minmax(16rem,1.5fr)_minmax(10rem,1fr)_auto]">
          <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-600">
            Rechercher un membre
            <Input
              type="search"
              value={recherche}
              onChange={(event) => setRecherche(event.target.value)}
              placeholder="Nom, numéro ou département"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-600">
            Département d’origine
            <Select value={departementFiltre} onChange={(event) => setDepartementFiltre(event.target.value)}>
              <option value="">Tous les départements</option>
              {departements.map((departement) => <option key={departement.id} value={departement.id}>{departement.nom}</option>)}
            </Select>
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-600">
            Famille d’impact
            <Select value={familleImpactFiltre} onChange={(event) => setFamilleImpactFiltre(event.target.value)}>
              <option value="">Toutes les familles d’impact</option>
              {famillesImpact.filter((item) => item.actif).map((item) => <option key={item.idFamille} value={item.idFamille}>{item.nom}</option>)}
            </Select>
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-600">
            Situation à l’église
            <Select value={situationEgliseFiltre} onChange={(event) => setSituationEgliseFiltre(event.target.value)}>
              <option value="">Tous les statuts</option>
              <option value="nouveau">Nouveaux venus</option>
              <option value="membre">Déjà membres de l’église</option>
            </Select>
          </label>
          <Button type="button" size="sm" className="h-10 min-w-0 self-end whitespace-nowrap px-3 text-sm" onClick={onAdmettre}>
            <UserPlus className="size-4" />Ajouter une personne
          </Button>
        </div>
        {retrait.isError && <div className="p-4"><Alert variant="error" title="Impossible de retirer ce membre">{retrait.error.message}</Alert></div>}
        {membres.length === 0 ? (
          <div className="p-8 text-center">
            <UsersRound className="mx-auto size-8 text-slate-400" aria-hidden="true" />
            <p className="mt-3 text-sm text-slate-600">Aucun membre suivi dans cette famille.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] table-fixed text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th scope="col" className="w-[14%] px-4 py-3 font-semibold">Membre</th>
                  <th scope="col" className="w-[15%] px-4 py-3 font-semibold">Département d’origine</th>
                  <th scope="col" className="w-[20%] px-4 py-3 font-semibold">Famille d’impact</th>
                  <th scope="col" className="w-[27%] px-4 py-3 font-semibold">Situation à l’église</th>
                  <th scope="col" className="w-[24%] px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {membresFiltres.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-slate-500">Aucun membre ne correspond à ces critères.</td></tr>
                ) : membresFiltres.map((membre) => (
                  <tr key={membre.idComposition}>
                    <td className="whitespace-nowrap px-4 py-4 font-medium text-slate-900">
                      {membre.idPersonne ? <Link className="hover:text-brand-700 hover:underline" to={`/personnes/${membre.idPersonne}`}>{[membre.prenom, membre.nom].filter(Boolean).join(' ') || membre.numeroMembre || 'Membre'}</Link> : [membre.prenom, membre.nom].filter(Boolean).join(' ') || membre.numeroMembre || 'Membre'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-slate-600">{membre.departementOrigineNom}</td>
                    <td className="px-4 py-4 text-slate-600">
                      {(famillesImpactParPersonne.get(membre.idPersonne ?? '') ?? [])
                        .map((id) => nomsFamillesImpact.get(id))
                        .filter(Boolean)
                        .join(', ') || 'Aucune famille d’impact'}
                    </td>
                    <td className="px-4 py-4">
                      {membre.nouveauVenu
                        ? <div className="flex flex-col items-start gap-1"><Tag tone="green">Nouveau venu</Tag><span className="text-xs text-slate-500">Entrée dans la famille : {membre.dateAccueil || 'date à préciser'}</span></div>
                        : <Tag title="Personne déjà membre de l’église avant son rattachement à cette famille.">Déjà membre de l’église</Tag>}
                    </td>
                    <td className="px-3 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                        <Button type="button" size="sm" className="px-2" variant="secondary" title="Modifier la situation à l’église et le suivi familial" aria-label={`Modifier les statuts de ${membre.prenom ?? ''} ${membre.nom ?? ''}`} onClick={() => {
                          setMembreAEditer(membre)
                          setNouveauVenuEdition(Boolean(membre.nouveauVenu))
                          setSuiviFamilialActifEdition(membre.actif)
                          modifierStatut.reset()
                        }}>
                          <Pencil className="size-4" />Modifier
                        </Button>
                        <Button type="button" size="sm" className="px-2" variant="secondary" title="Retirer de la famille" aria-label={`Retirer ${membre.prenom ?? ''} ${membre.nom ?? ''} de la famille`} onClick={() => { setMembreARetirer(membre); retrait.reset() }}>
                          <UserMinus className="size-4" />Retirer
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="grid gap-4 border-t border-slate-100 p-5 lg:grid-cols-10">
          <div className="lg:col-span-6">
            <CalendrierCultesFamille />
          </div>
          <div className="lg:col-span-4">
            <GraphiqueCroissanceFamille membres={membres} />
          </div>
        </div>
      </section>
      <Dialog open={Boolean(membreARetirer)} onOpenChange={(open) => { if (!open) { setMembreARetirer(null); retrait.reset() } }}>
        <DialogContent
          title="Retirer de la famille ?"
          description={`${[membreARetirer?.prenom, membreARetirer?.nom].filter(Boolean).join(' ') || 'Ce membre'} ne fera plus partie de ${famille.nom}. Sa fiche de personne ne sera pas supprimée.`}
        >
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setMembreARetirer(null)}>Annuler</Button>
            <Button type="button" isLoading={retrait.isPending} onClick={() => retrait.mutate()} disabled={!membreARetirer}>
              <UserMinus className="size-4" />Retirer de cette famille
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(membreAEditer)} onOpenChange={(open) => { if (!open) { setMembreAEditer(null); modifierStatut.reset() } }}>
        <DialogContent
          title="Modifier les statuts"
          description={`Mettez à jour séparément la situation à l’église et le suivi familial de ${[membreAEditer?.prenom, membreAEditer?.nom].filter(Boolean).join(' ') || 'ce membre'}.`}
        >
          {modifierStatut.isError && <Alert variant="error" title="Statuts non enregistrés">{modifierStatut.error.message}</Alert>}
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-800">
              Situation à l’église
              <Select value={nouveauVenuEdition ? 'nouveau' : 'membre'} onChange={(event) => setNouveauVenuEdition(event.target.value === 'nouveau')}>
                <option value="nouveau">Nouveau venu</option>
                <option value="membre">Déjà membre de l’église</option>
              </Select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-800">
              Suivi familial
              <Select value={suiviFamilialActifEdition ? 'actif' : 'termine'} onChange={(event) => setSuiviFamilialActifEdition(event.target.value === 'actif')}>
                <option value="actif">En cours</option>
                <option value="termine">Terminé</option>
              </Select>
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setMembreAEditer(null)}>Annuler</Button>
              <Button type="button" isLoading={modifierStatut.isPending} onClick={() => modifierStatut.mutate()} disabled={!membreAEditer}>
                <Save className="size-4" />Enregistrer les statuts
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function CalendrierCultesFamille() {
  const jours = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
  const services = [
    { id: 'dimanche', jour: 0, nom: 'Culte du dimanche', couleur: '#1e3a5f' },
    { id: 'mercredi', jour: 3, nom: 'Culte du mercredi', couleur: '#c4a035' },
    { id: 'vendredi', jour: 5, nom: 'Culte du vendredi', couleur: '#3c0173' },
  ] as const
  const [moisVisible, setMoisVisible] = useState(() => {
    const maintenant = new Date()
    return new Date(maintenant.getFullYear(), maintenant.getMonth(), 1)
  })
  const premierJour = new Date(moisVisible.getFullYear(), moisVisible.getMonth(), 1)
  const decalage = (premierJour.getDay() + 6) % 7
  const nombreJours = new Date(moisVisible.getFullYear(), moisVisible.getMonth() + 1, 0).getDate()
  const nombreCases = Math.ceil((decalage + nombreJours) / 7) * 7
  const maintenant = new Date()
  const libelleMois = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(moisVisible)
  const cases = Array.from({ length: nombreCases }, (_, index) => {
    const date = new Date(moisVisible.getFullYear(), moisVisible.getMonth(), index - decalage + 1)
    const dansMois = date.getMonth() === moisVisible.getMonth()
    const culte = dansMois ? services.find((service) => service.jour === date.getDay()) : undefined
    const aujourdhui = date.toDateString() === maintenant.toDateString()
    return { cle: `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`, date, dansMois, culte, aujourdhui }
  })

  return (
    <section className="flex min-w-0 flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]" aria-label="Calendrier mensuel des cultes de la famille">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Calendrier des cultes — {libelleMois}</h3>
          <p className="mt-1 text-xs text-slate-500">Vue mensuelle des cultes de la famille.</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
            aria-label="Mois précédent"
            onClick={() => setMoisVisible((courant) => new Date(courant.getFullYear(), courant.getMonth() - 1, 1))}
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
            aria-label="Mois suivant"
            onClick={() => setMoisVisible((courant) => new Date(courant.getFullYear(), courant.getMonth() + 1, 1))}
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-7 text-center text-xs text-slate-400">
        {jours.map((jour) => <div key={jour} className="py-2 font-medium tracking-wide uppercase">{jour}</div>)}
        {cases.map((jour) => (
          <div
            key={jour.cle}
            title={jour.culte?.nom}
            className={`flex h-12 flex-col items-center justify-center border-t border-slate-100 ${jour.dansMois ? 'text-slate-800' : 'text-slate-300'} ${jour.aujourdhui ? 'font-semibold text-slate-950' : ''}`}
          >
            <span>{jour.date.getDate()}</span>
            {jour.culte && <span className="mt-1 h-0.5 w-4 rounded-full" style={{ backgroundColor: jour.culte.couleur }} aria-hidden="true" />}
          </div>
        ))}
      </div>
      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
        {services.map((service) => (
          <li key={service.id} className="flex items-center gap-2 text-xs text-slate-500">
            <span className="size-2 rounded-full" style={{ backgroundColor: service.couleur }} aria-hidden="true" />
            {service.nom}
          </li>
        ))}
      </ul>
    </section>
  )
}

function GraphiqueCroissanceFamille({ membres }: { membres: CompositionFamilleDisciple[] }) {
  const maintenant = new Date()
  const premierMois = new Date(maintenant.getFullYear(), maintenant.getMonth() - 11, 1)
  const dateDebut = `${premierMois.getFullYear()}-${String(premierMois.getMonth() + 1).padStart(2, '0')}-01`
  const dateAujourdHui = dateLocale()
  const actifs = membres.filter((membre) => membre.actif)
  const sansDateOuAnciens = actifs.filter((membre) => !membre.dateAccueil || membre.dateAccueil < dateDebut).length
  let effectifCumule = sansDateOuAnciens
  const croissance = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(maintenant.getFullYear(), maintenant.getMonth() - 11 + index, 1)
    const cle = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    effectifCumule += actifs.filter((membre) => membre.dateAccueil && membre.dateAccueil <= dateAujourdHui && membre.dateAccueil.slice(0, 7) === cle).length
    return { mois: cle, effectif: effectifCumule }
  })

  return (
    <section className="flex min-w-0 flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]" aria-label="Évolution de l’effectif de la famille">
      <div>
        <h3 className="text-base font-semibold text-slate-900">Croissance de la famille</h3>
        <p className="mt-1 text-xs text-slate-500">Effectif cumulé sur les douze derniers mois.</p>
      </div>
      <div className="mt-4 h-64">
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
      <p className="mt-2 text-xs text-slate-500">Les dates d’accueil manquantes sont comptées comme des membres déjà présents au début de la période.</p>
    </section>
  )
}

function libelleMoisCourt(mois: string) {
  const [annee = 0, numeroMois = 1] = mois.split('-').map(Number)
  const libelle = new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(new Date(annee, numeroMois - 1, 1)).replace('.', '')
  return libelle.charAt(0).toUpperCase() + libelle.slice(1)
}

function SuiviCultesPanel({
  familleId,
  dateCulte,
  onDateCulteChange,
  typeCulte,
  onTypeCulteChange,
  onSaved,
}: {
  familleId: string
  dateCulte: string
  onDateCulteChange: (date: string) => void
  typeCulte: TypeCulte
  onTypeCulteChange: (type: TypeCulte) => void
  onSaved: (suivi: SuiviPresenceCulte) => void
}) {
  const queryClient = useQueryClient()
  const [membres, setMembres] = useState<SuiviPresenceDisciple[]>([])
  const [rechercheMembre, setRechercheMembre] = useState('')
  const [filtreSuivi, setFiltreSuivi] = useState('tous')
  const [pageMembres, setPageMembres] = useState(1)
  const [modeSelection, setModeSelection] = useState(false)
  const [personnesSelectionnees, setPersonnesSelectionnees] = useState<Set<string>>(() => new Set())
  const [personneEnEditionId, setPersonneEnEditionId] = useState<string | null>(null)
  const [erreurJustification, setErreurJustification] = useState(false)
  const [messageActionMasse, setMessageActionMasse] = useState('')
  const membresParPage = 20
  const presenceQuery = useQuery({
    queryKey: ['familles-disciples', familleId, 'presences', typeCulte, dateCulte],
    queryFn: () => getSuiviPresenceCulte(familleId, { typeCulte, dateCulte }),
    enabled: Boolean(dateCulte),
  })
  useEffect(() => {
    setMembres(presenceQuery.data?.membres ?? [])
    setPageMembres(1)
    setPersonnesSelectionnees(new Set())
    setModeSelection(false)
    setPersonneEnEditionId(null)
  }, [presenceQuery.data])
  const enregistrement = useMutation({
    mutationFn: () => enregistrerSuiviPresenceCulte(familleId, { typeCulte, dateCulte, membres }),
    onSuccess: (resultat) => {
      setMembres(resultat.membres)
      setPersonneEnEditionId(null)
      setErreurJustification(false)
      setMessageActionMasse('')
      queryClient.setQueryData(['familles-disciples', familleId, 'presences', typeCulte, dateCulte], resultat)
      void queryClient.invalidateQueries({ queryKey: ['familles-disciples', familleId, 'presences'] })
      onSaved(resultat)
    },
  })
  const nouveaux = membres.filter((membre) => membre.nouveauVenu)
  const absents = membres.filter((membre) => membre.statutPresence === 'absent' || membre.statutPresence === 'excuse')
  const aConfirmerDimanche = nouveaux.filter((membre) => membre.presenceDimancheSuivant == null).length
  const termeMembre = normaliserRecherche(rechercheMembre)
  const membresFiltres = membres.filter((membre) => {
    const nom = normaliserRecherche(`${membre.prenom} ${membre.nom} ${membre.telephone ?? ''}`)
    const correspondRecherche = !termeMembre || nom.includes(termeMembre)
    const correspondFiltre = filtreSuivi === 'tous'
      || (filtreSuivi === 'nouveaux' && membre.nouveauVenu)
      || (filtreSuivi === 'absents' && (membre.statutPresence === 'absent' || membre.statutPresence === 'excuse'))
      || (filtreSuivi === 'a_confirmer' && membre.nouveauVenu && membre.presenceDimancheSuivant == null)
    return correspondRecherche && correspondFiltre
  }).sort((a, b) => Number(b.nouveauVenu) - Number(a.nouveauVenu)
    || normaliserRecherche(`${a.prenom} ${a.nom}`).localeCompare(normaliserRecherche(`${b.prenom} ${b.nom}`), 'fr-FR'))
  const nombrePages = Math.max(1, Math.ceil(membresFiltres.length / membresParPage))
  const pageCourante = Math.min(pageMembres, nombrePages)
  const membresVisibles = membresFiltres.slice((pageCourante - 1) * membresParPage, pageCourante * membresParPage)
  const personneEnEdition = membres.find((membre) => membre.idPersonne === personneEnEditionId) ?? null
  const personnesVisiblesIds = membresVisibles.map((membre) => membre.idPersonne)
  const pageEntiereSelectionnee = personnesVisiblesIds.length > 0
    && personnesVisiblesIds.every((idPersonne) => personnesSelectionnees.has(idPersonne))

  function updateMember(idPersonne: string, update: Partial<SuiviPresenceDisciple>) {
    setMembres((courant) => courant.map((membre) => membre.idPersonne === idPersonne ? { ...membre, ...update } : membre))
  }

  function basculerSelectionPersonne(idPersonne: string) {
    setPersonnesSelectionnees((courant) => {
      const prochain = new Set(courant)
      if (prochain.has(idPersonne)) prochain.delete(idPersonne)
      else prochain.add(idPersonne)
      return prochain
    })
  }

  function basculerSelectionPage(selectionner: boolean) {
    setPersonnesSelectionnees((courant) => {
      const prochain = new Set(courant)
      for (const idPersonne of personnesVisiblesIds) {
        if (selectionner) prochain.add(idPersonne)
        else prochain.delete(idPersonne)
      }
      return prochain
    })
  }

  function marquerTousPresents() {
    const nombreAMarquer = membres.filter((membre) => membre.statutPresence === 'a_confirmer').length
    setMembres((courant) => courant.map((membre) => membre.statutPresence === 'a_confirmer'
      ? { ...membre, statutPresence: 'present', justificationAbsence: null }
      : membre))
    setErreurJustification(false)
    setMessageActionMasse(nombreAMarquer > 0
      ? `${nombreAMarquer} personnes à confirmer sont marquées présentes. Les absences déjà saisies restent inchangées. Enregistre le suivi pour valider.`
      : 'Aucune présence à confirmer. Les statuts déjà saisis restent inchangés.')
  }

  function marquerSelectionPresents() {
    const idsSelectionnes = new Set(personnesSelectionnees)
    const nombreSelectionne = idsSelectionnes.size
    setMembres((courant) => courant.map((membre) => idsSelectionnes.has(membre.idPersonne)
      ? { ...membre, statutPresence: 'present', justificationAbsence: null }
      : membre))
    setErreurJustification(false)
    setMessageActionMasse(`${nombreSelectionne} personne(s) sélectionnée(s) marquée(s) présente(s). Enregistre le suivi pour valider.`)
    setPersonnesSelectionnees(new Set())
  }

  function enregistrer() {
    const justificatifManquant = membres.some((membre) =>
      (membre.statutPresence === 'absent' || membre.statutPresence === 'excuse') && !membre.justificationAbsence?.trim(),
    )
    setErreurJustification(justificatifManquant)
    if (!justificatifManquant) enregistrement.mutate()
  }

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold text-slate-950">Présences et suivi des nouveaux venus</h2>
          <p className="mt-1 text-sm text-slate-600">Suivi des cultes du dimanche, du mercredi et du vendredi, avec confirmation pour le dimanche suivant.</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm text-slate-700"><CalendarDays className="size-4" />
            <Input aria-label="Date du culte" type="date" value={dateCulte} onChange={(event) => onDateCulteChange(event.target.value)} />
          </label>
          <Select aria-label="Jour du culte" value={typeCulte} onChange={(event) => onTypeCulteChange(event.target.value as TypeCulte)}>
            {SERVICES_CULTE.map((culte) => <option key={culte.id} value={culte.id}>{culte.label}</option>)}
          </Select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Membres suivis</p><p className="mt-1 text-xl font-semibold text-slate-900">{membres.length}</p></div>
        <div className="rounded-xl bg-amber-50 p-3"><p className="text-xs text-amber-800">Absences à justifier</p><p className="mt-1 text-xl font-semibold text-amber-900">{absents.length}</p></div>
        <div className="rounded-xl bg-sky-50 p-3"><p className="text-xs text-sky-800">Nouveaux venus à confirmer pour dimanche</p><p className="mt-1 text-xl font-semibold text-sky-900">{aConfirmerDimanche}</p></div>
      </div>

      {presenceQuery.data?.dateDimancheSuivant && nouveaux.length > 0 && (
        <p className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
          Prochain objectif de présence des nouveaux venus : le dimanche {dateLisible(presenceQuery.data.dateDimancheSuivant)}.
        </p>
      )}

      {presenceQuery.isError && <Alert variant="error" title="Impossible de charger le suivi">{presenceQuery.error.message}</Alert>}
      {enregistrement.isError && <Alert variant="error" title="Suivi non enregistré">{enregistrement.error.message}</Alert>}
      {erreurJustification && <Alert variant="warning" title="Justification requise">Ajoutez une justification pour chaque membre absent ou excusé.</Alert>}
      {!presenceQuery.isLoading && membres.length > 0 && (
        <div className="flex flex-wrap items-end gap-3 rounded-xl bg-slate-50 p-3">
          <label className="flex min-w-[13rem] flex-[1_1_13rem] flex-col gap-1.5 text-xs font-medium text-slate-600">
            Rechercher une personne
            <Input type="search" value={rechercheMembre} onChange={(event) => { setRechercheMembre(event.target.value); setPageMembres(1) }} placeholder="Nom, prénom ou téléphone" />
          </label>
          <label className="flex min-w-[13rem] flex-[1_1_13rem] flex-col gap-1.5 text-xs font-medium text-slate-600">
            Filtrer le suivi
            <Select value={filtreSuivi} onChange={(event) => { setFiltreSuivi(event.target.value); setPageMembres(1) }}>
              <option value="tous">Toutes les personnes</option>
              <option value="nouveaux">Nouveaux venus</option>
              <option value="absents">Absents ou excusés</option>
              <option value="a_confirmer">Présence à confirmer</option>
            </Select>
          </label>
          <p className="whitespace-nowrap pb-2 text-xs text-slate-500" aria-live="polite">
            {membresFiltres.length === 0 ? 'Aucun résultat' : `${(pageCourante - 1) * membresParPage + 1}–${Math.min(pageCourante * membresParPage, membresFiltres.length)} sur ${membresFiltres.length}`}
          </p>
          <Button type="button" variant="secondary" size="sm" className="h-10 whitespace-nowrap" onClick={() => {
            if (modeSelection) setPersonnesSelectionnees(new Set())
            setModeSelection(!modeSelection)
          }}>
            {modeSelection ? 'Terminer' : 'Mode sélection'}
          </Button>
          {modeSelection && (
            <label className="flex h-10 items-center gap-2 whitespace-nowrap px-1 text-sm text-slate-700">
              <input type="checkbox" checked={pageEntiereSelectionnee} onChange={(event) => basculerSelectionPage(event.target.checked)} className="size-4 rounded border-slate-300 text-brand-700 focus:ring-brand-500" />
              Cette page
            </label>
          )}
          {modeSelection && personnesSelectionnees.size > 0 && (
            <>
              <span className="whitespace-nowrap text-xs font-medium text-slate-600" aria-live="polite">{personnesSelectionnees.size} choisie(s)</span>
              <Button type="button" size="sm" className="h-10 whitespace-nowrap" title="Marquer les personnes sélectionnées comme présentes" onClick={marquerSelectionPresents} disabled={enregistrement.isPending}>
                <Check className="size-4" />Marquer présents
              </Button>
            </>
          )}
          <Button type="button" variant="secondary" size="sm" className="h-10 whitespace-nowrap" onClick={marquerTousPresents} disabled={enregistrement.isPending}>
              <Check className="size-4" />Confirmer les présences
          </Button>
        </div>
      )}
      {messageActionMasse && <p className="rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-800" role="status">{messageActionMasse}</p>}
      {presenceQuery.isLoading ? <p className="py-6 text-center text-sm text-slate-500">Chargement des présences…</p> : membres.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-600">Aucun membre actif à suivre pour ce culte.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {membresFiltres.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-600">Aucune personne ne correspond à ces critères.</p>
          ) : (
            <>
          <div className="overflow-hidden rounded-xl border border-slate-200 divide-y divide-slate-100">
            {membresVisibles.map((membre) => (
              <div key={membre.idPersonne} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50">
                {modeSelection && <input type="checkbox" aria-label={`Sélectionner ${membre.prenom} ${membre.nom}`} checked={personnesSelectionnees.has(membre.idPersonne)} onChange={() => basculerSelectionPersonne(membre.idPersonne)} className="size-4 shrink-0 rounded border-slate-300 text-brand-700 focus:ring-brand-500" />}
                <button type="button" onClick={() => { setPersonneEnEditionId(membre.idPersonne); enregistrement.reset() }} className="flex min-w-0 flex-1 items-center justify-between gap-4 text-left">
                  <span className="flex min-w-0 flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3">
                    <span className="truncate font-medium text-slate-900">{membre.prenom} {membre.nom}</span>
                    {membre.nouveauVenu && <Tag tone="green">Nouveau venu</Tag>}
                    {membre.telephone && <span className="text-xs text-slate-500">{membre.telephone}</span>}
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <Tag tone={membre.statutPresence === 'present' ? 'green' : membre.statutPresence === 'a_confirmer' ? 'blue' : 'amber'}>{PRESENCE_LABELS_COURTES[membre.statutPresence]}</Tag>
                    <ChevronRight className="size-4 text-slate-400" aria-hidden="true" />
                  </span>
                </button>
              </div>
            ))}
          </div>
          {nombrePages > 1 && (
            <nav className="flex flex-wrap items-center justify-between gap-3 pt-1" aria-label="Pagination des personnes suivies">
              <p className="text-sm text-slate-500">Page {pageCourante} sur {nombrePages}</p>
              <div className="flex items-center gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => setPageMembres(pageCourante - 1)} disabled={pageCourante <= 1}>
                  Précédent
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={() => setPageMembres(pageCourante + 1)} disabled={pageCourante >= nombrePages}>
                  Suivant
                </Button>
              </div>
            </nav>
          )}
            </>
          )}
          <div className="flex justify-end pt-1">
            <Button type="button" onClick={enregistrer} isLoading={enregistrement.isPending}><Save className="size-4" />Enregistrer le suivi</Button>
          </div>
        </div>
      )}
      <Dialog open={Boolean(personneEnEdition)} onOpenChange={(open) => { if (!open) { setPersonneEnEditionId(null); enregistrement.reset() } }}>
        {personneEnEdition && (
          <DialogContent
            title={`Suivi de ${personneEnEdition.prenom} ${personneEnEdition.nom}`}
            description={`${SERVICES_CULTE.find((culte) => culte.id === typeCulte)?.label ?? 'Culte'} du ${dateLisible(dateCulte)}.`}
          >
            {enregistrement.isError && <Alert variant="error" title="Suivi non enregistré">{enregistrement.error.message}</Alert>}
            {erreurJustification && <Alert variant="warning" title="Justification requise">Ajoutez une justification pour chaque membre absent ou excusé.</Alert>}
            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-800">
                Présence au culte
                <Select aria-label={`Présence de ${personneEnEdition.prenom} ${personneEnEdition.nom}`} value={personneEnEdition.statutPresence} onChange={(event) => {
                  const statutPresence = event.target.value as StatutPresenceDisciple
                  updateMember(personneEnEdition.idPersonne, {
                    statutPresence,
                    ...(statutPresence === 'present' ? { justificationAbsence: null } : {}),
                  })
                }}>
                  {(Object.keys(PRESENCE_LABELS) as StatutPresenceDisciple[]).map((statut) => <option key={statut} value={statut}>{PRESENCE_LABELS[statut]}</option>)}
                </Select>
              </label>
              {(personneEnEdition.statutPresence === 'absent' || personneEnEdition.statutPresence === 'excuse') && (
                <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-800">
                  Rapport / justification de l’absence
                  <textarea aria-label={`Rapport d’absence de ${personneEnEdition.prenom} ${personneEnEdition.nom}`} rows={3} value={personneEnEdition.justificationAbsence ?? ''} onChange={(event) => updateMember(personneEnEdition.idPersonne, { justificationAbsence: event.target.value })} placeholder="Motif et compte rendu du suivi" className="min-h-24 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
                </label>
              )}
              {personneEnEdition.nouveauVenu && (
                <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-800">
                  Présence dimanche prochain
                  <Select aria-label={`Confirmation dimanche prochain de ${personneEnEdition.prenom} ${personneEnEdition.nom}`} value={personneEnEdition.presenceDimancheSuivant == null ? '' : personneEnEdition.presenceDimancheSuivant ? 'oui' : 'non'} onChange={(event) => updateMember(personneEnEdition.idPersonne, { presenceDimancheSuivant: event.target.value === '' ? null : event.target.value === 'oui' })}>
                    <option value="">À confirmer</option><option value="oui">Confirmée</option><option value="non">Pas encore confirmée</option>
                  </Select>
                </label>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => { setPersonneEnEditionId(null); enregistrement.reset() }}>Fermer</Button>
                <Button type="button" onClick={enregistrer} isLoading={enregistrement.isPending}><Save className="size-4" />Enregistrer le suivi</Button>
              </div>
              <p className="text-xs text-slate-500">L’enregistrement applique les changements au suivi de ce culte pour toute la famille.</p>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </section>
  )
}

function RapportAuditPanel({ rapports }: { rapports: RapportAudit[] }) {
  const [rapportOuvert, setRapportOuvert] = useState<RapportAudit | null>(null)
  const [rechercheMembre, setRechercheMembre] = useState('')
  const [filtrePresence, setFiltrePresence] = useState('tous')
  const membres = rapportOuvert?.suivi.membres ?? []
  const termeRecherche = normaliserRecherche(rechercheMembre)
  const membresFiltres = membres.filter((membre) => {
    const texte = normaliserRecherche([
      membre.prenom,
      membre.nom,
      membre.justificationAbsence,
      PRESENCE_LABELS_COURTES[membre.statutPresence],
    ].filter(Boolean).join(' '))
    const correspondRecherche = !termeRecherche || texte.includes(termeRecherche)
    const correspondFiltre = filtrePresence === 'tous'
      || (filtrePresence === 'nouveaux' && membre.nouveauVenu)
      || (filtrePresence === 'present' && membre.statutPresence === 'present')
      || (filtrePresence === 'absent' && membre.statutPresence === 'absent')
      || (filtrePresence === 'excuse' && membre.statutPresence === 'excuse')
      || (filtrePresence === 'a_confirmer' && membre.statutPresence === 'a_confirmer')
    return correspondRecherche && correspondFiltre
  })

  function ouvrirRapport(rapport: RapportAudit) {
    setRapportOuvert(rapport)
    setRechercheMembre('')
    setFiltrePresence('tous')
  }

  return (
    <>
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white/80 shadow-sm">
        {rapports.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-600">Aucun rapport dans cette session. Enregistre un suivi de culte pour le générer.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {rapports.map((rapport) => (
              <li key={rapport.cle}>
                <button type="button" onClick={() => ouvrirRapport(rapport)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-brand-600">
                  <span>
                    <span className="block font-semibold text-slate-900">{rapport.titre}</span>
                    <span className="mt-1 block text-sm text-slate-500">{dateLisible(rapport.dateCulte)}</span>
                  </span>
                  <ChevronRight className="size-5 shrink-0 text-slate-400" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <Dialog open={Boolean(rapportOuvert)} onOpenChange={(open) => { if (!open) setRapportOuvert(null) }}>
        {rapportOuvert && (
          <DialogContent
            title={rapportOuvert.titre}
            description={dateLisible(rapportOuvert.dateCulte) ?? rapportOuvert.dateCulte}
            className="max-w-6xl"
          >
            <div className="grid gap-3 sm:grid-cols-[minmax(15rem,1fr)_minmax(13rem,0.6fr)]">
              <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-600">
                Rechercher une personne ou un rapport
                <Input type="search" value={rechercheMembre} onChange={(event) => setRechercheMembre(event.target.value)} placeholder="Nom ou justification" />
              </label>
              <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-600">
                Filtrer la liste
                <Select value={filtrePresence} onChange={(event) => setFiltrePresence(event.target.value)}>
                  <option value="tous">Toutes les personnes</option>
                  <option value="nouveaux">Nouveaux venus</option>
                  <option value="present">Présents</option>
                  <option value="absent">Absents</option>
                  <option value="excuse">Excusés</option>
                  <option value="a_confirmer">À confirmer</option>
                </Select>
              </label>
            </div>
            <div className="mt-4 max-h-[56vh] overflow-auto rounded-xl border border-slate-200">
              {membresFiltres.length === 0 ? (
                <p className="p-6 text-center text-sm text-slate-600">Aucun résultat pour ces filtres.</p>
              ) : (
                <table className="w-full min-w-[850px] text-left text-sm">
                  <thead className="sticky top-0 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th scope="col" className="px-4 py-3 font-semibold">Personne</th>
                      <th scope="col" className="px-4 py-3 font-semibold">Situation à l’église</th>
                      <th scope="col" className="px-4 py-3 font-semibold">Présence</th>
                      <th scope="col" className="px-4 py-3 font-semibold">Dimanche suivant</th>
                      <th scope="col" className="px-4 py-3 font-semibold">Rapport / justification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {membresFiltres.map((membre) => (
                      <tr key={membre.idPersonne}>
                        <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">{membre.prenom} {membre.nom}</td>
                        <td className="px-4 py-3">{membre.nouveauVenu ? <Tag tone="green">Nouveau venu</Tag> : 'Déjà membre de l’église'}</td>
                        <td className="px-4 py-3"><Tag tone={membre.statutPresence === 'present' ? 'green' : membre.statutPresence === 'a_confirmer' ? 'blue' : 'amber'}>{PRESENCE_LABELS_COURTES[membre.statutPresence]}</Tag></td>
                        <td className="px-4 py-3">{membre.nouveauVenu ? membre.presenceDimancheSuivant === true ? 'Confirmée' : membre.presenceDimancheSuivant === false ? 'Non confirmée' : 'À confirmer' : '—'}</td>
                        <td className="max-w-sm px-4 py-3 text-slate-600">{membre.justificationAbsence?.trim() || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  )
}

function PreparationCultePanel({
  familleId,
  dateCulte,
  onDateCulteChange,
}: {
  familleId: string
  dateCulte: string
  onDateCulteChange: (date: string) => void
}) {
  const queryClient = useQueryClient()
  const [departements, setDepartements] = useState<ChecklistDepartementCulte[]>([])
  const checklistQueryKey = ['familles-disciples', familleId, 'checklist', dateCulte] as const
  const checklistQuery = useQuery({
    queryKey: checklistQueryKey,
    queryFn: () => getChecklistPreparationCulte(familleId, dateCulte),
    enabled: Boolean(dateCulte),
  })
  const departementsQuery = useDepartements({ page: 1, limit: 100 })
  useEffect(() => {
    if (!checklistQuery.data) return
    const sauvegardes = new Map(checklistQuery.data.departements.map((item) => [item.idDepartement, item]))
    const lignes = (departementsQuery.data?.data ?? []).filter((item) => item.actif).map((item) => {
      const enregistre = sauvegardes.get(item.idDepartement)
      return enregistre ?? { idDepartement: item.idDepartement, nomDepartement: item.nom, pret: false, commentaire: '' }
    })
    setDepartements(lignes)
  }, [checklistQuery.data, departementsQuery.data])
  const enregistrer = useMutation({
    mutationFn: () => enregistrerChecklistPreparationCulte(familleId, { dateCulte, departements }),
    onSuccess: (resultat) => {
      setDepartements(resultat.departements)
      queryClient.setQueryData(checklistQueryKey, resultat)
      void queryClient.invalidateQueries({ queryKey: ['familles-disciples', familleId, 'checklist'] })
    },
  })
  function modifier(idDepartement: string, update: Partial<ChecklistDepartementCulte>) {
    const actualises = departements.map((item) => item.idDepartement === idDepartement ? { ...item, ...update } : item)
    setDepartements(actualises)
    queryClient.setQueryData<ChecklistPreparationCulte>(checklistQueryKey, (courante) => ({
      dateCulte,
      departements: actualises,
      ...(courante?.modeSimulation === undefined ? {} : { modeSimulation: courante.modeSimulation }),
    }))
  }

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold text-slate-950">Préparation du culte</h2>
          <p className="mt-1 text-sm text-slate-600">Cochez la préparation de chaque département pour le culte choisi.</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700"><CalendarDays className="size-4" />
          <Input aria-label="Date du culte à préparer" type="date" value={dateCulte} onChange={(event) => onDateCulteChange(event.target.value)} />
        </label>
      </div>
      {checklistQuery.isError && <Alert variant="error" title="Impossible de charger la checklist">{checklistQuery.error.message}</Alert>}
      {departementsQuery.isError && <Alert variant="error" title="Impossible de charger les départements">{departementsQuery.error.message}</Alert>}
      {enregistrer.isError && <Alert variant="error" title="Checklist non enregistrée">{enregistrer.error.message}</Alert>}
      {checklistQuery.isLoading || departementsQuery.isLoading ? <p className="py-6 text-center text-sm text-slate-500">Chargement des départements…</p> : departements.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-600">Aucun département actif à préparer.</p>
      ) : (
        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
          {departements.map((item) => (
            <div key={item.idDepartement} className="grid gap-3 p-4 sm:grid-cols-[minmax(14rem,1fr)_minmax(16rem,1.4fr)] sm:items-center">
              <label className="flex items-center gap-3 text-sm font-medium text-slate-900">
                <input type="checkbox" checked={item.pret} onChange={(event) => modifier(item.idDepartement, { pret: event.target.checked })} className="size-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                <span>{item.nomDepartement}</span>
                {item.pret && <Check className="size-4 text-emerald-700" aria-hidden="true" />}
              </label>
              <Input aria-label={`Commentaire ${item.nomDepartement}`} value={item.commentaire ?? ''} onChange={(event) => modifier(item.idDepartement, { commentaire: event.target.value })} placeholder="Commentaire ou point à régler" />
            </div>
          ))}
        </div>
      )}
      <div className="flex justify-end">
        <Button type="button" onClick={() => enregistrer.mutate()} isLoading={enregistrer.isPending} disabled={departements.length === 0}><ClipboardCheck className="size-4" />Enregistrer la checklist</Button>
      </div>
    </section>
  )
}

export function FamilleDiscipleOperations({
  famille,
  datePreparationCulte: datePreparationCulteControlee,
  onDatePreparationCulteChange,
}: {
  famille: FamilleDisciple
  datePreparationCulte?: string
  onDatePreparationCulteChange?: (date: string) => void
}) {
  const [section, setSection] = useState<'membres' | 'suivi' | 'preparation' | 'audit'>('membres')
  const [admissionOpen, setAdmissionOpen] = useState(false)
  const [dateCulte, setDateCulte] = useState(dateLocale())
  const [typeCulte, setTypeCulte] = useState<TypeCulte>('dimanche')
  const [datePreparationLocale, setDatePreparationLocale] = useState(dateLocale())
  const datePreparationCulte = datePreparationCulteControlee ?? datePreparationLocale
  const changerDatePreparationCulte = onDatePreparationCulteChange ?? setDatePreparationLocale
  const [rapportsAudit, setRapportsAudit] = useState<RapportAudit[]>([])
  const tabs = [
    { id: 'membres' as const, label: 'Membres et accueil' },
    { id: 'suivi' as const, label: 'Suivi des cultes' },
    { id: 'preparation' as const, label: 'Préparation du culte' },
    { id: 'audit' as const, label: 'Rapport d’audit' },
  ]

  function enregistrerRapport(suivi: SuiviPresenceCulte) {
    const cle = `${suivi.dateCulte}:${suivi.typeCulte}`
    const libelleCulte = SERVICES_CULTE.find((culte) => culte.id === suivi.typeCulte)?.label.toLowerCase() ?? 'culte'
    const rapport: RapportAudit = {
      cle,
      titre: `Rapport du culte du ${libelleCulte}`,
      dateCulte: suivi.dateCulte,
      typeCulte: suivi.typeCulte,
      suivi,
    }
    setRapportsAudit((courants) => [rapport, ...courants.filter((item) => item.cle !== cle)])
    setDateCulte(suivi.dateCulte)
    setTypeCulte(suivi.typeCulte)
    setSection('audit')
  }

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" aria-label="Gestion de la Famille des Disciples" className="flex flex-wrap gap-2 border-b border-slate-200">
        {tabs.map((tab) => (
          <button key={tab.id} type="button" role="tab" aria-selected={section === tab.id} onClick={() => setSection(tab.id)} className={`border-b-2 px-3 py-3 text-sm font-medium ${section === tab.id ? 'border-gerbe-or text-slate-950' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
            {tab.label}
          </button>
        ))}
      </div>
      {section === 'membres' && <FamilleMembresPanel famille={famille} onAdmettre={() => setAdmissionOpen(true)} />}
      {section === 'suivi' && <SuiviCultesPanel familleId={famille.idFamilleDisciple} dateCulte={dateCulte} onDateCulteChange={setDateCulte} typeCulte={typeCulte} onTypeCulteChange={setTypeCulte} onSaved={enregistrerRapport} />}
      {section === 'preparation' && <PreparationCultePanel familleId={famille.idFamilleDisciple} dateCulte={datePreparationCulte} onDateCulteChange={changerDatePreparationCulte} />}
      {section === 'audit' && <RapportAuditPanel rapports={rapportsAudit} />}
      <AdmissionNouveauVenuDialog famille={famille} open={admissionOpen} onOpenChange={setAdmissionOpen} />
    </div>
  )
}

export function FamilleDisciplePersonneCard({ personneId }: { personneId: string }) {
  const query = useQuery({
    queryKey: ['personnes', 'famille-disciple', personneId],
    queryFn: () => getFamilleDiscipleDePersonne(personneId),
  })
  return (
    <section className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm">
      <h2 className="font-semibold text-slate-950">Famille des Disciples d’accueil</h2>
      {query.isLoading && <p className="mt-2 text-sm text-slate-500">Chargement de la famille d’accueil…</p>}
      {query.isError && <Alert className="mt-3" variant="error" title="Famille d’accueil indisponible">{query.error.message}</Alert>}
      {query.isSuccess && query.data && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-900">{query.data.nomFamilleDisciple}</p>
            {query.data.nouveauVenu && <p className="mt-1 text-xs text-emerald-700">Nouveau venu accueilli le {query.data.dateAccueil}</p>}
            {query.data.modeSimulation && <p className="mt-1 text-xs font-medium text-sky-700">Donnée de démonstration · non enregistrée</p>}
          </div>
          <Link className="text-sm font-semibold text-brand-700 hover:underline" to={`/familles-disciples/${query.data.idFamilleDisciple}`}>Ouvrir la famille</Link>
        </div>
      )}
      {query.isSuccess && !query.data && <p className="mt-2 text-sm text-slate-600">Aucune famille d’accueil enregistrée pour cette personne.</p>}
    </section>
  )
}
