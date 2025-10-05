import { Flame, Gauge, Snowflake, ThermometerSun, Waves } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { Probabilities } from '../lib/api'
import { formatPercent, sentenceCase } from '../utils/format'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Chip } from './ui/Chip'

const probabilityConfig: Array<{
  key: keyof Probabilities
  icon: typeof Flame
  color: string
  unitKey?: string
  comparison?: 'gte' | 'lte'
}> = [
  { key: 'very_hot', icon: ThermometerSun, color: 'from-rose-500 to-orange-400', unitKey: 'temperature', comparison: 'gte' },
  { key: 'very_cold', icon: Snowflake, color: 'from-sky-500 to-indigo-400', unitKey: 'temperature', comparison: 'lte' },
  { key: 'very_windy', icon: Gauge, color: 'from-cyan-500 to-sky-400', unitKey: 'wind', comparison: 'gte' },
  { key: 'very_humid', icon: Waves, color: 'from-emerald-500 to-teal-400', unitKey: 'humidity', comparison: 'gte' },
  { key: 'very_uncomfortable', icon: Flame, color: 'from-amber-500 to-red-400' }
]

type ProbabilityPanelProps = {
  probabilities?: Probabilities
  units: Record<string, string>
}

export const ProbabilitiesPanel = ({ probabilities, units }: ProbabilityPanelProps) => {
  const { t } = useTranslation('common')

  return (
    <Card aria-label={t('probs.title')}>
      <CardHeader className="items-center justify-between gap-2 sm:flex-row">
        <CardTitle>{t('probs.title')}</CardTitle>
        <Chip className="border border-accent/40 bg-accent/10 text-accent text-xs">
          {t('probs.windowNote')}
        </Chip>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {probabilities ? (
          probabilityConfig.map((item) => {
            const Icon = item.icon
            const entry = probabilities[item.key]
            if (!entry) return null

            const probDisplay = entry.prob == null ? t('cards.noData') : formatPercent(entry.prob)
            const unitLabel = item.unitKey ? units[item.unitKey] ?? '' : ''

            let detail = ''
            if ('threshold' in entry && entry.threshold != null) {
              if (item.comparison === 'gte') {
                detail = t('probs.above', { value: entry.threshold, unit: unitLabel })
              } else if (item.comparison === 'lte') {
                detail = t('probs.below', { value: entry.threshold, unit: unitLabel })
              }
            } else if ('rule' in entry && entry.rule) {
              detail = sentenceCase(entry.rule)
            }

            return (
              <div
                key={item.key}
                className="rounded-2xl border border-white/10 bg-gradient-to-br p-4 text-slate-800 shadow-glow dark:text-white"
              >
                <div className="flex items-center gap-3">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br ${item.color} text-white`}>
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
                      {t(`probs.${item.key}`)}
                    </p>
                    <p className="text-2xl font-bold text-white drop-shadow">{probDisplay}</p>
                  </div>
                </div>
                <p className="mt-3 text-xs text-white/80 dark:text-slate-300">{detail}</p>
                <p className="mt-2 text-[11px] uppercase tracking-[0.3em] text-white/70">
                  {t('probs.sample', { value: entry.n })}
                </p>
              </div>
            )
          })
        ) : (
          <p className="text-sm text-slate-600 dark:text-slate-300">{t('probs.noData')}</p>
        )}
      </CardContent>
    </Card>
  )
}
