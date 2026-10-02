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
import type { Permission } from '@/types'
import { ACTION_OPTIONS, MODULE_OPTIONS, actionLabel, moduleLabel } from './labels'
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

  const moduleOptions = useMemo(() => {
    const seen = new Map(MODULE_OPTIONS)
    if (permission?.module && !seen.has(permission.module)) {
      seen.set(permission.module, moduleLabel(permission.module))
    }
    return [...seen.entries()].sort((left, right) => left[1].localeCompare(right[1], 'fr'))
  }, [permission?.module])

  const actionOptions = useMemo(() => {
    const seen = new Map(ACTION_OPTIONS)
    if (permission?.action && !seen.has(permission.action)) {
      seen.set(permission.action, actionLabel(permission.action))
    }
    return [...seen.entries()].sort((left, right) => left[1].localeCompare(right[1], 'fr'))
  }, [permission?.action])

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
    if (!open) return
    const modulePart = moduleValue.trim().toLowerCase()
    const actionPart = actionValue.trim().toLowerCase()
    if (modulePart && actionPart) {
      setValue('code', `${modulePart}.${actionPart}`, { shouldValidate: true })
    }
  }, [actionValue, moduleValue, open, setValue])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={isEditing ? 'Modifier le droit' : 'Nouveau droit'}
        description="Choisissez la rubrique, puis ce que la personne a le droit de faire."
      >
        <form
          onSubmit={handleSubmit((values) =>
            onSubmit({
              ...values,
              code: `${values.module.trim()}.${values.action.trim()}`.toLowerCase(),
            }),
          )}
          noValidate
          className="flex flex-col gap-4"
        >
          {errorMessage && (
            <Alert variant="error" title="Enregistrement impossible">
              {errorMessage}
            </Alert>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="permission-module" label="Rubrique" error={errors.module?.message}>
              <Select
                id="permission-module"
                hasError={Boolean(errors.module)}
                aria-describedby={errors.module ? errorId('permission-module') : undefined}
                {...register('module')}
              >
                <option value="">Choisir une rubrique</option>
                {moduleOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField
              id="permission-action"
              label="Ce que la personne peut faire"
              error={errors.action?.message}
            >
              <Select
                id="permission-action"
                hasError={Boolean(errors.action)}
                aria-describedby={errors.action ? errorId('permission-action') : undefined}
                {...register('action')}
              >
                <option value="">Choisir une action</option>
                {actionOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          <input type="hidden" {...register('code')} />

          <FormField
            id="permission-description"
            label="Intitulé du droit"
            error={errors.description?.message}
          >
            <Input
              id="permission-description"
              autoComplete="off"
              placeholder="Exemple : Consulter les personnes"
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
            Droit actif
          </label>

          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {isEditing ? 'Enregistrer' : 'Créer le droit'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
