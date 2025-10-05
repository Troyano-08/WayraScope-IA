import { clsx } from 'clsx'
import type { ButtonHTMLAttributes } from 'react'

export type ToggleProps = {
  pressed?: boolean
  label: string
} & ButtonHTMLAttributes<HTMLButtonElement>

export const Toggle = ({ pressed = false, label, className, ...props }: ToggleProps) => (
  <button
    type="button"
    role="switch"
    aria-checked={pressed}
    className={clsx(
      'inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 text-xs font-medium transition dark:border-white/10',
      pressed
        ? 'bg-accent/20 text-accent border-accent/50'
        : 'bg-white/70 text-slate-700 hover:border-accent/40 dark:bg-white/5 dark:text-slate-200',
      className
    )}
    {...props}
  >
    <span className="h-2 w-2 rounded-full bg-current" aria-hidden />
    {label}
  </button>
)
