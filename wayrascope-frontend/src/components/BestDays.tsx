import { ArrowUpRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { BestDay } from '../lib/api'
import { formatDisplayDate } from '../utils/format'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Chip } from './ui/Chip'

export type BestDaysProps = {
  bestDays: BestDay[]
  selectedDate: string
  onSelect: (date: string) => void
}

export const BestDays = ({ bestDays, selectedDate, onSelect }: BestDaysProps) => {
  const { t } = useTranslation('common')

  return (
    <Card aria-label={t('bestDays.title')}>
      <CardHeader className="items-center justify-between">
        <CardTitle>{t('bestDays.title')}</CardTitle>
        <span className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
          {t('bestDays.subtitle')}
        </span>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {bestDays.length > 0 ? (
          bestDays.slice(0, 5).map((day) => {
            const isActive = day.date === selectedDate
            return (
              <button
                key={day.date}
                type="button"
                onClick={() => onSelect(day.date)}
                className={`group flex w-full flex-col gap-1 rounded-2xl border px-3 py-2 text-left text-xs transition hover:border-accent/50 hover:bg-accent/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:w-auto sm:min-w-[180px] ${
                  isActive
                    ? 'border-accent/80 bg-accent/15 text-accent'
                    : 'border-white/10 bg-white/60 text-slate-700 dark:bg-white/5 dark:text-slate-200'
                }`}
              >
                <span className="flex items-center justify-between gap-2 text-sm font-semibold">
                  {formatDisplayDate(day.date, 'yyyy-MM-dd')}
                  <ArrowUpRight className="h-4 w-4 opacity-70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" aria-hidden />
                </span>
                <Chip className="bg-white/10 px-2 py-0.5 text-[11px] uppercase tracking-[0.3em] text-slate-500 dark:text-slate-300">
                  {t('bestDays.score', { value: Math.round(day.score) })}
                </Chip>
                <span className="text-xs text-slate-600 dark:text-slate-300 leading-snug">{day.notes}</span>
              </button>
            )
          })
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-300">{t('bestDays.empty')}</p>
        )}
      </CardContent>
    </Card>
  )
}
