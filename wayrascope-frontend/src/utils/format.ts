import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export const formatNasaDate = (value: string): string => {
  if (!value) return value
  if (value.includes('-')) return value
  if (value.length !== 8) return value
  const year = value.slice(0, 4)
  const month = value.slice(4, 6)
  const day = value.slice(6, 8)
  return `${year}-${month}-${day}`
}

export const formatDisplayDate = (value: string, pattern = 'dd MMM yyyy'): string => {
  try {
    return format(parseISO(value), pattern, { locale: es })
  } catch {
    return value
  }
}

export const formatHour = (value: string): string => {
  try {
    return format(new Date(value), 'HH:mm')
  } catch {
    return value
  }
}

export const mpsToKmh = (value: number): number => Number((value * 3.6).toFixed(2))

export const roundValue = (value: number, decimals = 1): number => {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

const percentFormatter = new Intl.NumberFormat('en', {
  style: 'percent',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
})

export const formatPercent = (value: number): string => percentFormatter.format(value)

export const formatProbability = (value: number | null | undefined): string =>
  value == null ? 's/d' : formatPercent(value)

type CategoryColor = {
  bg: string
  text: string
  border: string
}

const AQI_COLORS: Record<string, CategoryColor> = {
  buena: { bg: 'bg-emerald-500/10', text: 'text-emerald-300', border: 'border-emerald-500/40' },
  moderada: { bg: 'bg-amber-500/10', text: 'text-amber-300', border: 'border-amber-500/40' },
  'dañina para grupos sensibles': {
    bg: 'bg-orange-500/10',
    text: 'text-orange-300',
    border: 'border-orange-500/40'
  },
  dañina: { bg: 'bg-rose-500/10', text: 'text-rose-300', border: 'border-rose-500/40' },
  peligrosa: { bg: 'bg-red-700/20', text: 'text-red-300', border: 'border-red-500/40' }
}

export const getAqiStyles = (category: string): string => {
  const key = category.trim().toLowerCase()
  const fallback: CategoryColor = { bg: 'bg-slate-500/10', text: 'text-slate-200', border: 'border-slate-500/30' }
  const styles = AQI_COLORS[key] ?? fallback
  return `${styles.bg} ${styles.text} ${styles.border}`
}

export const comfortTone = (comfort: string): string => {
  const value = comfort.toLowerCase()
  if (value.includes('agrad')) return 'text-emerald-400'
  if (value.includes('excelente')) return 'text-emerald-300'
  if (value.includes('templado') || value.includes('bien')) return 'text-cyan-300'
  if (value.includes('calor') || value.includes('sofoc')) return 'text-amber-300'
  if (value.includes('frío') || value.includes('hel')) return 'text-sky-300'
  return 'text-slate-200'
}

export const comfortEmoji = (comfort: string): string => {
  const value = comfort.toLowerCase()
  if (value.includes('agrad')) return '🙂'
  if (value.includes('excelente')) return '😎'
  if (value.includes('templado')) return '😊'
  if (value.includes('calor') || value.includes('sofoc')) return '🥵'
  if (value.includes('frío') || value.includes('hel')) return '🥶'
  return '🤔'
}

export const trendColor = (trend: string): string => {
  const normalized = trend.trim()
  if (normalized.includes('⬆') || normalized.toLowerCase().includes('up')) return 'bg-emerald-500/10 text-emerald-300'
  if (normalized.includes('⬇') || normalized.toLowerCase().includes('down')) return 'bg-rose-500/10 text-rose-300'
  return 'bg-slate-500/10 text-slate-200'
}

export const trendIcon = (trend: string): string => {
  const normalized = trend.trim()
  if (normalized.includes('⬆') || normalized.toLowerCase().includes('up')) return '⬆️'
  if (normalized.includes('⬇') || normalized.toLowerCase().includes('down')) return '⬇️'
  return '➡️'
}

export const rangeToDates = (range: string): string[] => {
  const [start, end] = range.split(/\s*a\s*/i)
  if (!start || !end) return []
  return [formatNasaDate(start.trim()), formatNasaDate(end.trim())]
}

export const sentenceCase = (value?: string | null): string => {
  if (!value) return 's/d'
  const lower = value.toLowerCase()
  return lower.charAt(0).toUpperCase() + lower.slice(1)
}
