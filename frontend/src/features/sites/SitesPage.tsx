import { useMemo, useState, type FormEvent } from 'react'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogContent } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { PERMISSIONS } from '@/lib/permissions'
import { useHasPermission } from '@/stores/authStore'
import type { Site } from '@/types'
import { SiteFormDialog } from './SiteFormDialog'
import { useCreateSite, useDeleteSite, useSites, useUpdateSite } from './hooks'
import { toSiteCreate, toSiteUpdate, type SiteFormValues } from './schema'

const PAGE_SIZE = 20

function formatDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(value))
}

export function SitesPage() {
  const [searchInput, setSearchInput] = useState('')
  const [submittedSearch, setSubmittedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [editingSite, setEditingSite] = useState<Site | null>(null)
  const [siteToDelete, setSiteToDelete] = useState<Site | null>(null)

  const canCreate = useHasPermission(PERMISSIONS.SITES_CREATE) || useHasPermission(PERMISSIONS.ROLES_MANAGE)
  const canUpdate = useHasPermission(PERMISSIONS.SITES_UPDATE)
  const canDelete = useHasPermission(PERMISSIONS.SITES_DELETE)

  const listParams = useMemo(
    () => ({ page, limit: PAGE_SIZE, q: submittedSearch || undefined }),
    [page, submittedSearch],
  )
  const sitesQuery = useSites(listParams)
  const createMutation = useCreateSite()
  const updateMutation = useUpdateSite()
  const deleteMutation = useDeleteSite()

  const sites = sitesQuery.data?.data ?? []
  const pagination = sitesQuery.data?.pagination
  const totalPages = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.limit)) : 1

  const openCreate = () => {
    setEditingSite(null)
    createMutation.reset()
    updateMutation.reset()
    setFormOpen(true)
  }

  const openEdit = (site: Site) => {
    setEditingSite(site)
    createMutation.reset()
    updateMutation.reset()
    setFormOpen(true)
  }

  const handleSearch = (event: FormEvent) => {
    event.preventDefault()
    setPage(1)
    setSubmittedSearch(searchInput.trim())
  }

  const handleFormSubmit = (values: SiteFormValues) => {
    if (editingSite) {
      updateMutation.mutate(
        { siteId: editingSite.idSite, payload: toSiteUpdate(values) },
        { onSuccess: () => setFormOpen(false) },
      )
      return
    }

    createMutation.mutate(toSiteCreate(values), {
      onSuccess: () => setFormOpen(false),
    })
  }

  const formError = editingSite ? updateMutation.error?.message : createMutation.error?.message
  const isSubmitting = createMutation.isPending || updateMutation.isPending

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Sites</h1>
          <p className="mt-1 text-sm text-slate-500">
            Lieux d'implantation de l'Église, avec leur numéro d'accueil.
          </p>
        </div>
        {canCreate && (
          <Button onClick={openCreate}>
            <Plus className="size-4" aria-hidden="true" />
            Nouveau site
          </Button>
        )}
      </div>

      <form onSubmit={handleSearch} className="flex gap-2" role="search">
        <div className="relative max-w-sm flex-1">
          <Search
            className="pointer-events-none absolute inset-y-0 left-3 my-auto size-4 text-slate-400"
            aria-hidden="true"
          />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Rechercher un site…"
            aria-label="Rechercher un site"
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="secondary">
          Rechercher
        </Button>
      </form>

      {sitesQuery.isError && (
        <Alert variant="error" title="Impossible de charger les sites">
          {sitesQuery.error.message}
        </Alert>
      )}

      {sitesQuery.isLoading && <p className="text-sm text-slate-500">Chargement des sites…</p>}

      {sitesQuery.isSuccess && sites.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <p className="font-medium text-slate-900">Aucun site</p>
          <p className="mt-1 text-sm text-slate-500">
            {submittedSearch
              ? 'Aucun résultat pour cette recherche.'
              : "Aucun site n'est encore enregistré."}
          </p>
        </div>
      )}

      {sites.length > 0 && (
        <>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Code</th>
                  <th className="px-4 py-3 font-medium">Nom</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">Ville</th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">Téléphone</th>
                  <th className="hidden px-4 py-3 font-medium lg:table-cell">Créé le</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  {(canUpdate || canDelete) && (
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {sites.map((site) => (
                  <tr key={site.idSite} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{site.code}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{site.nom}</p>
                      <p className="text-xs text-slate-500 sm:hidden">{site.ville}</p>
                    </td>
                    <td className="hidden px-4 py-3 text-slate-600 sm:table-cell">{site.ville ?? '—'}</td>
                    <td className="hidden px-4 py-3 text-slate-600 md:table-cell">{site.telephone}</td>
                    <td className="hidden px-4 py-3 text-slate-500 lg:table-cell">
                      {formatDate(site.dateCreation)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          site.actif
                            ? 'rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700'
                            : 'rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500'
                        }
                      >
                        {site.actif ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    {(canUpdate || canDelete) && (
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          {canUpdate && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEdit(site)}
                              aria-label={`Modifier ${site.nom}`}
                            >
                              <Pencil className="size-4" aria-hidden="true" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                deleteMutation.reset()
                                setSiteToDelete(site)
                              }}
                              aria-label={`Supprimer ${site.nom}`}
                              className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            >
                              <Trash2 className="size-4" aria-hidden="true" />
                            </Button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination && pagination.total > PAGE_SIZE && (
            <div className="flex items-center justify-between text-sm text-slate-500">
              <p>
                {pagination.total} site{pagination.total > 1 ? 's' : ''} · page {pagination.page} /{' '}
                {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => current - 1)}
                >
                  Précédent
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <SiteFormDialog
        open={formOpen}
        site={editingSite}
        errorMessage={formError}
        isSubmitting={isSubmitting}
        onOpenChange={setFormOpen}
        onSubmit={handleFormSubmit}
      />

      <Dialog open={Boolean(siteToDelete)} onOpenChange={(open) => !open && setSiteToDelete(null)}>
        <DialogContent
          title="Supprimer ce site ?"
          description="Le contrat n'autorise la suppression que si aucun département n'y est rattaché."
        >
          {deleteMutation.isError && (
            <Alert variant="error" title="Suppression impossible">
              {deleteMutation.error.message}
            </Alert>
          )}
          <p className="text-sm text-slate-600">
            {siteToDelete?.nom} ({siteToDelete?.code}) sera retiré définitivement.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setSiteToDelete(null)}>
              Annuler
            </Button>
            <Button
              variant="danger"
              isLoading={deleteMutation.isPending}
              onClick={() => {
                if (!siteToDelete) return
                deleteMutation.mutate(siteToDelete.idSite, {
                  onSuccess: () => setSiteToDelete(null),
                })
              }}
            >
              Supprimer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
