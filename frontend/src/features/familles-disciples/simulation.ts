import type {
  ChecklistPreparationCulte,
  CompositionFamilleDisciple,
  FamilleDisciple,
  FamillesDisciplesPage,
  PersonneFamilleDisciple,
  StatutPresenceDisciple,
  SuiviPresenceCulte,
  TypeCulte,
} from './api'

const familles: FamilleDisciple[] = [
  {
    idFamilleDisciple: 'simulation-famille-royal',
    nom: 'Famille Royal',
    periodeDebut: '2026-09-01',
    responsableId: 'simulation-personne-sarah',
    responsableNom: 'Sarah Nkulu',
    statut: 'actif',
    nbDepartementsRepresentes: 6,
    nbDepartementsActifsTotal: 8,
    statutCompletude: 'INCOMPLET',
    modeSimulation: true,
    compositions: [
      {
        idComposition: 'simulation-composition-nelly',
        idMembre: 'simulation-membre-nelly',
        idPersonne: 'simulation-personne-nelly',
        numeroMembre: 'M-2026-041',
        prenom: 'Nelly',
        nom: 'Kabila',
        nouveauVenu: true,
        dateAccueil: '2026-10-18',
        departementOrigineId: 'simulation-departement-accueil',
        departementOrigineNom: 'Accueil',
        actif: true,
      },
      {
        idComposition: 'simulation-composition-david',
        idMembre: 'simulation-membre-david',
        idPersonne: 'simulation-personne-david',
        numeroMembre: 'M-2026-042',
        prenom: 'David',
        nom: 'Mpoyi',
        nouveauVenu: true,
        dateAccueil: '2026-10-25',
        departementOrigineId: 'simulation-departement-accueil',
        departementOrigineNom: 'Accueil',
        actif: true,
      },
      {
        idComposition: 'simulation-composition-grace',
        idMembre: 'simulation-membre-grace',
        idPersonne: 'simulation-personne-grace',
        numeroMembre: 'M-2024-018',
        prenom: 'Grâce',
        nom: 'Mabika',
        nouveauVenu: false,
        departementOrigineId: 'simulation-departement-chorale',
        departementOrigineNom: 'Chorale',
        actif: true,
      },
      {
        idComposition: 'simulation-composition-patrick',
        idMembre: 'simulation-membre-patrick',
        idPersonne: 'simulation-personne-patrick',
        numeroMembre: 'M-2023-009',
        prenom: 'Patrick',
        nom: 'Ilunga',
        nouveauVenu: false,
        departementOrigineId: 'simulation-departement-audiovisuel',
        departementOrigineNom: 'Audio-visuel',
        actif: true,
      },
    ],
  },
  {
    idFamilleDisciple: 'simulation-famille-deborah',
    nom: 'Famille Déborah',
    periodeDebut: '2026-08-15',
    responsableId: 'simulation-personne-jean',
    responsableNom: 'Jean Mbuyi',
    statut: 'actif',
    nbDepartementsRepresentes: 8,
    nbDepartementsActifsTotal: 8,
    statutCompletude: 'COMPLET',
    modeSimulation: true,
    compositions: [
      {
        idComposition: 'simulation-composition-esther',
        idMembre: 'simulation-membre-esther',
        idPersonne: 'simulation-personne-esther',
        numeroMembre: 'M-2026-037',
        prenom: 'Esther',
        nom: 'Nsimba',
        nouveauVenu: true,
        dateAccueil: '2026-10-11',
        departementOrigineId: 'simulation-departement-accueil',
        departementOrigineNom: 'Accueil',
        actif: true,
      },
      {
        idComposition: 'simulation-composition-michel',
        idMembre: 'simulation-membre-michel',
        idPersonne: 'simulation-personne-michel',
        numeroMembre: 'M-2022-006',
        prenom: 'Michel',
        nom: 'Banza',
        nouveauVenu: false,
        departementOrigineId: 'simulation-departement-nettoyage',
        departementOrigineNom: 'Nettoyage',
        actif: true,
      },
    ],
  },
]

const checklists = new Map<string, ChecklistPreparationCulte>()
const suivis = new Map<string, SuiviPresenceCulte>()

function copie<T>(valeur: T): T {
  return structuredClone(valeur)
}

function cleSuivi(familleId: string, dateCulte: string, typeCulte: TypeCulte) {
  return `${familleId}:${dateCulte}:${typeCulte}`
}

function cleChecklist(familleId: string, dateCulte: string) {
  return `${familleId}:${dateCulte}`
}

function prochainDimanche(dateCulte: string) {
  const date = new Date(`${dateCulte}T12:00:00`)
  const jours = (7 - date.getDay()) % 7 || 7
  date.setDate(date.getDate() + jours)
  return date.toISOString().slice(0, 10)
}

export function listerFamillesSimulees(): FamillesDisciplesPage {
  return copie({
    data: familles,
    pagination: { page: 1, limit: familles.length, total: familles.length },
    modeSimulation: true,
  })
}

export function obtenirFamilleSimulee(id: string) {
  const famille = familles.find((item) => item.idFamilleDisciple === id)
  return famille ? copie({ ...famille, modeSimulation: true }) : null
}

