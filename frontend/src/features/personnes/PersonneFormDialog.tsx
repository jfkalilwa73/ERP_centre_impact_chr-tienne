import { useEffect } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogContent } from '@/components/ui/Dialog'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { errorId } from '@/lib/form'
import type { FamilleImpact, Personne } from '@/types'
import { familleLabel } from './familles'
import {
  FORMATIONS,
  STATUT_CIVIL_LABELS,
  TYPES_LIEN,
  getFicheComplement,
  type FicheComplement,
} from './fiche'
import { formatDateLong } from './labels'
import {
  emptyPersonneEditForm,
  personneEditSchema,
  type PersonneEditFormValues,
} from './schema'

type PersonneFormDialogProps = {
  open: boolean
  personne?: Personne | null
  personnes?: Personne[]
  familles?: FamilleImpact[]
  currentFamilleId?: string
  errorMessage?: string
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: PersonneEditFormValues) => void
}

function valuesFromPersonne(
  personne: Personne,
  complement: FicheComplement,
  currentFamilleId?: string,
): PersonneEditFormValues {
  return {
    nom: personne.nom,
    prenom: personne.prenom,
    dateNaissance: personne.dateNaissance ?? '',
    sexe: personne.sexe ?? '',
    telephone: personne.telephone ?? '',
    adresse: personne.adresse ?? '',
    statut: personne.statut ?? 'actif',
    statutCivil: complement.statutCivil,
    competences: complement.competences,
    idFamille: currentFamilleId ?? '',
    liens: complement.liens,
    certificatBaptemeNom: complement.certificatBaptemeNom,
    formation001: complement.formations['001'],
    formation101: complement.formations['101'],
    formation201: complement.formations['201'],
  }
}

