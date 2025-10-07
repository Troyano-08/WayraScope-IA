import { useTranslation } from 'react-i18next'

import type { TrendMap } from '../../lib/api'
import { trendColor, trendIcon, trendStroke } from '../../utils/format'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'

type TrendSeries = Record<keyof TrendMap, Array<number | null | undefined>>

type TrendsBarProps = {
  trend: TrendMap
  series: TrendSeries
}

const numeric = (value: number | null | undefined): value is number =>
  typeof value === 'number' && Number.isFinite(value)

export const TrendsBar = ({ trend, series }: TrendsBarProps) => {
  const { t } = useTranslation('common')

  const entries = (Object.entries(trend) as [keyof TrendMap, TrendMap[keyof TrendMap]][]).map(
    ([key, value]) => {
      const rawSeries = series?.[key] ?? []
      const sparkData = rawSeries.filter(numeric)
      return {
        key,
        value,
        label: t(`trend.${key}`),
        sparkData
      }
    }
  )

  const hasData = entries.some((entry) => entry.sparkData.length > 0)
  if (!hasData) return null

  return (
    <Card aria-label={t('cards.trends')}>
      <CardHeader>
        <CardTitle>{t('cards.trends')}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {entries.map(({ key, value, label, sparkData }) => {
          const accent = trendColor(value)
          const stroke = trendStroke(value)
          const hasSpark = sparkData.length >= 2

          return (
            <div
              key={key}
              className={`rounded-2xl border border-white/10 p-4 text-sm shadow-glow backdrop-blur ${accent} text-white/90`}
            >
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em]">
                <span>{label}</span>
                <span aria-hidden>{trendIcon(value)}</span>
              </div>
              <p className="mt-2 text-sm font-medium text-white/90">{value}</p>
              {hasSpark ? (
                <Sparkline data={sparkData} className={`mt-3 ${stroke}`} />
              ) : (
                <div className="mt-3 flex h-12 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-xs text-white/70">
                  {t('cards.noData')}
                </div>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

type SparklineProps = {
  data: number[]
  className?: string
}

const Sparkline = ({ data, className }: SparklineProps) => {
  if (data.length < 2) {
    return null
  }

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const path = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 100
      const y = 100 - ((value - min) / range) * 100
      return `${index === 0 ? 'M' : 'L'}${x} ${y}`
    })
    .join(' ')

  return (
    <svg
      className={`h-12 w-full ${className ?? ''}`}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      role="img"
      aria-hidden
    >
      <path d={path} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
