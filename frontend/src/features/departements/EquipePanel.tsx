import { useState, useSyncExternalStore, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { PersonneAvatar } from '@/features/personnes/PersonneAvatar'
import type { AffectationDepartement, Personne } from '@/types'
import {
  addCreneauBenevole,
  assignCreneauBenevole,
  deleteCreneauBenevole,
  disponibiliteLabel,
  getEquipeVersion,
  getFicheEquipe,
  listCreneauxBenevoles,
  subscribeEquipe,
  upsertFicheEquipe,
  type Disponibilite,
} from './equipe'
import { personneName } from './personneName'
import { ROLES_DEPARTEMENT, roleDepartement, type RoleDepartement } from './roles'

type Membre = { personne: Personne; affectation: AffectationDepartement }

type EquipePanelProps = {
  departementId: string
  membres: Membre[]
  canAssign: boolean
  canManage: boolean
  isScoped: boolean
  busy: boolean
  unassigningId?: string
  onApplyRole: (personneId: string, role: RoleDepartement) => void
  onUnassign: (personneId: string) => void
}

const DISPONIBILITES: Disponibilite[] = ['disponible', 'partiel', 'indisponible']

export function EquipePanel({
  departementId,
  membres,
  canAssign,
  canManage,
  isScoped,
  busy,
  unassigningId,
  onApplyRole,
  onUnassign,
}: EquipePanelProps) {
  useSyncExternalStore(subscribeEquipe, getEquipeVersion, getEquipeVersion)
  const [besoin, setBesoin] = useState('')
  const [dateCreneau, setDateCreneau] = useState('')
  const creneaux = listCreneauxBenevoles(departementId)

  const onAddCreneau = (event: FormEvent) => {
    event.preventDefault()
    if (!besoin.trim() || !dateCreneau) return
    addCreneauBenevole(departementId, { date: dateCreneau, besoin })
    setBesoin('')
    setDateCreneau('')
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="overflow-hidden border border-slate-200 bg-white">
        {membres.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-slate-500">Aucun membre affecté.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Membre</th>
                <th className="px-4 py-3 font-medium">Rôle</th>
                <th className="px-4 py-3 font-medium">Responsabilité</th>
                <th className="px-4 py-3 font-medium">Disponibilité</th>
                {canAssign && <th className="px-4 py-3 text-right font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {membres.map(({ personne, affectation }) => {
                const fiche = getFicheEquipe(departementId, personne.idPersonne)
                return (
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
                          value={roleDepartement(affectation.fonction)}
                          disabled={busy}
                          onChange={(event) =>
                            onApplyRole(personne.idPersonne, event.target.value as RoleDepartement)
                          }
                        >
                          {ROLES_DEPARTEMENT.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </Select>
                      ) : (
                        roleDepartement(affectation.fonction)
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {canManage ? (
                        <Input
                          aria-label={`Responsabilité de ${personneName(personne)}`}
                          defaultValue={fiche?.responsabilite ?? ''}
                          placeholder="Ex. régie son"
                          onBlur={(event) =>
                            upsertFicheEquipe(departementId, {
                              idPersonne: personne.idPersonne,
                              responsabilite: event.target.value,
                              disponibilite: fiche?.disponibilite ?? 'disponible',
                            })
                          }
                        />
                      ) : (
                        <span className="text-slate-600">{fiche?.responsabilite || '—'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {canManage ? (
                        <Select
                          aria-label={`Disponibilité de ${personneName(personne)}`}
                          value={fiche?.disponibilite ?? 'disponible'}
                          onChange={(event) =>
                            upsertFicheEquipe(departementId, {
                              idPersonne: personne.idPersonne,
                              responsabilite: fiche?.responsabilite ?? '',
                              disponibilite: event.target.value as Disponibilite,
                            })
                          }
                        >
                          {DISPONIBILITES.map((item) => (
                            <option key={item} value={item}>
                              {disponibiliteLabel(item)}
                            </option>
                          ))}
                        </Select>
                      ) : (
                        disponibiliteLabel(fiche?.disponibilite ?? 'disponible')
                      )}
                    </td>
                    {canAssign && (
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          isLoading={unassigningId === personne.idPersonne}
                          onClick={() => onUnassign(personne.idPersonne)}
                        >
                          Retirer
                        </Button>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Planification des bénévoles</h2>
          <p className="mt-1 text-xs text-slate-500">Créneaux à pourvoir pour les temps de service.</p>
        </div>
        {canManage && (
          <form onSubmit={onAddCreneau} className="grid gap-3 border border-slate-200 bg-white p-4 sm:grid-cols-3">
            <Input
              type="date"
              value={dateCreneau}
              onChange={(event) => setDateCreneau(event.target.value)}
              aria-label="Date du créneau"
            />
            <Input
              value={besoin}
              onChange={(event) => setBesoin(event.target.value)}
              placeholder="Besoin (choeur, son, accueil…)"
              aria-label="Besoin du créneau"
            />
            <Button type="submit" disabled={!besoin.trim() || !dateCreneau}>
              <Plus className="size-4" aria-hidden="true" />
              Planifier
            </Button>
          </form>
        )}
        {creneaux.length === 0 ? (
          <p className="border border-dashed border-slate-300 bg-white px-6 py-8 text-center text-sm text-slate-500">
            Aucun créneau bénévole pour le moment.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {creneaux.map((creneau) => (
              <li
                key={creneau.id}
                className="flex flex-wrap items-center justify-between gap-3 border border-slate-200 bg-white px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">{creneau.besoin}</p>
                  <p className="text-xs text-slate-500">
                    {new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(creneau.date))}
                    {creneau.nomPersonne ? ` · ${creneau.nomPersonne}` : ' · Non pourvu'}
                  </p>
                </div>
                {canManage && (
                  <div className="flex items-center gap-2">
                    <Select
                      aria-label={`Bénévole pour ${creneau.besoin}`}
                      value={creneau.idPersonne ?? ''}
                      onChange={(event) => {
                        const membre = membres.find((item) => item.personne.idPersonne === event.target.value)
                        assignCreneauBenevole(departementId, creneau.id, {
                          idPersonne: event.target.value,
                          nomPersonne: membre ? personneName(membre.personne) : '',
                        })
                      }}
                    >
                      <option value="">Choisir un bénévole</option>
                      {membres.map(({ personne }) => (
                        <option key={personne.idPersonne} value={personne.idPersonne}>
                          {personneName(personne)}
                        </option>
                      ))}
                    </Select>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      aria-label="Supprimer le créneau"
                      onClick={() => deleteCreneauBenevole(departementId, creneau.id)}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
