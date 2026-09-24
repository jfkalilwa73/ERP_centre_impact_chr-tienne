import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = false,
}: {
  label: string
  value: number | string
  hint: string
  icon?: LucideIcon
  accent?: boolean
}) {
  return (
    <section
      className={cn(
        'rounded-none px-5 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]',
        accent ? 'bg-brand-500 text-white' : 'border border-slate-100 bg-white',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className={cn('text-sm', accent ? 'text-white/80' : 'text-slate-500')}>{label}</p>
        {Icon && (
          <span
            className={cn(
              'flex size-8 shrink-0 items-center justify-center',
              accent ? 'bg-white/20 text-white' : 'bg-slate-50 text-slate-400',
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
          </span>
        )}
      </div>
      <p className={cn('mt-3 text-3xl font-semibold tracking-tight', accent ? 'text-white' : 'text-slate-900')}>
        {value}
      </p>
      <p className={cn('mt-3 text-sm', accent ? 'text-white/80' : 'text-slate-500')}>{hint}</p>
    </section>
  )
}
