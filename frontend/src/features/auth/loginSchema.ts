import { z } from 'zod'

/**
 * Reflète les contraintes de LoginRequest du contrat : email au format e-mail,
 * motDePasse d'au moins 8 caractères.
 */
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "L'adresse e-mail est obligatoire.")
    .pipe(z.email('Saisissez une adresse e-mail valide.')),
  motDePasse: z
    .string()
    .min(1, 'Le mot de passe est obligatoire.')
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères.'),
})

export type LoginFormValues = z.input<typeof loginSchema>
export type LoginPayload = z.output<typeof loginSchema>
