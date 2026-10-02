import { z } from 'zod'
import type { DepartementCreate, DepartementUpdate } from '@/types'

/**
 * Le code et le nom restent ceux du contrat. idSite est injecté côté client
 * (site par défaut) : l'église n'expose plus le concept de site dans l'UI.
 */
export const departementSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'Le code est obligatoire.')
    .max(20, 'Le code ne peut pas dépasser 20 caractères.'),
  nom: z
    .string()
    .trim()
    .min(1, 'Le nom est obligatoire.')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères.'),
  mission: z.string(),
  actif: z.boolean(),
})

export type DepartementFormValues = z.input<typeof departementSchema>

export const emptyDepartementForm: DepartementFormValues = {
  code: '',
  nom: '',
  mission: '',
  actif: true,
}

function optionalText(value: string): string | undefined {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

export function toDepartementCreate(values: DepartementFormValues, idSite: string): DepartementCreate {
  return {
    code: values.code.trim(),
    nom: values.nom.trim(),
    idSite,
    mission: optionalText(values.mission),
    actif: values.actif,
  }
}

export function toDepartementUpdate(values: DepartementFormValues, idSite: string): DepartementUpdate {
  return toDepartementCreate(values, idSite)
}
