import type { ReactNode } from 'react'
import { errorId } from '@/lib/form'
import { cn } from '@/lib/cn'

type FormFieldProps = {
  id: string
  label: string
  error?: string
  /** `glass` : libellés clairs sur surface translucide sombre. */
  tone?: 'default' | 'glass'
  children: ReactNode
}

const labelClasses = {
  default: 'text-slate-800',
  glass: 'text-white/85',
}

const errorClasses = {
  default: 'text-red-600',
  glass: 'text-red-200',
}

export function FormField({ id, label, error, tone = 'default', children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={cn('text-sm font-medium', labelClasses[tone])}>
        {label}
      </label>
      {children}
      {error && (
        <p id={errorId(id)} role="alert" className={cn('text-sm', errorClasses[tone])}>
          {error}
        </p>
      )}
    </div>
  )
}
