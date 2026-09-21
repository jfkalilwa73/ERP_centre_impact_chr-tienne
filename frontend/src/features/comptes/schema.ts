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
 * CompteUpdate (e-mail, statut, MFA). Un seul formulaire les couvre, d'où
 * l'assouplissement des champs absents en modification.
 */
export function compteSchema(isEditing: boolean) {
  return z.object({
    idPersonne: isEditing
      ? z.string()
      : z.string().trim().min(1, 'La personne rattachée est obligatoire.'),
    email: emailSchema,
    motDePasse: isEditing
      ? z.string()
      : z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères.'),
    statut: statutSchema,
    mfaActive: z.enum(['true', 'false']),
  })
}

export type CompteFormValues = z.input<ReturnType<typeof compteSchema>>

export const emptyCompteForm: CompteFormValues = {
  idPersonne: '',
  email: '',
  motDePasse: '',
  statut: 'actif',
  mfaActive: 'false',
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
  return {
    email: values.email.trim(),
    statut: values.statut,
    mfaActive: values.mfaActive === 'true',
  }
}

export const affectationRoleSchema = z.object({
  idRole: z.string().trim().min(1, 'Le rôle est obligatoire.'),
})

export type AffectationRoleFormValues = z.input<typeof affectationRoleSchema>
