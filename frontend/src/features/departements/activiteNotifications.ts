import {
  deleteCirculationsBySourceKey,
  upsertCirculation,
} from '@/features/notifications/circulation'
import { messageRappel, type Activite } from './activites'

function sourceKey(departementId: string, activiteId: string) {
  return `rappel:${departementId}:${activiteId}`
}

export function notifyMembresActivite(input: {
  activite: Activite
  departementId: string
  nomDepartement: string
  membreIds: string[]
  auteur: { idPersonne: string; nom: string }
}) {
  const destinataires = input.membreIds.filter((id) => id !== input.auteur.idPersonne)
  upsertCirculation({
    kind: 'rappel',
    titre: input.activite.titre,
    description: messageRappel(input.activite),
    idDepartementSource: input.departementId,
    nomDepartementSource: input.nomDepartement,
    idDepartementCible: input.departementId,
    nomDepartementCible: input.nomDepartement,
    idAuteur: input.auteur.idPersonne,
    nomAuteur: input.auteur.nom,
    sourceKey: sourceKey(input.departementId, input.activite.id),
    idPersonnesNotifiees: destinataires,
  })
}

export function retirerRappelActivite(departementId: string, activiteId: string) {
  deleteCirculationsBySourceKey(sourceKey(departementId, activiteId))
}
