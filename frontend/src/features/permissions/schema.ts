import { z } from 'zod'
import type { PermissionCreate, PermissionUpdate } from '@/types'

const permissionCodePattern = /^[A-Za-z][A-Za-z0-9_-]*\.[A-Za-z][A-Za-z0-9_-]*$/

/**
 * Reflète PermissionCreate / PermissionUpdate du contrat :
 * code `module.action`, module et action ≤ 50.
 */
export const permissionSchema = z.object({
  module: z
    .string()
    .trim()
    .min(1, 'Le module est obligatoire.')
    .max(50, 'Le module ne peut pas dépasser 50 caractères.'),
  action: z
    .string()
    .trim()
    .min(1, "L'action est obligatoire.")
    .max(50, "L'action ne peut pas dépasser 50 caractères."),
  code: z
    .string()
    .trim()
    .min(1, 'Le code est obligatoire.')
    .regex(permissionCodePattern, 'Le code doit suivre le motif module.action (ex. membres.read).'),
  description: z.string(),
  actif: z.boolean(),
})

export type PermissionFormValues = z.input<typeof permissionSchema>

export const emptyPermissionForm: PermissionFormValues = {
  module: '',
  action: '',
  code: '',
  description: '',
  actif: true,
}

function optionalText(value: string): string | undefined {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

export function toPermissionCreate(values: PermissionFormValues): PermissionCreate {
  return {
    code: values.code.trim().toLowerCase(),
    module: values.module.trim().toLowerCase(),
    action: values.action.trim().toLowerCase(),
    description: optionalText(values.description),
    actif: values.actif,
  }
}

export function toPermissionUpdate(values: PermissionFormValues): PermissionUpdate {
  return toPermissionCreate(values)
}
