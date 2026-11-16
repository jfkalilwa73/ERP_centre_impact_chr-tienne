import { useEffect, useState, useSyncExternalStore, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { listFamillesDisciples } from '@/features/familles-disciples/api'
import {
  enregistrerNouveauIntegre,
  listerNouveauxIntegres,
  subscribeNouveauxIntegres,
  versionNouveauxIntegres,
} from '@/features/familles-disciples/integrationNouveaux'
import {
  getDepartementIntegrationId,
  getDepartementGestionPersonnes,
  setDepartementGestionPersonnes,
  setDepartementIntegrationId,
  subscribeDepartementIntegration,
} from './integrationDepartment'

function dateKinshasa() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Kinshasa', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date())
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]))
  return `${values.year}-${values.month}-${values.day}`
}

export function IntegrationAccueilPanel({
  departementId,
  departementNom,
  canConfigure,
}: {
  departementId: string
  departementNom: string
  canConfigure: boolean
}) {
  const departementIntegrationId = useSyncExternalStore(
    subscribeDepartementIntegration,
    getDepartementIntegrationId,
    getDepartementIntegrationId,
  )
  const estDepartementIntegration = departementIntegrationId === departementId
  const departementGestionPersonnes = useSyncExternalStore(
    subscribeDepartementIntegration,
    getDepartementGestionPersonnes,
    getDepartementGestionPersonnes,
  )
  const estDepartementGestionPersonnes = departementGestionPersonnes?.id === departementId
  const famillesQuery = useQuery({ queryKey: ['familles-disciples'], queryFn: listFamillesDisciples })
  const [familleId, setFamilleId] = useState('')
  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [telephone, setTelephone] = useState('')
  const [dateAccueil, setDateAccueil] = useState(dateKinshasa)
  const [commentaire, setCommentaire] = useState('')
  const [erreur, setErreur] = useState('')
  const [enregistre, setEnregistre] = useState(false)
  useSyncExternalStore(subscribeNouveauxIntegres, versionNouveauxIntegres, versionNouveauxIntegres)
  const familles = famillesQuery.data?.data.filter((famille) => famille.statut === 'actif') ?? []
  const accueils = listerNouveauxIntegres().filter((item) => item.idDepartementIntegration === departementId)

  if (!estDepartementIntegration && !canConfigure) return null

  useEffect(() => {
    if (!familleId && familles.length) setFamilleId(familles[0]!.idFamilleDisciple)
  }, [familles, familleId])

  function enregistrer(event: FormEvent) {
    event.preventDefault()
    const famille = familles.find((item) => item.idFamilleDisciple === familleId)
    if (!famille) return
    try {
      enregistrerNouveauIntegre({
        idFamilleDisciple: famille.idFamilleDisciple,
        nomFamille: famille.nom,
        prenom: prenom.trim(),
        nom: nom.trim(),
        telephone: telephone.trim(),
        dateAccueil,
        commentaire: commentaire.trim(),
        idDepartementIntegration: departementId,
        nomDepartementIntegration: departementNom,
      })
      setPrenom('')
      setNom('')
      setTelephone('')
      setCommentaire('')
      setErreur('')
      setEnregistre(true)
      window.setTimeout(() => setEnregistre(false), 4_000)
    } catch {
      setErreur('Impossible d’enregistrer cet accueil pour le moment.')
    }
  }

  return (
    <div className="mt-6 flex flex-col gap-5">
      {canConfigure && <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-4">
          <h2 className="font-semibold text-slate-950">Rôles dans le parcours des nouveaux</h2>
          <p className="mt-1 text-sm text-slate-600">Attribuez ces fonctions à vos départements, quel que soit leur nom personnalisé.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-6">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
            <input type="checkbox" checked={estDepartementIntegration} onChange={(event) => setDepartementIntegrationId(event.target.checked ? departementId : null)} className="size-4 rounded border-slate-300 text-brand-700" />
            Chargé de l’accueil et de l’Intégration
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
            <input type="checkbox" checked={estDepartementGestionPersonnes} onChange={(event) => setDepartementGestionPersonnes(event.target.checked ? { id: departementId, nom: departementNom } : null)} className="size-4 rounded border-slate-300 text-brand-700" />
            Chargé de créer les fiches Personnes
          </label>
        </div>
      </section>}
      {estDepartementIntegration && <>
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-4">
          <h2 className="font-semibold text-slate-950">Nouveaux accueillis</h2>
          <p className="mt-1 text-sm text-slate-600">Saisissez les coordonnées recueillies par l’Intégration et transmettez la personne à la famille programmée pour son suivi.</p>
        </div>
        {erreur && <Alert variant="error" title="Accueil non enregistré">{erreur}</Alert>}
        {enregistre && <Alert variant="success" title="Accueil enregistré">La personne apparaît maintenant dans le suivi de la famille sélectionnée.</Alert>}
        {famillesQuery.isError && <Alert variant="error" title="Familles indisponibles">Impossible de charger les familles actives.</Alert>}
        <form className="grid gap-4 md:grid-cols-2" onSubmit={enregistrer}>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-800">Prénom<Input value={prenom} onChange={(event) => setPrenom(event.target.value)} required maxLength={100} /></label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-800">Nom<Input value={nom} onChange={(event) => setNom(event.target.value)} required maxLength={100} /></label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-800">Téléphone<Input type="tel" value={telephone} onChange={(event) => setTelephone(event.target.value)} maxLength={20} placeholder="+243 …" /></label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-800">Date du premier accueil<Input type="date" value={dateAccueil} onChange={(event) => setDateAccueil(event.target.value)} required /></label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-800 md:col-span-2">Famille programmée pour le suivi<Select value={familleId} onChange={(event) => setFamilleId(event.target.value)} required disabled={familles.length === 0}>
            <option value="">Choisir une famille</option>
            {familles.map((famille) => <option key={famille.idFamilleDisciple} value={famille.idFamilleDisciple}>{famille.nom}</option>)}
          </Select></label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-800 md:col-span-2">Note utile au suivi familial<textarea value={commentaire} onChange={(event) => setCommentaire(event.target.value)} maxLength={500} rows={3} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900" placeholder="Disponibilités, point à reprendre avec la personne…" /></label>
          <div className="flex justify-end md:col-span-2"><Button type="submit" disabled={!familleId || !prenom.trim() || !nom.trim()}>{`Transmettre à la famille`}</Button></div>
        </form>
      </section>
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-slate-950">Registre des accueils transmis</h2>
        {accueils.length === 0 ? <p className="mt-3 text-sm text-slate-600">Aucun nouvel accueilli transmis pour le moment.</p> : <ul className="mt-3 divide-y divide-slate-100">
          {accueils.map((item) => <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
            <div><p className="font-medium text-slate-900">{item.prenom} {item.nom}</p><p className="text-slate-600">{item.telephone || 'Téléphone non renseigné'} · accueilli le {item.dateAccueil} · famille {item.nomFamille}</p></div>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.adhesionConfirmee ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-800'}`}>{item.adhesionConfirmee ? 'Adhésion confirmée · fiche à créer' : 'Suivi familial en cours'}</span>
          </li>)}
        </ul>}
      </section>
      </>}
    </div>
  )
}
