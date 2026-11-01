import { z } from 'zod'
import type { CompteCreate, CompteUpdate } from '@/types'

const statutSchema = z.enum(['actif', 'suspendu', 'desactive'])

const emailSchema = z
  .string()
  .trim()
  .min(1, "L'adresse e-mail est obligatoire.")
  .pipe(z.email('Saisissez une adresse e-mail valide.'))

/**
 * Le contrat sépare CompteCreate (personne + mot de passe obligatoires) de
 * CompteUpdate (e-mail, statut, MFA, mot de passe optionnel). Un seul
 * formulaire les couvre : en modification, le mot de passe reste vide
 * tant que l’administrateur ne le réinitialise pas.
 */
export function compteSchema(isEditing: boolean) {
  return z
    .object({
      idPersonne: isEditing
        ? z.string()
        : z.string().trim().min(1, 'La personne rattachée est obligatoire.'),
      email: emailSchema,
      motDePasse: isEditing
        ? z.string()
        : z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères.'),
      confirmationMotDePasse: z.string(),
      statut: statutSchema,
      mfaActive: z.enum(['true', 'false']),
      idRoles: z
        .array(z.string().trim().min(1))
        .min(1, 'Attribuez au moins un rôle pour ouvrir l’accès.'),
    })
    .superRefine((values, ctx) => {
      if (!isEditing) return
      const motDePasse = values.motDePasse
      const confirmation = values.confirmationMotDePasse
      if (!motDePasse && !confirmation) return
      if (motDePasse.length < 8) {
        ctx.addIssue({
          code: 'custom',
          path: ['motDePasse'],
          message: 'Le mot de passe doit contenir au moins 8 caractères.',
        })
      }
      if (motDePasse !== confirmation) {
        ctx.addIssue({
          code: 'custom',
          path: ['confirmationMotDePasse'],
          message: 'Les deux mots de passe ne correspondent pas.',
        })
      }
    })
}

export type CompteFormValues = z.input<ReturnType<typeof compteSchema>>

export const emptyCompteForm: CompteFormValues = {
  idPersonne: '',
  email: '',
  motDePasse: '',
  confirmationMotDePasse: '',
  statut: 'actif',
  mfaActive: 'false',
  idRoles: [],
}

export function toCompteCreate(values: CompteFormValues): CompteCreate {
  return {
    idPersonne: values.idPersonne.trim(),
    email: values.email.trim(),
    motDePasse: values.motDePasse,
    statut: values.statut,
  }
}

export function toCompteUpdate(values: CompteFormValues): CompteUpdate {
  const payload: CompteUpdate = {
    email: values.email.trim(),
    statut: values.statut,
    mfaActive: values.mfaActive === 'true',
  }
  if (values.motDePasse) payload.motDePasse = values.motDePasse
  return payload
}

export const affectationRoleSchema = z.object({
  idRole: z.string().trim().min(1, 'Le rôle est obligatoire.'),
})

export type AffectationRoleFormValues = z.input<typeof affectationRoleSchema>
