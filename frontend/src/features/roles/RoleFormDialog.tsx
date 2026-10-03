import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogContent } from '@/components/ui/Dialog'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { errorId } from '@/lib/form'
import type { Role } from '@/types'
import { emptyRoleForm, roleSchema, type RoleFormValues } from './schema'

type RoleFormDialogProps = {
  open: boolean
  role?: Role | null
  errorMessage?: string
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: RoleFormValues) => void
}

export function RoleFormDialog({
  open,
  role,
  errorMessage,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: RoleFormDialogProps) {
  const isEditing = Boolean(role)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: emptyRoleForm,
  })

  useEffect(() => {
    if (!open) return
    reset(
      role
        ? {
            code: role.code,
            nom: role.nom,
            description: role.description ?? '',
            niveauConfidentialite: role.niveauConfidentialite ?? 1,
            actif: role.actif ?? true,
          }
        : emptyRoleForm,
    )
  }, [open, role, reset])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={isEditing ? 'Modifier le rôle' : 'Nouveau rôle'}
        description="Le code identifie le profil de droits. Il doit être en majuscules."
      >
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          {errorMessage && (
            <Alert variant="error" title="Enregistrement impossible">
              {errorMessage}
            </Alert>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="role-code" label="Code" error={errors.code?.message}>
              <Input
                id="role-code"
                autoComplete="off"
                placeholder="ADMIN_FONCTIONNEL"
                className="uppercase"
                hasError={Boolean(errors.code)}
                aria-describedby={errors.code ? errorId('role-code') : undefined}
                {...register('code')}
              />
            </FormField>
            <FormField id="role-nom" label="Nom" error={errors.nom?.message}>
              <Input
                id="role-nom"
                autoComplete="off"
                placeholder="Administrateur fonctionnel"
                hasError={Boolean(errors.nom)}
                aria-describedby={errors.nom ? errorId('role-nom') : undefined}
                {...register('nom')}
              />
            </FormField>
          </div>

          <FormField id="role-description" label="Description" error={errors.description?.message}>
            <textarea
              id="role-description"
              rows={3}
              placeholder="Accès complet au socle transverse."
              aria-invalid={Boolean(errors.description) || undefined}
              aria-describedby={errors.description ? errorId('role-description') : undefined}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs placeholder:text-slate-400 hover:border-slate-400 focus-visible:border-brand-600"
              {...register('description')}
            />
          </FormField>

          <FormField
            id="role-niveau"
            label="Niveau de confidentialité"
            error={errors.niveauConfidentialite?.message}
          >
            <Input
              id="role-niveau"
              type="number"
              min={1}
              hasError={Boolean(errors.niveauConfidentialite)}
              aria-describedby={
                errors.niveauConfidentialite ? errorId('role-niveau') : undefined
              }
              {...register('niveauConfidentialite', { valueAsNumber: true })}
            />
          </FormField>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="size-4 rounded border-slate-300 text-brand-600"
              {...register('actif')}
            />
            Rôle actif
          </label>

          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {isEditing ? 'Enregistrer' : 'Créer le rôle'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
