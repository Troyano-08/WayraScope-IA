import { forwardRef } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { clsx } from 'clsx'

const baseStyles =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-accent px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-accent/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-50 dark:border-white/10'

const ghostStyles =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-accent/50 hover:bg-accent/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-white'

type ButtonVariant = 'solid' | 'ghost'

export type ButtonProps = {
  variant?: ButtonVariant
  leftIcon?: ReactNode
  rightIcon?: ReactNode
} & ButtonHTMLAttributes<HTMLButtonElement>

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'solid', leftIcon, rightIcon, children, type = 'button', ...props }, ref) => {
    const styles = variant === 'solid' ? baseStyles : ghostStyles

    return (
      <button ref={ref} type={type} className={clsx(styles, className)} {...props}>
        {leftIcon}
        <span>{children}</span>
        {rightIcon}
      </button>
    )
  }
)

Button.displayName = 'Button'
