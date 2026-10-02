type ComingSoonPageProps = {
  title: string
  description?: string
}

export function ComingSoonPage({ title, description }: ComingSoonPageProps) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
      <p className="max-w-xl text-sm leading-relaxed text-slate-500">
        {description ?? 'Cette section fait partie du socle Phase 0 et sera branchée ensuite.'}
      </p>
    </div>
  )
}
