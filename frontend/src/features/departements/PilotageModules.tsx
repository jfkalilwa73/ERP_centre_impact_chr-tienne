import { PERMISSIONS, type PermissionCode } from '@/lib/permissions'

type PilotageModule = {
  label: string
  hint: string
  permission: PermissionCode
}

const MODULES: PilotageModule[] = [
  { label: 'Projets', hint: 'Projets rattachés à l’unité', permission: PERMISSIONS.PROJETS_READ },
]

type PilotageModulesProps = {
  permissions: readonly string[]
}

export function PilotageModules({ permissions }: PilotageModulesProps) {
  const visible = MODULES.filter((item) => permissions.includes(item.permission))
  if (visible.length === 0) return null

  return (
    <section>
      <h2 className="text-sm font-semibold text-slate-900">Pilotage prévu</h2>
      <p className="mt-1 text-xs text-slate-500">
        Modules du cahier des charges pour ce rôle. Les écrans arrivent ensuite.
      </p>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {visible.map((item) => (
          <li key={item.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-slate-900">{item.label}</p>
              <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-slate-500 uppercase">
                Bientôt
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">{item.hint}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
