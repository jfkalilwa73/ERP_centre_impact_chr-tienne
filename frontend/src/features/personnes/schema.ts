import { z } from 'zod'
import type { PersonneCreate, PersonneUpdate } from '@/types'

const sexeSchema = z.enum(['M', 'F'])
const statutSchema = z.enum(['actif', 'inactif', 'archive'])

/**
 * Reflète PersonneCreate / PersonneUpdate du contrat : nom et prénom obligatoires,
 * téléphone ≤ 20, statut parmi actif / inactif / archive.
 */
export const personneSchema = z.object({
  nom: z
    .string()
    .trim()
    .min(1, 'Le nom est obligatoire.')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères.'),
  prenom: z
    .string()
    .trim()
    .min(1, 'Le prénom est obligatoire.')
    .max(100, 'Le prénom ne peut pas dépasser 100 caractères.'),
  dateNaissance: z.string(),
  sexe: z.union([z.literal(''), sexeSchema]),
  telephone: z.string().trim().max(20, 'Le numéro ne peut pas dépasser 20 caractères.'),
  adresse: z.string().trim(),
  statut: statutSchema,
})

export type PersonneFormValues = z.input<typeof personneSchema>

export const emptyPersonneForm: PersonneFormValues = {
  nom: '',
  prenom: '',
  dateNaissance: '',
  sexe: '',
  telephone: '',
  adresse: '',
  statut: 'actif',
}

export const personneEditSchema = personneSchema.extend({
  statutCivil: z.enum(['', 'celibataire', 'marie', 'veuf', 'divorce']),
  competences: z.string(),
  idFamille: z.string(),
  liens: z.array(
    z.object({
      idPersonne: z.string(),
      lien: z.string(),
    }),
  ),
  certificatBaptemeNom: z.string(),
  formation001: z.boolean(),
  formation101: z.boolean(),
  formation201: z.boolean(),
})

export type PersonneEditFormValues = z.input<typeof personneEditSchema>

export const emptyPersonneEditForm: PersonneEditFormValues = {
  ...emptyPersonneForm,
  statutCivil: '',
  competences: '',
  idFamille: '',
  liens: [],
  certificatBaptemeNom: '',
  formation001: false,
  formation101: false,
  formation201: false,
}

function optionalText(value: string): string | undefined {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

export function toPersonneCreate(values: PersonneFormValues): PersonneCreate {
  return {
    nom: values.nom.trim(),
    prenom: values.prenom.trim(),
    dateNaissance: optionalText(values.dateNaissance),
    sexe: values.sexe === '' ? undefined : values.sexe,
    telephone: optionalText(values.telephone),
    adresse: optionalText(values.adresse),
    statut: values.statut,
  }
}

export function toPersonneUpdate(values: PersonneFormValues): PersonneUpdate {
  return toPersonneCreate(values)
}

export const affectationSchema = z.object({
  idDepartement: z.string().trim().min(1, 'Le département est obligatoire.'),
  fonction: z.enum(['Superviseur', 'Chef', 'Adjoint', 'Membre']),
})

export type AffectationFormValues = z.input<typeof affectationSchema>
