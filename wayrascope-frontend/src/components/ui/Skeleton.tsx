import type { HTMLAttributes } from 'react'
import { clsx } from 'clsx'

export const Skeleton = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={clsx(
      'animate-pulse rounded-xl bg-gradient-to-r from-slate-200 via-white to-slate-200 dark:from-white/5 dark:via-white/20 dark:to-white/5',
      className
    )}
    {...props}
  />
)
