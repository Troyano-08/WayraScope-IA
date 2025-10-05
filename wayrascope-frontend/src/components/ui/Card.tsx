import { clsx } from 'clsx'
import type { HTMLAttributes, ReactNode } from 'react'

type CardProps = HTMLAttributes<HTMLDivElement>

type CardSectionProps = {
  children: ReactNode
  className?: string
}

export const Card = ({ className, ...props }: CardProps) => (
  <div className={clsx('glass-card transition duration-300 hover:border-accent/40', className)} {...props} />
)

export const CardHeader = ({ children, className }: CardSectionProps) => (
  <div className={clsx('mb-3 flex items-center justify-between gap-3', className)}>{children}</div>
)

export const CardTitle = ({ children, className }: CardSectionProps) => (
  <h3 className={clsx('text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300', className)}>
    {children}
  </h3>
)

export const CardContent = ({ children, className }: CardSectionProps) => (
  <div className={clsx('space-y-3 text-slate-700 dark:text-slate-100', className)}>{children}</div>
)

export const CardFooter = ({ children, className }: CardSectionProps) => (
  <div className={clsx('mt-4 border-t border-white/10 pt-4 text-sm text-slate-500 dark:text-slate-300', className)}>{children}</div>
)
