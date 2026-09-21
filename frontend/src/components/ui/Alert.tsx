import type { ReactNode } from 'react'
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import { cn } from '@/lib/cn'

type AlertProps = {
  variant?: 'error' | 'info' | 'success' | 'warning'
  title?: string
  children: ReactNode
  className?: string
}

const variantClasses = {
  error: 'bg-red-50 text-red-800 border-red-200',
  info: 'bg-brand-50 text-brand-800 border-brand-200',
  success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  warning: 'bg-amber-50 text-amber-900 border-amber-200',
}

const variantIcons = {
  error: AlertCircle,
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
}

export function Alert({ variant = 'info', title, children, className }: AlertProps) {
  const Icon = variantIcons[variant]

  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={cn('flex gap-3 rounded-lg border p-3 text-sm', variantClasses[variant], className)}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="flex flex-col gap-0.5">
        {title && <p className="font-semibold">{title}</p>}
        <div>{children}</div>
      </div>
    </div>
  )
}
