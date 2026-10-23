import { z } from 'zod'
import type { FamilleImpact, FamilleImpactCreate, FamilleImpactUpdate } from '@/types'

export const familleSchema = z.object({
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
  zone: z
    .string()
    .trim()
    .min(1, 'La zone est obligatoire.')
    .max(100, 'La zone ne peut pas dépasser 100 caractères.'),
  latitude: z.number().gte(-90).lte(90).nullable(),
  longitude: z.number().gte(-180).lte(180).nullable(),
  mission: z.string(),
  actif: z.boolean(),
}).refine((values) => (values.latitude == null) === (values.longitude == null), {
  path: ['latitude'],
  message: 'La position doit avoir une latitude et une longitude.',
})

export type FamilleFormValues = z.input<typeof familleSchema>

export const emptyFamilleForm: FamilleFormValues = {
  code: '',
  nom: '',
  zone: '',
  latitude: null,
  longitude: null,
  mission: '',
  actif: true,
}

function arrondirCoordonnee(valeur: number | null) {
  if (valeur == null) return null
  return Math.round(valeur * 1e6) / 1e6
}

function optionalText(value: string): string | undefined {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

export function toFamilleCreate(values: FamilleFormValues): FamilleImpactCreate {
  return {
    code: values.code.trim(),
    nom: values.nom.trim(),
    zone: values.zone.trim(),
    latitude: arrondirCoordonnee(values.latitude),
    longitude: arrondirCoordonnee(values.longitude),
    description: optionalText(values.mission),
    actif: values.actif,
  }
}

export function toFamilleUpdate(values: FamilleFormValues): FamilleImpactUpdate {
  return toFamilleCreate(values)
}

export function valuesFromFamille(famille: FamilleImpact): FamilleFormValues {
  return {
    code: famille.code,
    nom: famille.nom,
    zone: famille.zone ?? '',
    latitude: famille.latitude ?? null,
    longitude: famille.longitude ?? null,
    mission: famille.description ?? '',
    actif: famille.actif,
  }
}

export function familleLabel(famille: Pick<FamilleImpact, 'nom' | 'zone'>) {
  return famille.zone ? `${famille.nom} (${famille.zone})` : famille.nom
}
