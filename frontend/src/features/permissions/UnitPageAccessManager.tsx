import { useState } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { ChargementCentre } from '@/components/ui/Chargement'
import { Select } from '@/components/ui/Select'
import { useDepartements } from '@/features/departements/hooks'
import { useFamilles } from '@/features/familles/hooks'
import { usePersonneAffectations, usePersonneFamilles, usePersonnes } from '@/features/personnes/hooks'
import { UnitPageAccessDialog } from '@/features/auth/UnitPageAccessDialog'
import { useUnitPageAccess, type UnitAccessKind } from '@/features/auth/unitPageAccess'

export function UnitPageAccessManager() {
  const [kind, setKind] = useState<UnitAccessKind>('departement')
  const [unitId, setUnitId] = useState('')
  const [personneId, setPersonneId] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  const departementsQuery = useDepartements({ page: 1, limit: 100 }, kind === 'departement')
  const famillesQuery = useFamilles({ page: 1, limit: 100 }, kind === 'famille')
  const personnesQuery = usePersonnes({ page: 1, limit: 100 })
  const departementAffectationsQuery = usePersonneAffectations(
    kind === 'departement' ? personneId || undefined : undefined,
  )
  const familleAffectationsQuery = usePersonneFamilles(
    kind === 'famille' ? personneId || undefined : undefined,
  )

  const departements = departementsQuery.data?.data ?? []
  const familles = famillesQuery.data?.data ?? []
  const personnes = personnesQuery.data?.data ?? []
  const personne = personnes.find((item) => item.idPersonne === personneId)
  const unite = kind === 'departement'
    ? departements.find((item) => item.idDepartement === unitId)
    : familles.find((item) => item.idFamille === unitId)
  const uniteName = unite?.nom ?? ''
  const personneName = personne ? `${personne.prenom} ${personne.nom}`.trim() : ''
  const affectationsQuery = kind === 'departement'
    ? departementAffectationsQuery
    : familleAffectationsQuery
  const estAffecte = kind === 'departement'
    ? departementAffectationsQuery.data?.some(
        (item) => item.idDepartement === unitId && item.actif,
      ) ?? false
    : familleAffectationsQuery.data?.some(
        (item) => item.idFamille === unitId && item.actif,
      ) ?? false
  const pageAccess = useUnitPageAccess(kind, unitId || undefined, personneId || undefined)

  const changeKind = (next: UnitAccessKind) => {
    setKind(next)
    setUnitId('')
    setPersonneId('')
    setDialogOpen(false)
  }

  const changeUnit = (next: string) => {
    setUnitId(next)
    setPersonneId('')
    setDialogOpen(false)
  }

  const checkingAffectation = Boolean(personneId) && affectationsQuery.isLoading
  const canConfigure = Boolean(unitId && personne && estAffecte)

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Accès aux pages par unité</h2>
        <p className="mt-1 text-sm text-slate-500">
          Choisissez une personne affectée à un département ou à une famille, puis définissez les pages
          de son unité et les pages générales de l’application qu’elle peut ouvrir.
        </p>
      </div>

      <Alert variant="warning" title="Configuration temporaire côté interface" className="mb-4">
        Les règles sont stockées dans ce navigateur uniquement. Le backend devra les enregistrer et
        appliquer le même contrôle aux API.
      </Alert>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
          Type d’unité
          <Select value={kind} onChange={(event) => changeKind(event.target.value as UnitAccessKind)}>
            <option value="departement">Département</option>
            <option value="famille">Famille d’impact</option>
          </Select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
          {kind === 'departement' ? 'Département' : 'Famille d’impact'}
          <Select value={unitId} onChange={(event) => changeUnit(event.target.value)}>
            <option value="">Choisir une unité</option>
            {kind === 'departement'
              ? departements.map((item) => (
                  <option key={item.idDepartement} value={item.idDepartement}>
                    {item.nom}
                  </option>
                ))
              : familles.map((item) => (
                  <option key={item.idFamille} value={item.idFamille}>
                    {item.nom}
                  </option>
                ))}
          </Select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
          Personne affectée
          <Select
            value={personneId}
            onChange={(event) => setPersonneId(event.target.value)}
            disabled={!unitId || personnesQuery.isLoading}
          >
            <option value="">Choisir une personne</option>
            {personnes.map((item) => (
              <option key={item.idPersonne} value={item.idPersonne}>
                {item.prenom} {item.nom}
              </option>
            ))}
          </Select>
        </label>
      </div>

      {personnesQuery.isError && (
        <Alert variant="error" title="Impossible de charger les personnes" className="mt-4">
          {personnesQuery.error.message}
        </Alert>
      )}
      {(kind === 'departement' ? departementsQuery.isError : famillesQuery.isError) && (
        <Alert variant="error" title="Impossible de charger les unités" className="mt-4">
          {kind === 'departement'
            ? departementsQuery.error?.message
            : famillesQuery.error?.message}
        </Alert>
      )}

      {checkingAffectation && <ChargementCentre label="Vérification de l’affectation…" compact />}
      {personneId && unitId && !checkingAffectation && !estAffecte && (
        <Alert variant="warning" title="Affectation requise" className="mt-4">
          Cette personne doit être affectée activement à cette unité avant de recevoir des accès par page.
        </Alert>
      )}

      {canConfigure && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 px-4 py-3">
          <p className="text-sm text-slate-600">
            {pageAccess.configured
              ? 'Une règle personnalisée est enregistrée dans ce navigateur.'
              : 'Aucune règle personnalisée : les droits habituels du rôle s’appliquent.'}
          </p>
          <Button onClick={() => setDialogOpen(true)}>Configurer les pages</Button>
        </div>
      )}

      {dialogOpen && estAffecte && unite && personne && (
        <UnitPageAccessDialog
          open
          kind={kind}
          unitId={unitId}
          unitName={uniteName}
          personneId={personne.idPersonne}
          personneName={personneName}
          onOpenChange={setDialogOpen}
        />
      )}
    </section>
  )
}
