import type { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  hasError?: boolean
  /** `glass` : champ souligné sur surface translucide sombre. */
  variant?: 'solid' | 'glass'
}

const baseClasses = 'h-10 w-full text-sm transition-colors disabled:cursor-not-allowed'

const variantClasses = {
  solid: 'rounded-lg border bg-white px-3 text-slate-900 shadow-xs placeholder:text-slate-400 disabled:bg-slate-50',
  glass:
    'border-0 border-b bg-transparent px-3 text-white placeholder:text-white/45 focus-visible:outline-white/80 disabled:text-white/50',
}

const borderClasses = {
  solid: {
    normal: 'border-slate-300 hover:border-slate-400 focus-visible:border-brand-600',
    error: 'border-red-400 focus-visible:outline-red-500',
  },
  glass: {
    normal: 'border-white/35 hover:border-white/60 focus-visible:border-white',
    error: 'border-red-300',
  },
}

export function Input({ hasError = false, variant = 'solid', className, ...props }: InputProps) {
  return (
    <input
      aria-invalid={hasError || undefined}
      className={cn(
        baseClasses,
        variantClasses[variant],
        borderClasses[variant][hasError ? 'error' : 'normal'],
        className,
      )}
      {...props}
    />
  )
}
