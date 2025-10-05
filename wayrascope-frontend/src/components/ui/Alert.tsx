import { clsx } from 'clsx'
import { AlertTriangle, Info, CircleCheck } from 'lucide-react'
import type { ReactNode } from 'react'

export type AlertVariant = 'info' | 'error' | 'warning' | 'success'

type AlertProps = {
  title?: string
  description?: ReactNode
  variant?: AlertVariant
  actions?: ReactNode
  className?: string
}

const VARIANT_STYLES: Record<AlertVariant, string> = {
  info: 'border-cyan-400/40 bg-cyan-500/10 text-cyan-900 dark:text-cyan-100',
  error: 'border-rose-500/40 bg-rose-500/10 text-rose-900 dark:text-rose-100',
  warning: 'border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-100',
  success: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100'
}

const VariantIcon: Record<AlertVariant, typeof Info> = {
  info: Info,
  error: AlertTriangle,
  warning: AlertTriangle,
  success: CircleCheck
}

export const Alert = ({ title, description, variant = 'info', actions, className }: AlertProps) => {
  const Icon = VariantIcon[variant]

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={clsx('glass-card flex gap-3 border-2 border-dashed', VARIANT_STYLES[variant], className)}
    >
      <Icon className="mt-0.5 h-5 w-5 flex-none" aria-hidden />
      <div className="flex-1 space-y-1 text-sm">
        {title && <p className="font-semibold uppercase tracking-wide text-xs text-slate-800 dark:text-white/80">{title}</p>}
        {description && <div className="leading-relaxed text-slate-700 dark:text-white/85">{description}</div>}
      </div>
      {actions && <div className="flex flex-none items-center gap-2">{actions}</div>}
    </div>
  )
}
