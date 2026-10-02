import { z } from 'zod'
import type { SiteCreate, SiteUpdate } from '@/types'

/**
 * Reflète SiteCreate / SiteUpdate du contrat : code ≤ 20, nom ≤ 100,
 * téléphone obligatoire ≤ 20, ville/pays ≤ 100.
 */
export const siteSchema = z.object({
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
  telephone: z
    .string()
    .trim()
    .min(1, 'Le numéro d’accueil est obligatoire.')
    .max(20, 'Le numéro ne peut pas dépasser 20 caractères.'),
  adresse: z.string().trim(),
  ville: z.string().trim().max(100, 'La ville ne peut pas dépasser 100 caractères.'),
  pays: z.string().trim().max(100, 'Le pays ne peut pas dépasser 100 caractères.'),
  actif: z.boolean(),
})

export type SiteFormValues = z.input<typeof siteSchema>

export const emptySiteForm: SiteFormValues = {
  code: '',
  nom: '',
  telephone: '',
  adresse: '',
  ville: '',
  pays: 'RDC',
  actif: true,
}

function optionalText(value: string): string | undefined {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

export function toSiteCreate(values: SiteFormValues): SiteCreate {
  return {
    code: values.code.trim(),
    nom: values.nom.trim(),
    telephone: values.telephone.trim(),
    adresse: optionalText(values.adresse),
    ville: optionalText(values.ville),
    pays: optionalText(values.pays),
    actif: values.actif,
  }
}

export function toSiteUpdate(values: SiteFormValues): SiteUpdate {
  return toSiteCreate(values)
}
