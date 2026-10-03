import { z } from 'zod'
import type { RoleCreate, RoleUpdate } from '@/types'

const roleCodePattern = /^[A-Za-z][A-Za-z0-9_]*$/

/**
 * Reflète RoleCreate / RoleUpdate du contrat : code majuscules + underscore,
 * nom ≤ 100, niveau de confidentialité ≥ 1.
 */
export const roleSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'Le code est obligatoire.')
        .regex(roleCodePattern, 'Le code ne peut contenir que des lettres, chiffres ou underscores.'),
  nom: z
    .string()
    .trim()
    .min(1, 'Le nom est obligatoire.')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères.'),
  description: z.string(),
  niveauConfidentialite: z
    .number()
    .int()
    .min(1, 'Le niveau minimum est 1.'),
  actif: z.boolean(),
})

export type RoleFormValues = z.input<typeof roleSchema>

export const emptyRoleForm: RoleFormValues = {
  code: '',
  nom: '',
  description: '',
  niveauConfidentialite: 1,
  actif: true,
}

function optionalText(value: string): string | undefined {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

export function toRoleCreate(values: RoleFormValues): RoleCreate {
  return {
    code: values.code.trim().toUpperCase(),
    nom: values.nom.trim(),
    description: optionalText(values.description),
    niveauConfidentialite: values.niveauConfidentialite,
    actif: values.actif,
  }
}

export function toRoleUpdate(values: RoleFormValues): RoleUpdate {
  return toRoleCreate(values)
}

export const rolePermissionSchema = z.object({
  idPermission: z.string().min(1, 'Choisissez une permission.'),
})

export type RolePermissionFormValues = z.input<typeof rolePermissionSchema>
