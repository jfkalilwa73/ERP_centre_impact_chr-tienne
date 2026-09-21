import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogContent } from '@/components/ui/Dialog'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { errorId } from '@/lib/form'
import type { Compte, Personne } from '@/types'
import { compteSchema, emptyCompteForm, type CompteFormValues } from './schema'

type CompteFormDialogProps = {
  open: boolean
  compte?: Compte | null
  personnes: Personne[]
  errorMessage?: string
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: CompteFormValues) => void
}

export function CompteFormDialog({
  open,
  compte,
  personnes,
  errorMessage,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: CompteFormDialogProps) {
  const isEditing = Boolean(compte)
  const resolver = useMemo(() => zodResolver(compteSchema(isEditing)), [isEditing])
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CompteFormValues>({
    resolver,
    defaultValues: emptyCompteForm,
  })

  useEffect(() => {
    if (!open) return
    reset(
      compte
        ? {
            idPersonne: compte.idPersonne,
            email: compte.email,
            motDePasse: '',
            statut: compte.statut,
            mfaActive: compte.mfaActive ? 'true' : 'false',
          }
        : emptyCompteForm,
    )
  }, [open, compte, reset])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={isEditing ? 'Modifier le compte' : 'Nouveau compte'}
        description="Un compte de connexion est toujours rattaché à une personne déjà enregistrée."
      >
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          {errorMessage && (
            <Alert variant="error" title="Enregistrement impossible">
              {errorMessage}
            </Alert>
          )}

          {!isEditing && (
            <FormField id="compte-personne" label="Personne rattachée" error={errors.idPersonne?.message}>
              <Select
                id="compte-personne"
                hasError={Boolean(errors.idPersonne)}
                aria-describedby={errors.idPersonne ? errorId('compte-personne') : undefined}
                {...register('idPersonne')}
              >
                <option value="">Choisir une personne</option>
                {personnes.map((personne) => (
                  <option key={personne.idPersonne} value={personne.idPersonne}>
                    {personne.prenom} {personne.nom}
                  </option>
                ))}
              </Select>
            </FormField>
          )}

          <FormField id="compte-email" label="Adresse e-mail" error={errors.email?.message}>
            <Input
              id="compte-email"
              type="email"
              autoComplete="email"
              placeholder="jean@eglise.org"
              hasError={Boolean(errors.email)}
              aria-describedby={errors.email ? errorId('compte-email') : undefined}
              {...register('email')}
            />
          </FormField>

          {!isEditing && (
            <FormField id="compte-mot-de-passe" label="Mot de passe" error={errors.motDePasse?.message}>
              <Input
                id="compte-mot-de-passe"
                type="password"
                autoComplete="new-password"
                hasError={Boolean(errors.motDePasse)}
                aria-describedby={errors.motDePasse ? errorId('compte-mot-de-passe') : undefined}
                {...register('motDePasse')}
              />
            </FormField>
          )}

          <FormField id="compte-statut" label="Statut" error={errors.statut?.message}>
            <Select
              id="compte-statut"
              hasError={Boolean(errors.statut)}
              aria-describedby={errors.statut ? errorId('compte-statut') : undefined}
              {...register('statut')}
            >
              <option value="actif">Actif</option>
              <option value="suspendu">Suspendu</option>
              <option value="desactive">Désactivé</option>
            </Select>
          </FormField>

          {isEditing && (
            <FormField
              id="compte-mfa"
              label="Double authentification"
              error={errors.mfaActive?.message}
            >
              <Select
                id="compte-mfa"
                hasError={Boolean(errors.mfaActive)}
                aria-describedby={errors.mfaActive ? errorId('compte-mfa') : undefined}
                {...register('mfaActive')}
              >
                <option value="false">Désactivée</option>
                <option value="true">Activée</option>
              </Select>
            </FormField>
          )}

          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {isEditing ? 'Enregistrer' : 'Créer le compte'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
