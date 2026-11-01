import { useMemo, useState, useSyncExternalStore } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Search, Trash2 } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogContent } from '@/components/ui/Dialog'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { createCompteWithRoles, listComptes, listCompteRoles, assignRoleToCompte } from '@/features/comptes/api'
import { listRoles } from '@/features/roles/api'
import {
  assignPersonneDepartement,
  listPersonneDepartements,
  unassignPersonneDepartement,
} from '@/features/personnes/api'
import { personneKeys } from '@/features/personnes/hooks'
import { errorId } from '@/lib/form'
import { ROLE_CODES } from '@/lib/roleCodes'
import { showSuccessFeedback } from '@/lib/successFeedback'
import { suggestedEgliseEmail } from './email'
import {
  canReplyCirculation,
  deleteCirculation,
  deleteCirculations,
  getCirculationsVersion,
  kindLabel,
  markCirculationsLues,
  repondreCirculation,
  subscribeCirculations,
  visibleCirculations,
} from './circulation'
import { useInboxScope } from './inbox'
import {
  filterCirculations,
  filterDemandes,
  inboxDepartements,
  INBOX_FILTERS,
} from './inboxFilter'
import { useSyncAlertes } from './useUnreadDemandes'
import {
  deleteDemande,
  getDemandesVersion,
  listDemandes,
  markDemandesLues,
  refuserDemandeSuperviseur,
  subscribeDemandes,
  traiterDemandeSuperviseur,
  type DemandeSuperviseur,
} from './store'

const ouvertureSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "L'adresse e-mail est obligatoire.")
    .pipe(z.email('Saisissez une adresse e-mail valide.')),
  motDePasse: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères.'),
})

type OuvertureValues = z.input<typeof ouvertureSchema>

function formatDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value),
  )
}

function statutLabel(statut: DemandeSuperviseur['statut']) {
  if (statut === 'en_attente') return 'En attente'
  if (statut === 'traitee') return 'Compte ouvert'
  return 'Refusée'
}

