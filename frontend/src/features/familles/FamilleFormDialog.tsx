import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogContent } from '@/components/ui/Dialog'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { errorId } from '@/lib/form'
import type { FamilleImpact } from '@/types'
import { CarteOsm } from './CarteOsm'
import { RechercheLieu } from './RechercheLieu'
import { emptyFamilleForm, familleSchema, valuesFromFamille, type FamilleFormValues } from './schema'

type PersonneOption = { idPersonne: string; prenom: string; nom: string }

type FamilleFormDialogProps = {
  open: boolean
  famille?: FamilleImpact | null
  personnes?: PersonneOption[]
  errorMessage?: string
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: FamilleFormValues) => void
}

export function FamilleFormDialog({
  open,
  famille,
  personnes = [],
  errorMessage,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: FamilleFormDialogProps) {
  const isEditing = Boolean(famille)
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FamilleFormValues>({
    resolver: zodResolver(familleSchema),
    defaultValues: emptyFamilleForm,
  })

  useEffect(() => {
    if (!open) return
    reset(famille ? valuesFromFamille(famille) : emptyFamilleForm)
  }, [open, famille, reset])

  const latitude = watch('latitude')
  const longitude = watch('longitude')
  const position =
    latitude != null && longitude != null ? { latitude, longitude } : null
  const [vol, setVol] = useState<{ latitude: number; longitude: number; cle: number } | null>(null)

  function placer(latitudeChoisie: number, longitudeChoisie: number, voler = false) {
    setValue('latitude', latitudeChoisie, { shouldValidate: true })
    setValue('longitude', longitudeChoisie, { shouldValidate: true })
    if (voler) {
      setVol({ latitude: latitudeChoisie, longitude: longitudeChoisie, cle: Date.now() })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={isEditing ? 'Modifier la famille d’impact' : 'Nouvelle famille d’impact'}
        description="La famille apparaîtra automatiquement dans le menu latéral."
      >
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          {errorMessage && (
            <Alert variant="error" title="Enregistrement impossible">
              {errorMessage}
            </Alert>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="famille-code" label="Code" error={errors.code?.message}>
              <Input
                id="famille-code"
                autoComplete="off"
                placeholder="BATISSEURS"
                hasError={Boolean(errors.code)}
                aria-describedby={errors.code ? errorId('famille-code') : undefined}
                {...register('code')}
              />
            </FormField>
            <FormField id="famille-nom" label="Nom" error={errors.nom?.message}>
              <Input
                id="famille-nom"
                autoComplete="off"
                placeholder="Bâtisseurs"
                hasError={Boolean(errors.nom)}
                aria-describedby={errors.nom ? errorId('famille-nom') : undefined}
                {...register('nom')}
              />
            </FormField>
          </div>

          <FormField
            id="famille-position"
            label="Position sur la carte"
            error={errors.latitude?.message}
          >
            <p id="famille-position-aide" className="mb-2 text-xs text-slate-500">
              Recherchez un quartier, ou cliquez pour placer la famille. La carte est en 3D : maintenez le clic droit pour tourner. Sans position, elle n'apparaît pas sur l'accueil.
            </p>
            <RechercheLieu
              onChoisir={(lieu) => placer(lieu.latitude, lieu.longitude, true)}
            />
            {open && (
              <CarteOsm
                marqueurs={[]}
                selection={position}
                vol={vol}
                hauteur="h-72"
                onChoisir={(lat, lng) => placer(lat, lng)}
              />
            )}
            <div className="mt-2 flex items-center justify-between gap-3 text-xs text-slate-500">
              <span>
                {position ? `${position.latitude}, ${position.longitude}` : 'Aucune position'}
              </span>
              {position && (
                <button
                  type="button"
                  className="font-medium text-brand-700 hover:underline"
                  onClick={() => {
                    setValue('latitude', null, { shouldValidate: true })
                    setValue('longitude', null, { shouldValidate: true })
                  }}
                >
                  Retirer la position
                </button>
              )}
            </div>
          </FormField>

          <FormField id="famille-zone" label="Zone" error={errors.zone?.message}>
            <Input
              id="famille-zone"
              autoComplete="off"
              placeholder="Nord"
              hasError={Boolean(errors.zone)}
              aria-describedby={errors.zone ? errorId('famille-zone') : undefined}
              {...register('zone')}
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="famille-responsable" label="Responsable" error={errors.responsableId?.message}>
              <Select id="famille-responsable" {...register('responsableId')}>
                <option value="">Aucun</option>
                {personnes.map((personne) => (
                  <option key={personne.idPersonne} value={personne.idPersonne}>
                    {personne.prenom} {personne.nom}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField id="famille-adjoint" label="Adjoint" error={errors.adjointId?.message}>
              <Select id="famille-adjoint" hasError={Boolean(errors.adjointId)} {...register('adjointId')}>
                <option value="">Aucun</option>
                {personnes.map((personne) => (
                  <option key={personne.idPersonne} value={personne.idPersonne}>
                    {personne.prenom} {personne.nom}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="famille-capacite" label="Capacité maximale" error={errors.capaciteMax?.message}>
              <Input id="famille-capacite" inputMode="numeric" placeholder="12" {...register('capaciteMax')} />
            </FormField>
            <FormField id="famille-jour" label="Jour de réunion" error={errors.jourReunion?.message}>
              <Input id="famille-jour" placeholder="Mercredi" {...register('jourReunion')} />
            </FormField>
            <FormField id="famille-heure" label="Heure de réunion" error={errors.heureReunion?.message}>
              <Input id="famille-heure" type="time" {...register('heureReunion')} />
            </FormField>
            <FormField id="famille-lieu" label="Lieu de réunion" error={errors.lieuReunion?.message}>
              <Input id="famille-lieu" placeholder="Salle nord" {...register('lieuReunion')} />
            </FormField>
          </div>

          <FormField id="famille-mission" label="Mission" error={errors.mission?.message}>
            <textarea
              id="famille-mission"
              rows={3}
              placeholder="Mission pastorale de la famille d’impact"
              aria-invalid={Boolean(errors.mission) || undefined}
              aria-describedby={errors.mission ? errorId('famille-mission') : undefined}
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
            Famille active
          </label>

          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {isEditing ? 'Enregistrer' : 'Créer la famille'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
