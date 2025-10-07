import { Fragment, useMemo, useState } from 'react'
import { Flame, Gauge, Snowflake, ThermometerSun, Waves } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { Probabilities } from '../lib/api'
import { formatPercent, sentenceCase } from '../utils/format'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Chip } from './ui/Chip'
import { Button } from './ui/Button'

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
  const [methodologyOpen, setMethodologyOpen] = useState(false)

  const probabilityEntries = useMemo(() => {
    if (!probabilities) return []

    return probabilityConfig
      .map((item) => {
        const entry = probabilities[item.key]
        if (!entry) return null

        const probValue = entry.prob == null ? null : entry.prob
        const probDisplay = probValue == null ? t('cards.noData') : formatPercent(probValue)
        const unitLabel = item.unitKey ? units[item.unitKey] ?? '' : ''

        let detail = ''
        if ('threshold' in entry && entry.threshold != null) {
          detail = item.comparison === 'lte'
            ? t('probs.below', { value: entry.threshold, unit: unitLabel })
            : t('probs.above', { value: entry.threshold, unit: unitLabel })
        } else if ('rule' in entry && entry.rule) {
          detail = sentenceCase(entry.rule)
        }

        return {
          key: item.key,
          label: t(`probs.${item.key}`),
          icon: item.icon,
          color: item.color,
          probDisplay,
          probValue,
          detail,
          n: entry.n ?? 0,
        }
      })
      .filter(Boolean) as Array<{
        key: keyof Probabilities
        label: string
        icon: typeof Flame
        color: string
        probDisplay: string
        probValue: number | null
        detail: string
        n: number
      }>
  }, [probabilities, t, units])

  const hasAnyData = probabilityEntries.some((entry) => entry.n > 0)

  const summaryChips = useMemo(() => {
    return probabilityEntries
      .filter((entry) => entry.probValue != null)
      .sort((a, b) => (b.probValue ?? 0) - (a.probValue ?? 0))
      .slice(0, 3)
      .map((entry) => `${entry.label}: ${entry.probDisplay}`)
  }, [probabilityEntries])

  const methodologyRows = useMemo(
    () =>
      probabilityEntries
        .filter((entry) => entry.detail)
        .map((entry) => ({ key: entry.key, label: entry.label, detail: entry.detail })),
    [probabilityEntries]
  )

  return (
    <Card aria-label={t('probs.title')}>
      <CardHeader className="gap-3">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <CardTitle>{t('probs.title')}</CardTitle>
          {summaryChips.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {summaryChips.map((summary) => (
                <Chip key={summary} className="bg-white/60 text-xs font-medium text-slate-700 dark:bg-white/10 dark:text-slate-200">
                  {summary}
                </Chip>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {hasAnyData && (
            <Chip className="border border-accent/40 bg-accent/10 text-xs text-accent">
              {t('probs.windowNote')}
            </Chip>
          )}
          <button
            type="button"
            onClick={() => setMethodologyOpen(true)}
            className="chip border border-white/30 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-accent/10 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
          >
            {t('probs.methodology')}
          </button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {probabilities && hasAnyData ? (
          probabilityEntries.map((entry) => {
            const Icon = entry.icon
            return (
              <div
                key={entry.key}
                className="rounded-2xl border border-white/40 bg-gradient-to-br from-white/90 via-white/60 to-white/30 p-4 text-slate-800 shadow-glow transition duration-500 dark:border-slate-500/30 dark:from-[#13213b] dark:via-[#0b172f] dark:to-[#050b18] dark:text-white"
              >
                <div className="flex items-center gap-3">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br ${entry.color} text-white`}>
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-600 dark:text-white/80">
                      {entry.label}
                    </p>
                    <p className="text-2xl font-bold text-slate-900 drop-shadow dark:text-white">{entry.probDisplay}</p>
                  </div>
                </div>
                <p className="mt-3 text-xs text-slate-600 dark:text-slate-300">{entry.detail}</p>
                <p className="mt-2 text-[11px] uppercase tracking-[0.3em] text-slate-500 dark:text-white/70">
                  {t('probs.sample', { value: entry.n })}
                </p>
              </div>
            )
          })
        ) : (
          <p className="text-sm text-slate-600 dark:text-slate-300">{t('probs.noData')}</p>
        )}
      </CardContent>
      <MethodologyModal
        open={methodologyOpen}
        onClose={() => setMethodologyOpen(false)}
        rows={methodologyRows}
      />
    </Card>
  )
}

type MethodologyModalProps = {
  open: boolean
  onClose: () => void
  rows: Array<{ key: keyof Probabilities; label: string; detail: string }>
}

const MethodologyModal = ({ open, onClose, rows }: MethodologyModalProps) => {
  const { t } = useTranslation('common')

  if (!open) return null

  return (
    <Fragment>
      <div className="fixed inset-0 z-40 bg-slate-900/70 backdrop-blur" aria-hidden />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="w-full max-w-lg rounded-3xl border border-white/20 bg-white p-6 text-slate-800 shadow-2xl dark:border-white/10 dark:bg-slate-900 dark:text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold">{t('probs.methodologyTitle')}</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t('probs.methodologyIntro')}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-semibold text-slate-500 transition hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent dark:text-slate-300"
              aria-label={t('probs.close')}
            >
              x
            </button>
          </div>
          <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <p>{t('probs.methodologyWindow')}</p>
            <p>{t('probs.methodologySource')}</p>
          </div>
          {rows.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {t('probs.methodologyThresholds')}
              </p>
              <ul className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                {rows.map((row) => (
                  <li key={row.key}>
                    <span className="font-medium text-slate-800 dark:text-white">{row.label}:</span> {row.detail}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-6 flex justify-end">
            <Button variant="ghost" onClick={onClose}>
              {t('probs.close')}
            </Button>
          </div>
        </div>
      </div>
    </Fragment>
  )
}