export function NotificationsPage() {
  const queryClient = useQueryClient()
  const { user, isAdmin, isPasteur, isDge, chefDepartementIds, superviseurDepartementIds } = useInboxScope()
  const canTreat = isAdmin
  useSyncAlertes()
  useSyncExternalStore(subscribeDemandes, getDemandesVersion, getDemandesVersion)
  useSyncExternalStore(subscribeCirculations, getCirculationsVersion, getCirculationsVersion)

  const [selected, setSelected] = useState<DemandeSuperviseur | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [reponses, setReponses] = useState<Record<string, string>>({})
  const [recherche, setRecherche] = useState('')
  const [typeFiltre, setTypeFiltre] = useState('')
  const [departementFiltre, setDepartementFiltre] = useState('')

  const inboxFilter = { q: recherche, kind: typeFiltre, departement: departementFiltre }
  const demandesBrutes = listDemandes().filter((demande) =>
    canTreat ? true : demande.idDemandeur === user?.personne.idPersonne,
  )
  const circulationsBrutes = user
    ? visibleCirculations({
        idPersonne: user.personne.idPersonne,
        isAdmin,
        isPasteur,
        isDge,
        superviseurDepartementIds,
        chefDepartementIds,
      })
    : []
  const circulations = filterCirculations(circulationsBrutes, inboxFilter)
  const demandes = filterDemandes(demandesBrutes, inboxFilter)
  const departementOptions = useMemo(
    () => inboxDepartements(circulationsBrutes, demandesBrutes),
    [circulationsBrutes, demandesBrutes],
  )
  const inboxEmpty = demandesBrutes.length === 0 && circulationsBrutes.length === 0
  const aucunResultat = !inboxEmpty && demandes.length === 0 && circulations.length === 0

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OuvertureValues>({
    resolver: zodResolver(ouvertureSchema),
    defaultValues: { email: '', motDePasse: '' },
  })

  const openTreat = (demande: DemandeSuperviseur) => {
    setErrorMessage(undefined)
    setSelected(demande)
    const [prenom, ...nomParts] = demande.nomCible.split(' ')
    reset({
      email: suggestedEgliseEmail(prenom ?? '', nomParts.join(' ')),
      motDePasse: '',
    })
  }

  const onTreat = handleSubmit(async (values) => {
    if (!selected) return
    setIsSubmitting(true)
    setErrorMessage(undefined)
    try {
      const rolesPage = await listRoles({ page: 1, limit: 100 })
      const roleCode =
        selected.roleCible === 'Chef' ? ROLE_CODES.CHEF_DEPARTEMENT : ROLE_CODES.SUPERVISEUR
      const roleCible = rolesPage.data.find((role) => role.code === roleCode)
      if (!roleCible) {
        throw new Error(
          selected.roleCible === 'Chef'
            ? 'Le rôle Chef de département est introuvable dans le catalogue.'
            : 'Le rôle Superviseur est introuvable dans le catalogue.',
        )
      }

      const comptes = await listComptes({ page: 1, limit: 100 })
      const existing = comptes.data.find((compte) => compte.idPersonne === selected.idPersonneCible)
      let email = existing?.email ?? values.email.trim()

      if (!existing) {
        await createCompteWithRoles(
          {
            idPersonne: selected.idPersonneCible,
            email,
            motDePasse: values.motDePasse,
            statut: 'actif',
          },
          [roleCible.idRole],
        )
      } else {
        email = existing.email
        const roles = await listCompteRoles(existing.idCompte)
        const deja = roles.some((role) => role.idRole === roleCible.idRole && role.actif)
        if (!deja) {
          await assignRoleToCompte(existing.idCompte, { idRole: roleCible.idRole })
        }
      }

      const affectations = await listPersonneDepartements(selected.idPersonneCible, true)
      const current = affectations.find((item) => item.idDepartement === selected.idDepartement)
      if (current) {
        await unassignPersonneDepartement(selected.idPersonneCible, selected.idDepartement)
      }
      await assignPersonneDepartement(selected.idPersonneCible, {
        idDepartement: selected.idDepartement,
        fonction: selected.roleCible,
      })

      if (!traiterDemandeSuperviseur(selected.id, email)) {
        throw new Error('La demande a déjà été traitée ou ne peut plus être modifiée.')
      }
      setSelected(null)
      void queryClient.invalidateQueries({ queryKey: personneKeys.affectations(selected.idPersonneCible) })
      void queryClient.invalidateQueries({ queryKey: ['comptes'] })
      showSuccessFeedback('Le compte a été créé et la demande traitée avec succès.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Traitement impossible.')
    } finally {
      setIsSubmitting(false)
    }
  })

  const onOpenInbox = () => {
    if (canTreat) markDemandesLues({ admin: true })
    else if (user) markDemandesLues({ idDemandeur: user.personne.idPersonne })
    if (user) markCirculationsLues(user.personne.idPersonne, circulationsBrutes)
  }

  const onReply = (id: string) => {
    if (!user) return
    const sent = repondreCirculation(
      id,
      {
        texte: reponses[id] ?? '',
        idAuteur: user.personne.idPersonne,
        nomAuteur: `${user.personne.prenom} ${user.personne.nom}`,
      },
      chefDepartementIds,
    )
    if (!sent) return
    setReponses((current) => ({ ...current, [id]: '' }))
    showSuccessFeedback('Votre réponse a bien été envoyée.')
  }

  const onClearAll = () => {
    let removed = deleteCirculations(circulationsBrutes.map((item) => item.id))
    demandes.forEach((demande) => {
      if (demande.statut !== 'en_attente' && deleteDemande(demande.id)) removed = true
    })
    if (removed) showSuccessFeedback('Les notifications ont bien été supprimées.')
  }

  return (
    <div className="flex flex-col gap-6" onFocus={onOpenInbox}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-900">Notifications</h1>
        {!inboxEmpty && (
          <Button type="button" variant="secondary" size="sm" onClick={onClearAll}>
            Tout effacer
          </Button>
        )}
      </div>

      {!inboxEmpty && (
        <form className="grid gap-2 sm:grid-cols-[1fr_12rem_14rem]" role="search">
          <div className="relative">
            <Search
              className="pointer-events-none absolute inset-y-0 left-3 my-auto size-4 text-slate-400"
              aria-hidden="true"
            />
            <Input
              value={recherche}
              onChange={(event) => setRecherche(event.target.value)}
              placeholder="Rechercher un titre, un département, un auteur…"
              aria-label="Rechercher dans les notifications"
              className="pl-9"
            />
          </div>
          <Select
            aria-label="Filtrer par type"
            value={typeFiltre}
            onChange={(event) => setTypeFiltre(event.target.value)}
          >
            {INBOX_FILTERS.map((item) => (
              <option key={item.value || 'tous'} value={item.value}>
                {item.label}
              </option>
            ))}
          </Select>
          <Select
            aria-label="Filtrer par département"
            value={departementFiltre}
            onChange={(event) => setDepartementFiltre(event.target.value)}
          >
            <option value="">Tous les départements</option>
            {departementOptions.map((nom) => (
              <option key={nom} value={nom}>
                {nom}
              </option>
            ))}
          </Select>
        </form>
      )}

      {aucunResultat && (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500">
          Aucune notification ne correspond à cette recherche.
        </p>
      )}

      {circulations.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-slate-900">Messages et alertes</h2>
          <ul className="flex flex-col gap-3">
            {circulations.map((item) => {
              const peutRepondre = canReplyCirculation(item, chefDepartementIds)
              return (
                <li key={item.id} className="border border-slate-200 bg-white px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs tracking-wide text-slate-500 uppercase">{kindLabel(item.kind)}</p>
                      <p className="mt-1 text-sm font-medium text-slate-900">{item.titre}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-slate-500 hover:bg-red-50 hover:text-red-700"
                      aria-label={`Supprimer ${item.titre}`}
                      onClick={() => {
                        if (deleteCirculation(item.id)) {
                          showSuccessFeedback('La notification a bien été supprimée.')
                        }
                      }}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.nomAuteur} · {item.nomDepartementSource} → {item.nomDepartementCible} ·{' '}
                    {formatDate(item.dateCreation)}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">{item.description}</p>
                  {item.reponses.length > 0 && (
                    <ul className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3">
                      {item.reponses.map((reponse) => (
                        <li key={reponse.id} className="text-sm text-slate-700">
                          <span className="font-medium text-slate-900">{reponse.nomAuteur}</span>
                          {' · '}
                          <span className="text-xs text-slate-400">{formatDate(reponse.date)}</span>
                          <p className="mt-0.5">{reponse.texte}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                  {peutRepondre ? (
                    <div className="mt-3 flex flex-col gap-2">
                      <textarea
                        value={reponses[item.id] ?? ''}
                        onChange={(event) =>
                          setReponses((current) => ({ ...current, [item.id]: event.target.value }))
                        }
                        aria-label="Réponse au message"
                        rows={2}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs"
                        placeholder="Répondre au nom du département destinataire"
                      />
                      <Button
                        size="sm"
                        className="self-end"
                        disabled={!(reponses[item.id] ?? '').trim()}
                        onClick={() => onReply(item.id)}
                      >
                        Répondre
                      </Button>
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-slate-500">
                      {item.kind === 'rappel'
                        ? 'Envoyé à chaque membre du département.'
                        : item.kind === 'compte_rendu'
                          ? 'Le responsable assigné renseigne les présences et le déroulement dans Activités.'
                          : 'Consultation uniquement. Seul le département destinataire peut répondre.'}
                    </p>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {inboxEmpty ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500">
          Aucune notification pour le moment.
        </p>
      ) : demandes.length === 0 ? null : (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-slate-900">Ouverture de comptes</h2>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Personne</th>
                <th className="px-4 py-3 font-medium">Rôle</th>
                <th className="px-4 py-3 font-medium">Département</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Demandeur</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {demandes.map((demande) => (
                <tr key={demande.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-slate-900">{demande.nomCible}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {demande.roleCible === 'Chef' ? 'Chef de département' : 'Superviseur'}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{demande.nomDepartement}</td>
                  <td className="hidden px-4 py-3 text-slate-600 sm:table-cell">
                    {demande.nomDemandeur}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <p>{statutLabel(demande.statut)}</p>
                    {demande.statut === 'traitee' && demande.emailCree && (
                      <p className="mt-0.5 text-xs text-slate-500">{demande.emailCree}</p>
                    )}
                    <p className="mt-0.5 text-xs text-slate-400">{formatDate(demande.dateCreation)}</p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {canTreat && demande.statut === 'en_attente' ? (
                      <div className="flex justify-end gap-1">
                        <Button size="sm" onClick={() => openTreat(demande)}>
                          Ouvrir le compte
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => {
                            if (refuserDemandeSuperviseur(demande.id)) {
                              showSuccessFeedback('La demande a bien été refusée.')
                            }
                          }}
                        >
                          Refuser
                        </Button>
                      </div>
                    ) : demande.statut !== 'en_attente' ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-slate-500 hover:bg-red-50 hover:text-red-700"
                        aria-label={`Supprimer la demande ${demande.nomCible}`}
                        onClick={() => {
                          if (deleteDemande(demande.id)) {
                            showSuccessFeedback('La demande a bien été supprimée.')
                          }
                        }}
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </Button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      )}

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent
          title={
            selected?.roleCible === 'Chef'
              ? 'Ouvrir le compte chef de département'
              : 'Ouvrir le compte superviseur'
          }
          description="L’e-mail et le mot de passe seront ceux de la première connexion. Le DGE recevra la confirmation."
        >
          <form onSubmit={onTreat} noValidate className="flex flex-col gap-4">
            {errorMessage && (
              <Alert variant="error" title="Ouverture impossible">
                {errorMessage}
              </Alert>
            )}
            <p className="text-sm text-slate-600">
              {selected?.nomCible} — {selected?.nomDepartement}
            </p>
            <FormField id="ouverture-email" label="Adresse e-mail" error={errors.email?.message}>
              <Input
                id="ouverture-email"
                type="email"
                hasError={Boolean(errors.email)}
                aria-describedby={errors.email ? errorId('ouverture-email') : undefined}
                {...register('email')}
              />
            </FormField>
            <FormField id="ouverture-mdp" label="Mot de passe" error={errors.motDePasse?.message}>
              <Input
                id="ouverture-mdp"
                type="password"
                autoComplete="new-password"
                hasError={Boolean(errors.motDePasse)}
                aria-describedby={errors.motDePasse ? errorId('ouverture-mdp') : undefined}
                {...register('motDePasse')}
              />
            </FormField>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setSelected(null)}>
                Annuler
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                Créer le compte et prévenir le demandeur
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
