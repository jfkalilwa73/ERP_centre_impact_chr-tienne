import { besoinCompteRendu, listAllActivites } from '@/features/departements/activites'
import { listAllActivitesFamille } from '@/features/familles/activites'
import { presenceFaible, tauxPresenceMembres } from '@/features/departements/presence'
import {
  CAISSE_EGLISE,
  formatMontant,
  listBudgetDepartementIds,
  syntheseBudget,
} from '@/features/departements/budget'
import { replaceAlertes, type Circulation } from './circulation'

const NOMS: Record<string, string> = {
  'd4f6b8c0-0006-4000-8000-000000000001': 'Département Accueil',
  'd4f6b8c0-0006-4000-8000-000000000002': 'Département Louange',
  'd4f6b8c0-0006-4000-8000-000000000003': 'Département Diaconie',
  'f1a2b3c4-0008-4000-8000-000000000001': 'Famille Bâtisseurs',
  'f1a2b3c4-0008-4000-8000-000000000002': 'Famille Lumières',
  'f1a2b3c4-0008-4000-8000-000000000003': 'Famille Grâce',
  [CAISSE_EGLISE.idDepartement]: CAISSE_EGLISE.nom,
}

const FAMILLE_IDS = new Set([
  'f1a2b3c4-0008-4000-8000-000000000001',
  'f1a2b3c4-0008-4000-8000-000000000002',
  'f1a2b3c4-0008-4000-8000-000000000003',
  'f1a2b3c4-0008-4000-8000-000000000004',
])

function activitesParUnite() {
  return [
    ...listAllActivites().map((item) => ({ ...item, idUnite: item.idDepartement })),
    ...listAllActivitesFamille().map((item) => ({ ...item, idUnite: item.idFamille })),
  ]
}

export function syncAlertes() {
  const activites = activitesParUnite()
  const ids = new Set([
    ...activites.map((item) => item.idUnite),
    ...listBudgetDepartementIds(),
  ])
  const draft: Circulation[] = []

  ids.forEach((idDepartement) => {
    const nom =
      NOMS[idDepartement] ?? (FAMILLE_IDS.has(idDepartement) ? 'Famille d’impact' : 'Département')
    const libelleCible = FAMILLE_IDS.has(idDepartement) ? 'famille' : 'département'
    activites
      .filter((item) => item.idUnite === idDepartement)
      .filter((item) => besoinCompteRendu(item))
      .forEach((item) => {
        draft.push({
          id: `compte-rendu:${idDepartement}:${item.id}`,
          kind: 'compte_rendu',
          titre: `Compte rendu à produire : ${item.titre}`,
          description: item.nomResponsable
            ? `${nom} · ${item.nomResponsable}, renseignez les présences et le déroulement.`
            : `${nom} · Assignez un responsable, puis renseignez les présences et le déroulement.`,
          idDepartementSource: idDepartement,
          nomDepartementSource: nom,
          idDepartementCible: idDepartement,
          nomDepartementCible: nom,
          idAuteur: 'systeme',
          nomAuteur: 'Système',
          dateCreation: `${todayStamp()}T00:00:00.000Z`,
          reponses: [],
          luPar: [],
          sourceKey: `compte-rendu:${idDepartement}:${item.id}`,
          idPersonnesNotifiees: item.idResponsable ? [item.idResponsable] : undefined,
        })
      })

    tauxPresenceMembres(activites.filter((item) => item.idUnite === idDepartement))
      .filter((item) => presenceFaible(item))
      .forEach((item) => {
        draft.push(
          alerte({
            sourceKey: `presence-faible:${idDepartement}:${item.idPersonne}`,
            titre: `Présence faible : ${item.nom}`,
            description: `${nom} · ${item.presents}/${item.convocations} activités (${item.taux} %). Alerte envoyée ${libelleCible === 'famille' ? 'à la famille' : 'au département'}, au DGE, au pasteur et à l’administrateur.`,
            idDepartement,
            nom,
          }),
        )
      })

    const budget = syntheseBudget(idDepartement)
    const base = budget.alloue + budget.rentrees
    if (base > 0 && budget.disponible / base <= 0.2) {
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
