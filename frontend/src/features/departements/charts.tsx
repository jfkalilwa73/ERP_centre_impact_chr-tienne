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

export function ChartPanel({
  title,
  hint,
  children,
}: {
  title: string
  hint?: string
  children: ReactNode
}) {
  return (
    <section className="min-w-0 rounded-none border border-slate-100 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      <div className="mt-4 h-64">{children}</div>
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
