import type { ReactNode } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { cn } from '@/lib/cn'
import { presenceFaible, SEUIL_PRESENCE_FAIBLE, type TauxPresence } from './presence'

export function ChartPanel({
  title,
  hint,
  children,
  bodyClassName,
}: {
  title: string
  hint?: string
  children: ReactNode
  bodyClassName?: string
}) {
  return (
    <section className="min-w-0 rounded-none border border-slate-100 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      <div className={cn('mt-4 h-64', bodyClassName)}>{children}</div>
    </section>
  )
}

export function EvolutionMembresChart({
  data,
}: {
  data: { mois: string; affectes: number; retraits: number }[]
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="affectes" name="Affectés" stroke="#6e2dae" strokeWidth={2} />
        <Line type="monotone" dataKey="retraits" name="Retraits" stroke="#dd1c16" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function EvolutionActivitesChart({
  data,
}: {
  data: { mois: string; planifiees: number; faites: number }[]
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="faites" name="Faites" stroke="#409d3b" strokeWidth={2} />
        <Line type="monotone" dataKey="planifiees" name="Planifiées" stroke="#ecb708" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  )
}

function initialsFromNom(nom: string) {
  const parts = nom.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase()
}

export function PresenceMembresChart({ data }: { data: TauxPresence[] }) {
  if (data.length === 0) {
    return (
      <p className="flex h-full items-center justify-center text-sm text-slate-500">
        Le taux apparaîtra dès qu’un compte rendu d’activité aura des présences.
      </p>
    )
  }

  const moyenne = Math.round(data.reduce((total, item) => total + item.taux, 0) / data.length)
  const faibles = data.filter((item) => presenceFaible(item)).length
  const membres = [...data].sort((left, right) => right.taux - left.taux || left.nom.localeCompare(right.nom, 'fr'))

  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-3xl font-semibold tracking-tight text-slate-900">{moyenne} %</p>
          <p className="mt-1 text-xs text-slate-500">Moyenne sur les activités réalisées</p>
        </div>
        <p className="text-xs text-slate-500">
          {faibles === 0
            ? 'Aucun membre sous le seuil'
            : faibles === 1
              ? '1 membre sous le seuil'
              : `${faibles} membres sous le seuil`}
        </p>
      </div>

      <ul className="space-y-5">
        {membres.map((item) => {
          const faible = presenceFaible(item)
          return (
            <li key={item.idPersonne}>
              <div className="mb-2 flex items-center gap-3">
                <span
                  className={cn(
                    'flex size-9 shrink-0 items-center justify-center text-xs font-semibold',
                    faible ? 'bg-gerbe-rouge/10 text-gerbe-rouge' : 'bg-brand-50 text-brand-700',
                  )}
                >
                  {initialsFromNom(item.nom)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{item.nom}</p>
                  <p className="text-xs text-slate-500">
                    {item.presents}/{item.convocations} activité{item.convocations > 1 ? 's' : ''}
                  </p>
                </div>
                <p
                  className={cn(
                    'text-sm font-semibold tabular-nums',
                    faible ? 'text-gerbe-rouge' : 'text-brand-700',
                  )}
                >
                  {item.taux} %
                </p>
              </div>
              <div className="relative ml-12 h-2 bg-slate-100">
                <div
                  className={cn(
                    'absolute inset-y-0 left-0',
                    faible
                      ? 'bg-gerbe-rouge'
                      : 'bg-linear-to-r from-brand-500 to-gerbe-vert',
                  )}
                  style={{ width: `${item.taux}%` }}
                />
                <span
                  className="absolute inset-y-[-3px] w-px bg-slate-300"
                  style={{ left: `${SEUIL_PRESENCE_FAIBLE}%` }}
                  title={`Seuil ${SEUIL_PRESENCE_FAIBLE} %`}
                />
              </div>
            </li>
          )
        })}
      </ul>

      <div className="mt-6 flex flex-wrap gap-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 bg-linear-to-r from-brand-500 to-gerbe-vert" />
          Présence régulière
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 bg-gerbe-rouge" />
          Sous {SEUIL_PRESENCE_FAIBLE} %
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-px bg-slate-300" />
          Seuil d’alerte
        </span>
      </div>
    </div>
  )
}

export function EffectifsDepartementsChart({
  data,
}: {
  data: { nom: string; membres: number; retraits: number }[]
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="nom" tick={{ fontSize: 12 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend />
        <Bar dataKey="membres" name="Membres" fill="#6e2dae" />
        <Bar dataKey="retraits" name="Retraits" fill="#dd1c16" />
      </BarChart>
    </ResponsiveContainer>
  )
}
