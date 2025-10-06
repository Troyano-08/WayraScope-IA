import { clsx } from 'clsx'

type LoadingPlanetProps = {
  label?: string
  size?: 'sm' | 'md'
  className?: string
}

export const LoadingPlanet = ({ label, size = 'md', className }: LoadingPlanetProps) => {
  const padding = size === 'sm' ? 'py-6' : 'py-10'
  const planetSize = size === 'sm' ? 'h-20 w-20' : 'h-28 w-28'

  return (
    <div className={clsx('flex flex-col items-center justify-center gap-4 text-center', padding, className)}>
      <div
        className={clsx(
          'relative flex items-center justify-center animate-[floaty_6s_ease-in-out_infinite]',
          planetSize
        )}
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-accent to-cyan-500 opacity-50 blur-2xl" />
        <div className="absolute inset-[10%] overflow-hidden rounded-full bg-gradient-to-br from-[#1d4ed8] via-[#0f172a] to-[#0b1020] shadow-[inset_0_0_30px_rgba(10,22,42,0.85)]">
          <div className="absolute inset-0 translate-x-[-20%] translate-y-[-15%] bg-[radial-gradient(circle_at_20%_25%,rgba(110,231,249,0.4),transparent_55%),radial-gradient(circle_at_75%_45%,rgba(59,130,246,0.5),transparent_60%)] opacity-80 animate-[spin_24s_linear_infinite]" />
        </div>
        <div className="absolute inset-[10%] rounded-full border border-white/25 opacity-60 animate-[spin_18s_linear_infinite_reverse]" />
        <div className="absolute inset-[4%] rounded-full border border-white/10 blur-[1px] opacity-40" />
        <div className="absolute inset-0 flex items-end justify-center">
          <div className="h-[10%] w-[60%] rounded-full bg-black/40 blur-sm opacity-60" />
        </div>
        <div className="absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[150%] w-[150%] -translate-x-1/2 -translate-y-1/2">
            <div className="absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 animate-[orbit_12s_linear_infinite]">
              <span className="absolute -right-3 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border border-white/25 bg-transparent shadow-[0_0_10px_rgba(255,255,255,0.35)]" />
            </div>
          </div>
        </div>
        <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80 shadow-[0_0_12px_rgba(255,255,255,0.55)]" />
      </div>
      {label && <p className="text-sm text-slate-600 dark:text-slate-300">{label}</p>}
    </div>
  )
}
