import { useSyncExternalStore, type ReactNode } from 'react'
import { listCirculations, subscribeCirculations, getCirculationsVersion } from '@/features/notifications/circulation'
import { decisionStatutLabel, getDecisionsVersion, listDecisions, subscribeDecisions } from './decisions'
import { getRapportsVersion, listRapportsConsolides, subscribeRapports } from './rapports'

export type UnitePilotage = { id: string; nom: string }

export function PilotageConsolide({
  unites,
  chefs = {},
  titre = 'Vue consolidée',
  entete = true,
}: {
  unites: UnitePilotage[]
  chefs?: Record<string, string>
  titre?: string
  entete?: boolean
}) {
  useSyncExternalStore(subscribeRapports, getRapportsVersion, getRapportsVersion)
  useSyncExternalStore(subscribeDecisions, getDecisionsVersion, getDecisionsVersion)
  useSyncExternalStore(subscribeCirculations, getCirculationsVersion, getCirculationsVersion)

  const ids = unites.map((item) => item.id)
  const decisions = listDecisions(ids)
  const circulations = listCirculations().filter(
    (item) =>
      ids.includes(item.idDepartementSource) ||
      ids.includes(item.idDepartementCible) ||
      item.idDepartementSource === 'dge',
  )
  const alertes = circulations.filter((item) => item.kind === 'alerte' || item.kind === 'rappel')
  const demandes = circulations.filter((item) => item.kind === 'demande' || item.kind === 'budget')
  const rapports = listRapportsConsolides(ids)

  return (
    <section className="flex flex-col gap-6">
      {entete && (
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{titre}</h2>
          <p className="mt-1 text-sm text-slate-500">
            Activités, finances, projets, décisions, risques, alertes, objectifs, rapports et indicateurs.
          </p>
        </div>
      )}

      {Object.keys(chefs).length > 0 && (
        <PilotageBloc title="Responsables supervisés" hint="Chefs des unités de ce périmètre.">
          <ul className="divide-y divide-slate-100">
            {unites.map((unite) => (
              <li key={unite.id} className="flex justify-between gap-3 px-4 py-3 text-sm">
                <span className="text-slate-900">{unite.nom}</span>
                <span className="text-slate-500">{chefs[unite.id] ?? 'Chef non désigné'}</span>
              </li>
            ))}
          </ul>
        </PilotageBloc>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <PilotageBloc title="Décisions" hint="Suivi des décisions de gouvernance.">
          <Liste
            empty="Aucune décision dans ce périmètre."
            rows={decisions.map((item) => ({
              id: item.id,
              titre: `${item.reference} — ${item.texte}`,
              meta: `${item.instance} · ${decisionStatutLabel(item.statut)} · ${item.echeance}`,
            }))}
          />
        </PilotageBloc>
        <PilotageBloc title="Rapports" hint="Comptes rendus transmis ou encore en brouillon.">
          <Liste
            empty="Aucun rapport dans ce périmètre."
            rows={rapports.map((item) => ({
              id: item.id,
              titre: item.titre,
              meta: `${item.nomDepartementSource} · ${item.statut === 'transmis' ? 'Transmis' : 'Brouillon'} · ${item.date}`,
            }))}
          />
        </PilotageBloc>
        <PilotageBloc title="Alertes" hint="Échéances, présence et budget serré.">
          <Liste
            empty="Aucune alerte pour le moment."
            rows={alertes.map((item) => ({
              id: item.id,
              titre: item.titre,
              meta: `${item.nomDepartementSource} · ${item.description}`,
            }))}
          />
        </PilotageBloc>
      </div>

      <PilotageBloc title="Demandes" hint="Demandes du DGE et demandes de budget.">
        <Liste
          empty="Aucune demande en circulation."
          rows={demandes.map((item) => ({
            id: item.id,
            titre: item.titre,
            meta: `${item.nomDepartementSource} → ${item.nomDepartementCible} · ${item.description}`,
          }))}
        />
      </PilotageBloc>
    </section>
  )
}

function PilotageBloc({
  title,
  hint,
  children,
}: {
  title: string
  hint: string
  children: ReactNode
}) {
  return (
    <section className="border border-slate-100 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
      <div className="border-b border-slate-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <p className="mt-0.5 text-xs text-slate-500">{hint}</p>
      </div>
      {children}
    </section>
  )
}

function Liste({ empty, rows }: { empty: string; rows: { id: string; titre: string; meta: string }[] }) {
  if (rows.length === 0) {
    return <p className="px-4 py-8 text-center text-sm text-slate-500">{empty}</p>
  }
  return (
    <ul className="divide-y divide-slate-100">
      {rows.map((row) => (
        <li key={row.id} className="px-4 py-3">
          <p className="text-sm font-medium text-slate-900">{row.titre}</p>
          <p className="mt-0.5 text-xs text-slate-500">{row.meta}</p>
        </li>
      ))}
    </ul>
  )
}
