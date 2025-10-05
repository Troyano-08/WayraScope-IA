import type { HTMLAttributes } from 'react'
import { clsx } from 'clsx'

export const Badge = ({ className, ...props }: HTMLAttributes<HTMLSpanElement>) => (
  <span className={clsx('chip bg-white/60 text-slate-700 dark:bg-white/5 dark:text-slate-200', className)} {...props} />
)
