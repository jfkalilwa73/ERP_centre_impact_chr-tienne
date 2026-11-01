import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { ChargementCentre } from '@/components/ui/Chargement'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useAuditLogs } from './hooks'
import { entiteTypeLabels, labelAction, labelEntiteType } from './labels'

const PAGE_SIZE = 20

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value),
  )
}

export function AuditPage() {
  const [actionFilter, setActionFilter] = useState('')
  const [submittedAction, setSubmittedAction] = useState('')
  const [entiteType, setEntiteType] = useState('')
  const [page, setPage] = useState(1)

  const listParams = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      action: submittedAction || undefined,
      entiteType: entiteType || undefined,
    }),
    [entiteType, page, submittedAction],
  )
  const logsQuery = useAuditLogs(listParams)

  const logs = logsQuery.data?.data ?? []
  const pagination = logsQuery.data?.pagination
  const totalPages = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.limit)) : 1

  const handleSearch = (event: FormEvent) => {
    event.preventDefault()
    setPage(1)
    setSubmittedAction(actionFilter.trim())
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Audit</h1>
        <p className="mt-1 text-sm text-slate-500">
          Consultation des traces : aucune écriture n'est possible depuis l'interface.
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex flex-col gap-2 sm:flex-row">
        <div className="relative max-w-sm flex-1">
          <Search
            className="pointer-events-none absolute inset-y-0 left-3 my-auto size-4 text-slate-400"
            aria-hidden="true"
          />
          <Input
            value={actionFilter}
            onChange={(event) => setActionFilter(event.target.value)}
            placeholder="Filtrer par action (ex. SITE_CREATED)"
            aria-label="Filtrer par action"
            className="pl-9"
          />
        </div>
        <Select
          value={entiteType}
          onChange={(event) => {
            setPage(1)
            setEntiteType(event.target.value)
          }}
          aria-label="Filtrer par type d'entité"
          className="sm:w-56"
        >
          <option value="">Tous les types</option>
          {Object.entries(entiteTypeLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Button type="submit" variant="secondary">
          Filtrer
        </Button>
      </form>

      {logsQuery.isError && (
        <Alert variant="error" title="Impossible de charger l'audit">
          {logsQuery.error.message}
        </Alert>
      )}

      {logsQuery.isLoading && <ChargementCentre label="Chargement des traces…" />}

      {logsQuery.isSuccess && logs.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <p className="font-medium text-slate-900">Aucune trace</p>
          <p className="mt-1 text-sm text-slate-500">
            {submittedAction || entiteType
              ? 'Aucun résultat pour ces critères.'
              : "Aucune trace n'a encore été enregistrée."}
          </p>
        </div>
      )}

      {logs.length > 0 && (
        <>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">Entité</th>
                  <th className="hidden px-4 py-3 font-medium lg:table-cell">IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.idAudit} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 text-slate-600">{formatDateTime(log.dateAction)}</td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/audit/${log.idAudit}`}
                        className="font-medium text-brand-700 hover:text-brand-800"
                      >
                        {labelAction(log.action)}
                      </Link>
                      <p className="mt-0.5 font-mono text-xs text-slate-400">{log.action}</p>
                    </td>
                    <td className="hidden px-4 py-3 text-slate-600 sm:table-cell">
                      <p>{labelEntiteType(log.entiteType)}</p>
                      <p className="font-mono text-xs text-slate-400">{log.idEntite.slice(0, 8)}</p>
                    </td>
                    <td className="hidden px-4 py-3 font-mono text-xs text-slate-500 lg:table-cell">
                      {log.adresseIp ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination && pagination.total > PAGE_SIZE && (
            <div className="flex items-center justify-between text-sm text-slate-500">
              <p>
                {pagination.total} trace{pagination.total > 1 ? 's' : ''} · page {pagination.page} /{' '}
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
    </div>
  )
}
