import type { Personne } from '@/types'
import { getFamilleIdForPersonne } from './familles'
import type { PersonneEditFormValues } from './schema'

export type LienFamilial = {
  idPersonne: string
  lien: string
  dateAjout: string
}

export type FicheEvenement = {
  id: string
  date: string
  categorie: 'creation' | 'modification' | 'lien' | 'responsabilite'
  libelle: string
}

export type NotePastorale = {
  id: string
  texte: string
}

export type StatutCivil = 'celibataire' | 'marie' | 'veuf' | 'divorce'

export type FormationsFiche = {
  '001': boolean
  '101': boolean
  '201': boolean
}

export type FicheComplement = {
  statutCivil: StatutCivil | ''
  competences: string
  liens: LienFamilial[]
  certificatBaptemeNom: string
  formations: FormationsFiche
  notes: NotePastorale[]
}

export type CritereFiche = {
  id: string
  label: string
  renseigne: boolean
}

export const STATUT_CIVIL_LABELS: Record<StatutCivil, string> = {
  celibataire: 'Célibataire',
  marie: 'Marié(e)',
  veuf: 'Veuf / Veuve',
  divorce: 'Divorcé(e)',
}

export const TYPES_LIEN = ['Conjoint', 'Enfant', 'Parent', 'Frère', 'Sœur'] as const

export const FORMATIONS = [
  { id: '001', label: 'Formation 001' },
  { id: '101', label: 'Formation 101' },
  { id: '201', label: 'Formation 201' },
] as const

export const emptyFicheComplement: FicheComplement = {
  statutCivil: '',
  competences: '',
  liens: [],
  certificatBaptemeNom: '',
  formations: { '001': false, '101': false, '201': false },
  notes: [],
}

const MWAMBA_IDS = [
  'b2d4f6a8-0004-4000-8000-000000000007',
  'b2d4f6a8-0004-4000-8000-000000000008',
  'b2d4f6a8-0004-4000-8000-000000000009',
]

const JEAN_ID = 'b2d4f6a8-0004-4000-8000-000000000001'

function cloneComplement(value: FicheComplement): FicheComplement {
  return {
    ...value,
    liens: value.liens.map((lien) => ({ ...lien })),
    formations: { ...value.formations },
    notes: value.notes.map((note) => ({ ...note })),
  }
}

let extraEvenements: Record<string, FicheEvenement[]> = {}

function seedEvenements(): Record<string, FicheEvenement[]> {
  return {}
}

function seedComplements(): Record<string, FicheComplement> {
  const seeded: Record<string, FicheComplement> = {
    [JEAN_ID]: {
      ...emptyFicheComplement,
      notes: [
        {
          id: 'note-jean-1',
          texte:
            "Jean est très impliqué dans l'accueil. À émettre le souhait de former l'animation des groupes de jeunesse l'année prochaine.",
        },
      ],
    },
  }

  for (const id of MWAMBA_IDS) {
    seeded[id] = {
      ...emptyFicheComplement,
      liens: MWAMBA_IDS.filter((other) => other !== id).map((other) => ({
        idPersonne: other,
        lien: 'Frère',
        dateAjout: '2026-03-12T10:00:00.000Z',
      })),
    }
  }

  return seeded
}

let complements = seedComplements()

export function getFicheComplement(personneId: string): FicheComplement {
  return cloneComplement(complements[personneId] ?? emptyFicheComplement)
}

export function saveFicheComplement(
  personneId: string,
  patch: Partial<Omit<FicheComplement, 'notes'>> & { notes?: NotePastorale[] },
) {
  const current = getFicheComplement(personneId)
  complements[personneId] = {
    ...current,
    ...patch,
    liens: patch.liens ?? current.liens,
    formations: patch.formations ?? current.formations,
    notes: patch.notes ?? current.notes,
  }
  return getFicheComplement(personneId)
}

export function addNotePastorale(personneId: string, texte: string) {
  const current = getFicheComplement(personneId)
  return saveFicheComplement(personneId, {
    notes: [...current.notes, { id: crypto.randomUUID(), texte }],
  })
}

export function deleteNotePastorale(personneId: string, noteId: string) {
  const current = getFicheComplement(personneId)
  return saveFicheComplement(personneId, {
    notes: current.notes.filter((note) => note.id !== noteId),
  })
}

