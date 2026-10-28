import { useEffect, useState } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogContent } from '@/components/ui/Dialog'
import { showSuccessFeedback } from '@/lib/successFeedback'
import {
  clearUnitPageRule,
  getUnitApplicationPageRule,
  getUnitPageRule,
  APPLICATION_PAGES,
  saveUnitPageRule,
  UNIT_DETAIL_PAGES,
  type UnitAccessKind,
  type UnitPageId,
} from './unitPageAccess'

type UnitPageAccessDialogProps = {
  open: boolean
  kind: UnitAccessKind
  unitId: string
  unitName: string
  personneId: string
  personneName: string
  onOpenChange: (open: boolean) => void
}

export function UnitPageAccessDialog({
  open,
  kind,
  unitId,
  unitName,
  personneId,
  personneName,
  onOpenChange,
}: UnitPageAccessDialogProps) {
  const [selectedPages, setSelectedPages] = useState<UnitPageId[]>([])
  const [configured, setConfigured] = useState(false)
  const [applicationPagesEnabled, setApplicationPagesEnabled] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    const current = getUnitPageRule(kind, unitId, personneId)
    setConfigured(current !== null)
    setSelectedPages(current ?? [])
    setApplicationPagesEnabled(
      current === null || getUnitApplicationPageRule(kind, unitId, personneId) !== null,
    )
    setError(null)
  }, [kind, open, personneId, unitId])

  const togglePage = (page: UnitPageId) => {
    setSelectedPages((current) =>
      current.includes(page) ? current.filter((item) => item !== page) : [...current, page],
    )
  }

  const save = () => {
    if (!saveUnitPageRule(kind, unitId, personneId, selectedPages, applicationPagesEnabled)) {
      setError('Le navigateur n’a pas pu enregistrer ces réglages locaux.')
      return
    }
    showSuccessFeedback('Les pages accessibles ont bien été enregistrées.')
    onOpenChange(false)
  }

  const reset = () => {
    if (!clearUnitPageRule(kind, unitId, personneId)) {
      setError('Le navigateur n’a pas pu rétablir les droits habituels du rôle.')
      return
    }
    showSuccessFeedback('Les droits du rôle ont bien été rétablis.')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="Pages accessibles"
        description={`${personneName} · ${unitName}`}
      >
        <div className="flex flex-col gap-4">
          <Alert variant="warning" title="Réglage temporaire côté interface">
            Ces choix sont enregistrés dans ce navigateur seulement. Le backend ne les applique pas encore ;
            l’API devra aussi être adaptée pour sécuriser réellement l’accès.
          </Alert>

          <p className="text-sm text-slate-600">
            Cochez les pages du tableau de bord de cette unité que cette personne peut ouvrir. Vous pouvez aussi
            appliquer une liste aux pages générales de l’application.
          </p>

          {error && <Alert variant="error" title="Enregistrement impossible">{error}</Alert>}

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-semibold text-slate-900">
              Pages du tableau de bord de l’unité
            </legend>
            {UNIT_DETAIL_PAGES.map((page) => (
              <label
                key={page.id}
                className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
              >
                <input
                  type="checkbox"
                  checked={selectedPages.includes(page.id)}
                  onChange={() => togglePage(page.id)}
                  className="size-4 rounded border-slate-300 text-brand-600"
                />
                {page.label}
              </label>
            ))}
          </fieldset>

          <label className="flex items-start gap-3 rounded-lg border border-slate-200 px-3 py-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={applicationPagesEnabled}
              onChange={(event) => setApplicationPagesEnabled(event.target.checked)}
              className="mt-0.5 size-4 rounded border-slate-300 text-brand-600"
            />
            <span>
              Appliquer aussi une règle aux pages générales de l’application
              <span className="mt-1 block text-xs text-slate-500">
                Si plusieurs unités ont une règle, une page générale est affichée lorsqu’au moins une règle active
                l’autorise.
              </span>
            </span>
          </label>

          {applicationPagesEnabled && (
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 text-sm font-semibold text-slate-900">Pages de l’application</legend>
              {APPLICATION_PAGES.map((page) => (
                <label
                  key={page.id}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={selectedPages.includes(page.id)}
                    onChange={() => togglePage(page.id)}
                    className="size-4 rounded border-slate-300 text-brand-600"
                  />
                  {page.label}
                </label>
              ))}
              <p className="text-xs text-slate-500">
                Seules les pages cochées seront affichées. Cette règle peut retirer un accès accordé par le rôle,
                mais ne peut pas accorder un droit absent du rôle.
              </p>
            </fieldset>
          )}

          {!configured && (
            <p className="text-xs text-slate-500">
              Aucun réglage spécifique n’est enregistré : les droits actuels du rôle continuent de s’appliquer
              jusqu’à votre enregistrement.
            </p>
          )}

          <div className="flex flex-wrap justify-between gap-2 pt-2">
            <div>
              {configured && (
                <Button type="button" variant="secondary" onClick={reset}>
                  Rétablir les droits du rôle
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="button" onClick={save}>
                Enregistrer
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
