import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogContent } from '@/components/ui/Dialog'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { errorId } from '@/lib/form'
import type { Departement } from '@/types'
import { emptyDepartementForm, departementSchema, type DepartementFormValues } from './schema'

type DepartementFormDialogProps = {
  open: boolean
  departement?: Departement | null
  errorMessage?: string
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: DepartementFormValues) => void
}

export function DepartementFormDialog({
  open,
  departement,
  errorMessage,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: DepartementFormDialogProps) {
  const isEditing = Boolean(departement)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DepartementFormValues>({
    resolver: zodResolver(departementSchema),
    defaultValues: emptyDepartementForm,
  })

  useEffect(() => {
    if (!open) return
    reset(
      departement
        ? {
            code: departement.code,
            nom: departement.nom,
            mission: departement.mission ?? '',
            actif: departement.actif,
          }
        : emptyDepartementForm,
    )
  }, [open, departement, reset])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={isEditing ? 'Modifier le département' : 'Nouveau département'}
        description="Le département apparaîtra automatiquement dans le menu latéral."
      >
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          {errorMessage && (
            <Alert variant="error" title="Enregistrement impossible">
              {errorMessage}
            </Alert>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="departement-code" label="Code" error={errors.code?.message}>
              <Input
                id="departement-code"
                autoComplete="off"
                placeholder="ACCUEIL"
                hasError={Boolean(errors.code)}
                aria-describedby={errors.code ? errorId('departement-code') : undefined}
                {...register('code')}
              />
            </FormField>
            <FormField id="departement-nom" label="Nom" error={errors.nom?.message}>
              <Input
                id="departement-nom"
                autoComplete="off"
                placeholder="Département Accueil"
                hasError={Boolean(errors.nom)}
                aria-describedby={errors.nom ? errorId('departement-nom') : undefined}
                {...register('nom')}
              />
            </FormField>
          </div>

          <FormField id="departement-mission" label="Mission" error={errors.mission?.message}>
            <textarea
              id="departement-mission"
              rows={3}
              placeholder="Rôle pastoral et opérationnel du département"
              aria-invalid={Boolean(errors.mission) || undefined}
              aria-describedby={errors.mission ? errorId('departement-mission') : undefined}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs placeholder:text-slate-400"
              {...register('mission')}
            />
          </FormField>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="size-4 rounded border-slate-300 text-brand-600"
              {...register('actif')}
            />
            Département actif
          </label>

          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {isEditing ? 'Enregistrer' : 'Créer le département'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
