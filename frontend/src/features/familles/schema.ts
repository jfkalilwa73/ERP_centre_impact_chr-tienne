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
  responsableId: z.string(),
  adjointId: z.string(),
  capaciteMax: z.string(),
  jourReunion: z.string(),
  heureReunion: z.string(),
  lieuReunion: z.string(),
}).refine((values) => (values.latitude == null) === (values.longitude == null), {
  path: ['latitude'],
  message: 'La position doit avoir une latitude et une longitude.',
}).refine((values) => !values.responsableId || values.responsableId !== values.adjointId, {
  path: ['adjointId'],
  message: 'L’adjoint doit être différent du responsable.',
}).refine((values) => values.capaciteMax.trim() === '' || /^[1-9]\d*$/.test(values.capaciteMax.trim()), {
  path: ['capaciteMax'],
  message: 'La capacité doit être un nombre entier positif.',
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
  responsableId: '',
  adjointId: '',
  capaciteMax: '',
  jourReunion: '',
  heureReunion: '',
  lieuReunion: '',
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
    responsableId: values.responsableId || null,
    adjointId: values.adjointId || null,
    capaciteMax: values.capaciteMax.trim() ? Number(values.capaciteMax) : null,
    jourReunion: optionalText(values.jourReunion) ?? null,
    heureReunion: optionalText(values.heureReunion) ?? null,
    lieuReunion: optionalText(values.lieuReunion) ?? null,
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
    responsableId: famille.responsableId ?? '',
    adjointId: famille.adjointId ?? '',
    capaciteMax: famille.capaciteMax == null ? '' : String(famille.capaciteMax),
    jourReunion: famille.jourReunion ?? '',
    heureReunion: famille.heureReunion ?? '',
    lieuReunion: famille.lieuReunion ?? '',
  }
}

export function familleLabel(famille: Pick<FamilleImpact, 'nom' | 'zone'>) {
  return famille.zone ? `${famille.nom} (${famille.zone})` : famille.nom
}
