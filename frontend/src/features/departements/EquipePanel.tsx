import { useSyncExternalStore } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { PersonneAvatar } from '@/features/personnes/PersonneAvatar'
import type { AffectationDepartement, Personne } from '@/types'
import {
  disponibiliteLabel,
  getEquipeVersion,
  getFicheEquipe,
  subscribeEquipe,
  upsertFicheEquipe,
  type Disponibilite,
} from './equipe'
import { personneName } from './personneName'
import { isStructureRole, ROLES_EQUIPE, roleDepartement, type RoleDepartement } from './roles'

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
                      {canAssign && !isStructureRole(affectation.fonction) ? (
                        <Select
                          aria-label={`Rôle de ${personneName(personne)}`}
                          value={roleDepartement(affectation.fonction)}
                          disabled={busy}
                          onChange={(event) =>
                            onApplyRole(personne.idPersonne, event.target.value as RoleDepartement)
                          }
                        >
                          {(ROLES_EQUIPE.includes(roleDepartement(affectation.fonction) as (typeof ROLES_EQUIPE)[number])
                            ? ROLES_EQUIPE
                            : [roleDepartement(affectation.fonction), ...ROLES_EQUIPE]
                          ).map((role) => (
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
    </div>
  )
}
