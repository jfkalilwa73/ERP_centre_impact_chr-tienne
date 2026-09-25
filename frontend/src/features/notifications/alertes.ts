import { listAllActivites } from '@/features/departements/activites'
import {
  formatMontant,
  listBudgetDepartementIds,
  syntheseBudget,
} from '@/features/departements/budget'
import { replaceAlertes, type Circulation } from './circulation'

const NOMS: Record<string, string> = {
  'd4f6b8c0-0006-4000-8000-000000000001': 'Département Accueil',
  'd4f6b8c0-0006-4000-8000-000000000002': 'Département Louange',
  'd4f6b8c0-0006-4000-8000-000000000003': 'Département Diaconie',
}

export function syncAlertes() {
  const today = new Date().toISOString().slice(0, 10)
  const ids = new Set([
    ...listAllActivites().map((item) => item.idDepartement),
    ...listBudgetDepartementIds(),
  ])
  const draft: Circulation[] = []

  ids.forEach((idDepartement) => {
    const nom = NOMS[idDepartement] ?? 'Département'
    listAllActivites()
      .filter((item) => item.idDepartement === idDepartement)
      .filter((item) => item.echeance && item.echeance < today && item.statut !== 'faite')
      .forEach((item) => {
        draft.push(
          alerte({
            sourceKey: `echeance:${idDepartement}:${item.id}`,
            titre: `Échéance dépassée : ${item.titre}`,
            description: item.nomResponsable
              ? `${nom} · Responsable ${item.nomResponsable}.`
              : `${nom} · L’activité n’est pas encore réalisée.`,
            idDepartement,
            nom,
          }),
        )
      })

    const budget = syntheseBudget(idDepartement)
    if (budget.alloue > 0 && budget.disponible / budget.alloue <= 0.2) {
      draft.push(
        alerte({
          sourceKey: `budget-serre:${idDepartement}`,
          titre: 'Budget serré',
          description: `${nom} · ${formatMontant(budget.disponible)} encore disponible.`,
          idDepartement,
          nom,
        }),
      )
    }
    const enAttente = budget.engage - budget.depense
    if (enAttente > 0) {
      draft.push(
        alerte({
          sourceKey: `budget-attente:${idDepartement}`,
          titre: 'Demandes de budget en cours',
          description: `${nom} · ${formatMontant(enAttente)} encore à traiter.`,
          idDepartement,
          nom,
        }),
      )
    }
  })

  replaceAlertes(draft)
}

function alerte(input: {
  sourceKey: string
  titre: string
  description: string
  idDepartement: string
  nom: string
}): Circulation {
  return {
    id: input.sourceKey,
    kind: 'alerte',
    titre: input.titre,
    description: input.description,
    idDepartementSource: input.idDepartement,
    nomDepartementSource: input.nom,
    idDepartementCible: input.idDepartement,
    nomDepartementCible: input.nom,
    idAuteur: 'systeme',
    nomAuteur: 'Système',
    dateCreation: `${todayStamp()}T00:00:00.000Z`,
    reponses: [],
    luPar: [],
    sourceKey: input.sourceKey,
  }
}

function todayStamp() {
  return new Date().toISOString().slice(0, 10)
}
