import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { ChargementCentre } from '@/components/ui/Chargement'
import { useAuditLog } from './hooks'
import { labelAction, labelEntiteType } from './labels'

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value),
  )
}

function JsonBlock({ title, value }: { title: string; value?: object }) {
  if (!value || Object.keys(value).length === 0) {
    return (
      <div>
        <h3 className="text-xs tracking-wide text-slate-500 uppercase">{title}</h3>
        <p className="mt-2 text-sm text-slate-500">Aucune donnée.</p>
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-xs tracking-wide text-slate-500 uppercase">{title}</h3>
      <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-50 p-3 font-mono text-xs text-slate-700">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  )
}

export function AuditDetailPage() {
  const { auditId } = useParams<{ auditId: string }>()
  const logQuery = useAuditLog(auditId)
  const log = logQuery.data

  if (logQuery.isLoading) {
    return <ChargementCentre label="Chargement de la trace…" page />
  }

  if (logQuery.isError || !log) {
    return (
      <div className="flex flex-col gap-4">
        <Alert variant="error" title="Trace introuvable">
          {logQuery.error?.message ?? "Cette trace d'audit n'existe pas."}
        </Alert>
        <Link to="/audit" className="text-sm font-medium text-brand-600 hover:text-brand-700">
          Retour à l'audit
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          to="/audit"
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Audit
        </Link>
        <h1 className="mt-3 text-2xl font-semibold text-slate-900">{labelAction(log.action)}</h1>
        <p className="mt-1 font-mono text-sm text-slate-500">{log.action}</p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Contexte</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs tracking-wide text-slate-500 uppercase">Date</dt>
            <dd className="mt-1 text-sm text-slate-900">{formatDateTime(log.dateAction)}</dd>
          </div>
          <div>
            <dt className="text-xs tracking-wide text-slate-500 uppercase">Type d'entité</dt>
            <dd className="mt-1 text-sm text-slate-900">{labelEntiteType(log.entiteType)}</dd>
          </div>
          <div>
            <dt className="text-xs tracking-wide text-slate-500 uppercase">Identifiant d'entité</dt>
            <dd className="mt-1 font-mono text-xs text-slate-700">{log.idEntite}</dd>
          </div>
          <div>
            <dt className="text-xs tracking-wide text-slate-500 uppercase">Compte</dt>
            <dd className="mt-1 font-mono text-xs text-slate-700">{log.idCompte ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-xs tracking-wide text-slate-500 uppercase">Adresse IP</dt>
            <dd className="mt-1 font-mono text-xs text-slate-700">{log.adresseIp ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-xs tracking-wide text-slate-500 uppercase">User-agent</dt>
            <dd className="mt-1 text-sm break-all text-slate-900">{log.userAgent ?? '—'}</dd>
          </div>
        </dl>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <JsonBlock title="Anciennes valeurs" value={log.anciennesValeurs} />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <JsonBlock title="Nouvelles valeurs" value={log.nouvellesValeurs} />
        </div>
      </section>
    </div>
  )
}
