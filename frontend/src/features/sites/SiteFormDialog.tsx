import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogContent } from '@/components/ui/Dialog'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { errorId } from '@/lib/form'
import type { Site } from '@/types'
import { emptySiteForm, siteSchema, type SiteFormValues } from './schema'

type SiteFormDialogProps = {
  open: boolean
  site?: Site | null
  errorMessage?: string
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: SiteFormValues) => void
}

export function SiteFormDialog({
  open,
  site,
  errorMessage,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: SiteFormDialogProps) {
  const isEditing = Boolean(site)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SiteFormValues>({
    resolver: zodResolver(siteSchema),
    defaultValues: emptySiteForm,
  })

  useEffect(() => {
    if (!open) return
    reset(
      site
        ? {
            code: site.code,
            nom: site.nom,
            telephone: site.telephone,
            adresse: site.adresse ?? '',
            ville: site.ville ?? '',
            pays: site.pays ?? '',
            actif: site.actif,
          }
        : emptySiteForm,
    )
  }, [open, site, reset])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={isEditing ? 'Modifier le site' : 'Nouveau site'}
        description="Le code identifie le site dans toute l'application. Le numéro d'accueil est obligatoire."
      >
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          {errorMessage && (
            <Alert variant="error" title="Enregistrement impossible">
              {errorMessage}
            </Alert>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="site-code" label="Code" error={errors.code?.message}>
              <Input
                id="site-code"
                autoComplete="off"
                placeholder="KIN-CENTRE"
                hasError={Boolean(errors.code)}
                aria-describedby={errors.code ? errorId('site-code') : undefined}
                {...register('code')}
              />
            </FormField>
            <FormField id="site-nom" label="Nom" error={errors.nom?.message}>
              <Input
                id="site-nom"
                autoComplete="off"
                placeholder="Site central"
                hasError={Boolean(errors.nom)}
                aria-describedby={errors.nom ? errorId('site-nom') : undefined}
                {...register('nom')}
              />
            </FormField>
          </div>

          <FormField id="site-telephone" label="Téléphone d'accueil" error={errors.telephone?.message}>
            <Input
              id="site-telephone"
              type="tel"
              autoComplete="tel"
              placeholder="+243810000001"
              hasError={Boolean(errors.telephone)}
              aria-describedby={errors.telephone ? errorId('site-telephone') : undefined}
              {...register('telephone')}
            />
          </FormField>

          <FormField id="site-adresse" label="Adresse" error={errors.adresse?.message}>
            <Input
              id="site-adresse"
              autoComplete="street-address"
              placeholder="Avenue de l'Église"
              hasError={Boolean(errors.adresse)}
              aria-describedby={errors.adresse ? errorId('site-adresse') : undefined}
              {...register('adresse')}
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="site-ville" label="Ville" error={errors.ville?.message}>
              <Input
                id="site-ville"
                autoComplete="address-level2"
                placeholder="Kinshasa"
                hasError={Boolean(errors.ville)}
                aria-describedby={errors.ville ? errorId('site-ville') : undefined}
                {...register('ville')}
              />
            </FormField>
            <FormField id="site-pays" label="Pays" error={errors.pays?.message}>
              <Input
                id="site-pays"
                autoComplete="country-name"
                placeholder="RDC"
                hasError={Boolean(errors.pays)}
                aria-describedby={errors.pays ? errorId('site-pays') : undefined}
                {...register('pays')}
              />
            </FormField>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="size-4 rounded border-slate-300 text-brand-600"
              {...register('actif')}
            />
            Site actif
          </label>

          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {isEditing ? 'Enregistrer' : 'Créer le site'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
