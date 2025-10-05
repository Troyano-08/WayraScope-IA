import type { HTMLAttributes } from 'react'
import { clsx } from 'clsx'

type ChipProps = HTMLAttributes<HTMLSpanElement>

export const Chip = ({ className, ...props }: ChipProps) => (
  <span
    className={clsx(
      'chip border border-white/20 bg-white/70 text-slate-800 shadow-sm ring-1 ring-white/10 dark:border-white/10 dark:bg-white/10 dark:text-slate-200',
      className
    )}
    {...props}
  />
)
