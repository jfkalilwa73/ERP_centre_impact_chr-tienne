import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogContent } from '@/components/ui/Dialog'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { errorId } from '@/lib/form'
import type { Permission } from '@/types'
import { emptyPermissionForm, permissionSchema, type PermissionFormValues } from './schema'

type PermissionFormDialogProps = {
  open: boolean
  permission?: Permission | null
  errorMessage?: string
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: PermissionFormValues) => void
}

export function PermissionFormDialog({
  open,
  permission,
  errorMessage,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: PermissionFormDialogProps) {
  const isEditing = Boolean(permission)
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PermissionFormValues>({
    resolver: zodResolver(permissionSchema),
    defaultValues: emptyPermissionForm,
  })

  const moduleValue = watch('module')
  const actionValue = watch('action')

  useEffect(() => {
    if (!open) return
    reset(
      permission
        ? {
            module: permission.module,
            action: permission.action,
            code: permission.code,
            description: permission.description ?? '',
            actif: permission.actif ?? true,
          }
        : emptyPermissionForm,
    )
  }, [open, permission, reset])

  useEffect(() => {
    if (!open || isEditing) return
    const modulePart = moduleValue.trim().toLowerCase()
    const actionPart = actionValue.trim().toLowerCase()
    if (modulePart && actionPart) {
      setValue('code', `${modulePart}.${actionPart}`, { shouldValidate: false })
    }
  }, [actionValue, isEditing, moduleValue, open, setValue])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={isEditing ? 'Modifier la permission' : 'Nouvelle permission'}
        description="Le code suit le motif module.action, par exemple membres.read."
      >
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          {errorMessage && (
            <Alert variant="error" title="Enregistrement impossible">
              {errorMessage}
            </Alert>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="permission-module" label="Module" error={errors.module?.message}>
              <Input
                id="permission-module"
                autoComplete="off"
                placeholder="membres"
                hasError={Boolean(errors.module)}
                aria-describedby={errors.module ? errorId('permission-module') : undefined}
                {...register('module')}
              />
            </FormField>
            <FormField id="permission-action" label="Action" error={errors.action?.message}>
              <Input
                id="permission-action"
                autoComplete="off"
                placeholder="read"
                hasError={Boolean(errors.action)}
                aria-describedby={errors.action ? errorId('permission-action') : undefined}
                {...register('action')}
              />
            </FormField>
          </div>

          <FormField id="permission-code" label="Code" error={errors.code?.message}>
            <Input
              id="permission-code"
              autoComplete="off"
              placeholder="membres.read"
              hasError={Boolean(errors.code)}
              aria-describedby={errors.code ? errorId('permission-code') : undefined}
              {...register('code')}
            />
          </FormField>

          <FormField
            id="permission-description"
            label="Description"
            error={errors.description?.message}
          >
            <Input
              id="permission-description"
              autoComplete="off"
              placeholder="Consulter les personnes"
              hasError={Boolean(errors.description)}
              aria-describedby={
                errors.description ? errorId('permission-description') : undefined
              }
              {...register('description')}
            />
          </FormField>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="size-4 rounded border-slate-300 text-brand-600"
              {...register('actif')}
            />
            Permission active
          </label>

          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {isEditing ? 'Enregistrer' : 'Créer la permission'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