export function admettreNouveauVenuSimule(
  familleId: string,
  payload: { idPersonne: string; dateAccueil: string; nouveauVenu?: boolean; prenom?: string; nom?: string },
): CompositionFamilleDisciple | null {
  const famille = familles.find((item) => item.idFamilleDisciple === familleId)
  if (!famille) return null
  const existant = famille.compositions?.find((item) => item.idPersonne === payload.idPersonne)
  if (existant) return copie(existant)
  const composition: CompositionFamilleDisciple = {
    idComposition: `simulation-composition-${payload.idPersonne}`,
    idMembre: `simulation-membre-${payload.idPersonne}`,
    idPersonne: payload.idPersonne,
    prenom: payload.prenom || 'Nouveau',
    nom: payload.nom || 'Venu',
    nouveauVenu: payload.nouveauVenu ?? true,
    dateAccueil: payload.dateAccueil,
    departementOrigineId: 'simulation-departement-accueil',
    departementOrigineNom: 'Accueil',
    actif: true,
  }
  famille.compositions = [...(famille.compositions ?? []), composition]
  return copie(composition)
}

export function retirerMembreFamilleSimulee(familleId: string, compositionId: string): boolean {
  const famille = familles.find((item) => item.idFamilleDisciple === familleId)
  const compositions = famille?.compositions ?? []
  const composition = compositions.find((item) => item.idComposition === compositionId)
  if (!famille || !composition) return false
  famille.compositions = compositions.filter((item) => item.idComposition !== compositionId)
  const personneId = composition.idPersonne ?? composition.idMembre
  for (const [cle, suivi] of suivis) {
    if (cle.startsWith(`${familleId}:`)) {
      suivis.set(cle, {
        ...suivi,
        membres: suivi.membres.filter((membre) => membre.idPersonne !== personneId),
      })
    }
  }
  return true
}

export function modifierStatutMembreFamilleSimulee(
  familleId: string,
  compositionId: string,
  statut: { nouveauVenu: boolean; actif: boolean },
): CompositionFamilleDisciple | null {
  const famille = familles.find((item) => item.idFamilleDisciple === familleId)
  const composition = famille?.compositions?.find((item) => item.idComposition === compositionId)
  if (!composition) return null
  Object.assign(composition, statut)
  return copie(composition)
}

export function obtenirFamillePersonneSimulee(personneId: string): PersonneFamilleDisciple | null {
  const famille = familles.find((item) => item.compositions?.some((composition) => composition.idPersonne === personneId))
  if (!famille) return null
  const composition = famille.compositions?.find((item) => item.idPersonne === personneId)
  if (!composition) return null
  return {
    idFamilleDisciple: famille.idFamilleDisciple,
    nomFamilleDisciple: famille.nom,
    dateAccueil: composition.dateAccueil ?? '',
    nouveauVenu: Boolean(composition.nouveauVenu),
    statut: famille.statut,
    modeSimulation: true,
  }
}

export function obtenirSuiviSimule(
  familleId: string,
  params: { dateCulte: string; typeCulte: TypeCulte },
): SuiviPresenceCulte {
  const cle = cleSuivi(familleId, params.dateCulte, params.typeCulte)
  const existant = suivis.get(cle)
  if (existant) return copie(existant)
  const famille = familles.find((item) => item.idFamilleDisciple === familleId)
  const membres = (famille?.compositions ?? []).filter((item) => item.actif).map((item, index) => ({
    idPersonne: item.idPersonne ?? item.idMembre,
    prenom: item.prenom ?? 'Membre',
    nom: item.nom ?? '',
    telephone: index === 0 ? '+243 812 345 678' : null,
    nouveauVenu: Boolean(item.nouveauVenu),
    dateAccueil: item.dateAccueil,
    statutPresence: (index === 1 ? 'absent' : 'present') as StatutPresenceDisciple,
    justificationAbsence: index === 1 ? 'A prévenu la famille : indisponibilité familiale.' : null,
    presenceDimancheSuivant: item.nouveauVenu ? index !== 1 : null,
  }))
  const suivi: SuiviPresenceCulte = {
    typeCulte: params.typeCulte,
    dateCulte: params.dateCulte,
    dateDimancheSuivant: prochainDimanche(params.dateCulte),
    membres,
    modeSimulation: true,
  }
  suivis.set(cle, copie(suivi))
  return copie(suivi)
}

export function enregistrerSuiviSimule(familleId: string, suivi: SuiviPresenceCulte) {
  const valeur = { ...suivi, modeSimulation: true }
  suivis.set(cleSuivi(familleId, suivi.dateCulte, suivi.typeCulte), copie(valeur))
  return copie(valeur)
}

const DEPARTEMENTS_DEMO = [
  ['simulation-departement-chorale', 'Chorale'],
  ['simulation-departement-audiovisuel', 'Audio-visuel'],
  ['simulation-departement-communication', 'Communication'],
  ['simulation-departement-nettoyage', 'Nettoyage'],
  ['simulation-departement-accueil', 'Accueil'],
  ['simulation-departement-protocole', 'Protocole'],
] as const

export function obtenirChecklistSimulee(familleId: string, dateCulte: string): ChecklistPreparationCulte {
  const cle = cleChecklist(familleId, dateCulte)
  const existante = checklists.get(cle)
  if (existante) return copie(existante)
  const departements = DEPARTEMENTS_DEMO.map(([idDepartement, nomDepartement], index) => ({
    idDepartement,
    nomDepartement,
    pret: index === 0 || index === 4,
    commentaire: index === 1 ? 'Vérifier les microphones avant l’ouverture.' : '',
  }))
  const checklist: ChecklistPreparationCulte = { dateCulte, departements, modeSimulation: true }
  checklists.set(cle, copie(checklist))
  return copie(checklist)
}

export function enregistrerChecklistSimulee(familleId: string, checklist: ChecklistPreparationCulte) {
  const valeur = { ...checklist, modeSimulation: true }
  checklists.set(cleChecklist(familleId, checklist.dateCulte), copie(valeur))
  return copie(valeur)
}