export function upsertLienFamilial(personneId: string, lien: Omit<LienFamilial, 'dateAjout'> & { dateAjout?: string }) {
  const current = getFicheComplement(personneId)
  const existing = current.liens.find((item) => item.idPersonne === lien.idPersonne)
  const next: LienFamilial = {
    idPersonne: lien.idPersonne,
    lien: lien.lien,
    dateAjout: existing?.dateAjout ?? lien.dateAjout ?? new Date().toISOString(),
  }
  const saved = saveFicheComplement(personneId, {
    liens: [...current.liens.filter((item) => item.idPersonne !== lien.idPersonne), next],
  })
  return saved
}

export function removeLienFamilial(personneId: string, idProche: string) {
  const current = getFicheComplement(personneId)
  return saveFicheComplement(personneId, {
    liens: current.liens.filter((item) => item.idPersonne !== idProche),
  })
}

export function addFicheEvenement(
  personneId: string,
  event: { categorie: FicheEvenement['categorie']; libelle: string; date?: string },
) {
  const entry: FicheEvenement = {
    id: crypto.randomUUID(),
    date: event.date ?? new Date().toISOString(),
    categorie: event.categorie,
    libelle: event.libelle,
  }
  extraEvenements[personneId] = [...(extraEvenements[personneId] ?? []), entry]
  return entry
}

export function listFicheEvenements(personneId: string) {
  return extraEvenements[personneId] ?? []
}

export function resetFicheComplements() {
  complements = seedComplements()
  extraEvenements = seedEvenements()
}

export function memberCode(personne: Personne) {
  const year = new Date(personne.dateCreation).getFullYear()
  const suffix = personne.idPersonne.replace(/-/g, '').slice(-4).toUpperCase()
  return `MEM-${year}-${suffix}`
}

export function liensFamiliauxOf(personneId: string): LienFamilial[] {
  return getFicheComplement(personneId).liens
}

export function complementFromEdit(
  values: PersonneEditFormValues,
  existing?: FicheComplement,
): Omit<FicheComplement, 'notes'> {
  return {
    statutCivil: values.statutCivil,
    competences: values.competences.trim(),
    liens: values.liens
      .filter((lien) => lien.idPersonne && lien.lien)
      .map((lien) => {
        const previous = existing?.liens.find((item) => item.idPersonne === lien.idPersonne)
        return {
          idPersonne: lien.idPersonne,
          lien: lien.lien,
          dateAjout: previous?.dateAjout ?? new Date().toISOString(),
        }
      }),
    certificatBaptemeNom: values.certificatBaptemeNom,
    formations: {
      '001': values.formation001,
      '101': values.formation101,
      '201': values.formation201,
    },
  }
}

export function criteresFiche(input: {
  personne: Personne
  complement?: FicheComplement
}) {
  const complement = input.complement ?? getFicheComplement(input.personne.idPersonne)
  const { personne } = input
  const criteres: CritereFiche[] = [
    { id: 'telephone', label: 'Téléphone', renseigne: Boolean(personne.telephone) },
    { id: 'adresse', label: 'Adresse principale', renseigne: Boolean(personne.adresse) },
    { id: 'statutCivil', label: 'Statut civil', renseigne: Boolean(complement.statutCivil) },
    { id: 'naissance', label: 'Date de naissance', renseigne: Boolean(personne.dateNaissance) },
    {
      id: 'competences',
      label: 'Compétences / Professions',
      renseigne: Boolean(complement.competences.trim()),
    },
    { id: 'sexe', label: 'Sexe', renseigne: Boolean(personne.sexe) },
    {
      id: 'famille',
      label: "Famille d'impact",
      renseigne: Boolean(getFamilleIdForPersonne(personne.idPersonne)),
    },
    { id: 'liens', label: 'Liens familiaux', renseigne: complement.liens.length > 0 },
    {
      id: 'bapteme',
      label: 'Certificat de baptême (Document PDF)',
      renseigne: Boolean(complement.certificatBaptemeNom),
    },
    { id: 'formation001', label: 'Formation 001', renseigne: complement.formations['001'] },
    { id: 'formation101', label: 'Formation 101', renseigne: complement.formations['101'] },
    { id: 'formation201', label: 'Formation 201', renseigne: complement.formations['201'] },
  ]
  const completes = criteres.filter((item) => item.renseigne).length
  return {
    criteres,
    manquants: criteres.filter((item) => !item.renseigne),
    completude: Math.round((completes / criteres.length) * 100),
  }
}
