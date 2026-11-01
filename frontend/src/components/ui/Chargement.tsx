import { cn } from '@/lib/cn'

export function ChargementCentre({
  label,
  page = false,
  compact = false,
}: {
  label: string
  page?: boolean
  compact?: boolean
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-center',
        compact ? 'min-h-40' : page ? 'min-h-[60vh]' : 'min-h-[calc(100dvh-22rem)]',
      )}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="flex flex-col items-center gap-4">
        <span
          className={cn('animate-spin rounded-full', compact ? 'size-10' : 'size-14')}
          style={{
            background:
              'conic-gradient(var(--color-gerbe-rouge), var(--color-gerbe-or), var(--color-gerbe-vert), var(--color-gerbe-bleu), var(--color-brand-600), var(--color-gerbe-rouge))',
            mask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), #000 0)',
            WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), #000 0)',
          }}
          aria-hidden="true"
        />
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  )
}
