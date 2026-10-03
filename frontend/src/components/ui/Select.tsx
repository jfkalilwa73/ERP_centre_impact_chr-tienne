import type { SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  hasError?: boolean
}

export function Select({ hasError = false, className, children, ...props }: SelectProps) {
  return (
    <select
      aria-invalid={hasError || undefined}
      className={cn(
        'h-10 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 shadow-xs',
        'transition-colors disabled:cursor-not-allowed disabled:bg-slate-50',
        hasError
          ? 'border-red-400 focus-visible:outline-red-500'
          : 'border-slate-300 hover:border-slate-400 focus-visible:border-brand-600',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  )
}
