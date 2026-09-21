export function DashboardBodyLoading() {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-28 animate-pulse bg-slate-200" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-72 animate-pulse bg-slate-200" />
        <div className="h-72 animate-pulse bg-slate-200" />
      </div>
    </>
  )
}

export function DepartementLoading({ label }: { label: string }) {
  return (
    <div className="flex flex-col gap-6" role="status" aria-live="polite" aria-label={label}>
      <span className="sr-only">{label}</span>
      <div className="h-52 animate-pulse rounded-2xl bg-linear-to-r from-brand-500 via-brand-600 to-brand-800 opacity-80" />
      <DashboardBodyLoading />
    </div>
  )
}

export function TableLoading({ label }: { label: string }) {
  return (
    <div
      className="overflow-hidden rounded-xl border border-slate-200 bg-white"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <span className="sr-only">{label}</span>
      <div className="h-10 animate-pulse bg-slate-100" />
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="flex gap-4 border-t border-slate-100 px-4 py-3">
          <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />
          <div className="h-4 flex-1 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
        </div>
      ))}
    </div>
  )
}