export function PersonneFormDialog({
  open,
  personne,
  personnes = [],
  familles = [],
  currentFamilleId,
  errorMessage,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: PersonneFormDialogProps) {
  const isEditing = Boolean(personne)
  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PersonneEditFormValues>({
    resolver: zodResolver(personneEditSchema),
    defaultValues: emptyPersonneEditForm,
  })
  const liens = useFieldArray({ control, name: 'liens' })
  const certificatNom = watch('certificatBaptemeNom')

  useEffect(() => {
    if (!open) return
    reset(
      personne
        ? valuesFromPersonne(personne, getFicheComplement(personne.idPersonne), currentFamilleId)
        : emptyPersonneEditForm,
    )
    // currentFamilleId est lu à l'ouverture : ne pas reset si l'affectation change en cours d'édition.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ouverture uniquement
  }, [open, personne, reset])

  const proches = personnes.filter((item) => item.idPersonne !== personne?.idPersonne)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={isEditing ? 'Modifier la personne' : 'Nouvelle personne'}
        description={
          isEditing
            ? 'Les champs civils, familiaux et de formation complètent la fiche. Seuls nom, prénom, naissance, sexe, téléphone, adresse et statut sont envoyés à l’API Phase 0.'
            : "L'identité physique est distincte du compte de connexion, qui sera créé ensuite."
        }
        className={isEditing ? 'max-h-[90vh] max-w-2xl overflow-y-auto' : undefined}
      >
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          {errorMessage && (
            <Alert variant="error" title="Enregistrement impossible">
              {errorMessage}
            </Alert>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="personne-nom" label="Nom" error={errors.nom?.message}>
              <Input
                id="personne-nom"
                autoComplete="family-name"
                placeholder="KABILA"
                hasError={Boolean(errors.nom)}
                aria-describedby={errors.nom ? errorId('personne-nom') : undefined}
                {...register('nom')}
              />
            </FormField>
            <FormField id="personne-prenom" label="Prénom" error={errors.prenom?.message}>
              <Input
                id="personne-prenom"
                autoComplete="given-name"
                placeholder="Jean"
                hasError={Boolean(errors.prenom)}
                aria-describedby={errors.prenom ? errorId('personne-prenom') : undefined}
                {...register('prenom')}
              />
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="personne-naissance" label="Date de naissance" error={errors.dateNaissance?.message}>
              <Input
                id="personne-naissance"
                type="date"
                hasError={Boolean(errors.dateNaissance)}
                aria-describedby={errors.dateNaissance ? errorId('personne-naissance') : undefined}
                {...register('dateNaissance')}
              />
            </FormField>
            <FormField id="personne-sexe" label="Sexe" error={errors.sexe?.message}>
              <Select
                id="personne-sexe"
                hasError={Boolean(errors.sexe)}
                aria-describedby={errors.sexe ? errorId('personne-sexe') : undefined}
                {...register('sexe')}
              >
                <option value="">Non renseigné</option>
                <option value="M">Homme</option>
                <option value="F">Femme</option>
              </Select>
            </FormField>
          </div>

          <FormField id="personne-telephone" label="Téléphone" error={errors.telephone?.message}>
            <Input
              id="personne-telephone"
              type="tel"
              autoComplete="tel"
              placeholder="+243810000000"
              hasError={Boolean(errors.telephone)}
              aria-describedby={errors.telephone ? errorId('personne-telephone') : undefined}
              {...register('telephone')}
            />
          </FormField>

          <FormField id="personne-adresse" label="Adresse" error={errors.adresse?.message}>
            <Input
              id="personne-adresse"
              autoComplete="street-address"
              placeholder="Kinshasa"
              hasError={Boolean(errors.adresse)}
              aria-describedby={errors.adresse ? errorId('personne-adresse') : undefined}
              {...register('adresse')}
            />
          </FormField>

          <FormField id="personne-statut" label="Statut" error={errors.statut?.message}>
            <Select
              id="personne-statut"
              hasError={Boolean(errors.statut)}
              aria-describedby={errors.statut ? errorId('personne-statut') : undefined}
              {...register('statut')}
            >
              <option value="actif">Actif</option>
              <option value="inactif">Inactif</option>
              <option value="archive">Archivé</option>
            </Select>
          </FormField>

          {!isEditing && (
            <FormField id="personne-famille" label="Famille d'impact">
              <Select id="personne-famille" {...register('idFamille')}>
                <option value="">Non affectée</option>
                {familles.map((famille) => (
                  <option key={famille.idFamille} value={famille.idFamille}>
                    {familleLabel(famille)}
                  </option>
                ))}
              </Select>
            </FormField>
          )}

          {isEditing && personne && (
            <>
              <section className="flex flex-col gap-4 border-t border-slate-200 pt-4">
                <h3 className="text-sm font-semibold text-slate-900">Détails civils & ecclésiastiques</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField id="personne-statut-civil" label="Statut civil">
                    <Select id="personne-statut-civil" {...register('statutCivil')}>
                      <option value="">Non renseigné</option>
                      {(Object.keys(STATUT_CIVIL_LABELS) as Array<keyof typeof STATUT_CIVIL_LABELS>).map(
                        (value) => (
                          <option key={value} value={value}>
                            {STATUT_CIVIL_LABELS[value]}
                          </option>
                        ),
                      )}
                    </Select>
                  </FormField>
                  <FormField id="personne-integration" label="Date d'intégration">
                    <Input
                      id="personne-integration"
                      value={formatDateLong(personne.dateCreation)}
                      disabled
                      readOnly
                    />
                  </FormField>
                  <FormField id="personne-competences" label="Compétences / Professions">
                    <Input
                      id="personne-competences"
                      placeholder="Accueil, enseignement"
                      {...register('competences')}
                    />
                  </FormField>
                  <FormField id="personne-famille" label="Famille d'impact">
                    <Select id="personne-famille" {...register('idFamille')}>
                      <option value="">Non affectée</option>
                      {familles.map((famille) => (
                        <option key={famille.idFamille} value={famille.idFamille}>
                          {familleLabel(famille)}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                </div>
              </section>

              <section className="flex flex-col gap-3 border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-slate-900">Liens familiaux (aperçu)</h3>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => liens.append({ idPersonne: '', lien: '' })}
                  >
                    <Plus className="size-4" aria-hidden="true" />
                    Ajouter un lien
                  </Button>
                </div>
                {liens.fields.length === 0 && (
                  <p className="text-sm text-slate-500">Aucun lien familial pour le moment.</p>
                )}
                {liens.fields.map((field, index) => (
                  <div key={field.id} className="grid gap-2 sm:grid-cols-[1fr_10rem_auto]">
                    <Select aria-label={`Personne liée ${index + 1}`} {...register(`liens.${index}.idPersonne`)}>
                      <option value="">Choisir une personne</option>
                      {proches.map((proche) => (
                        <option key={proche.idPersonne} value={proche.idPersonne}>
                          {proche.prenom} {proche.nom}
                        </option>
                      ))}
                    </Select>
                    <Select aria-label={`Type de lien ${index + 1}`} {...register(`liens.${index}.lien`)}>
                      <option value="">Lien</option>
                      {TYPES_LIEN.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </Select>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      aria-label={`Retirer le lien ${index + 1}`}
                      onClick={() => liens.remove(index)}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                ))}
              </section>

              <section className="flex flex-col gap-3 border-t border-slate-200 pt-4">
                <h3 className="text-sm font-semibold text-slate-900">Certificat de baptême (Document PDF)</h3>
                <FormField id="personne-bapteme" label="Fichier PDF">
                  <Input
                    id="personne-bapteme"
                    type="file"
                    accept="application/pdf"
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      setValue('certificatBaptemeNom', file?.name ?? '', { shouldDirty: true })
                    }}
                  />
                </FormField>
                {certificatNom && (
                  <div className="flex items-center justify-between gap-3 text-sm text-slate-600">
                    <p>Fichier actuel : {certificatNom}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setValue('certificatBaptemeNom', '', { shouldDirty: true })}
                    >
                      Retirer
                    </Button>
                  </div>
                )}
              </section>

              <section className="flex flex-col gap-3 border-t border-slate-200 pt-4">
                <h3 className="text-sm font-semibold text-slate-900">Certifications de formation</h3>
                {FORMATIONS.map((formation) => (
                  <label key={formation.id} className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      className="size-4 rounded border-slate-300"
                      {...register(`formation${formation.id}` as const)}
                    />
                    {formation.label}
                  </label>
                ))}
              </section>
            </>
          )}

          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {isEditing ? 'Enregistrer' : 'Créer la personne'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
