import { useTranslation } from 'react-i18next'

import type { TrendMap } from '../../lib/api'
import { trendColor, trendIcon } from '../../utils/format'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'

export const TrendsBar = ({ trend }: { trend: TrendMap }) => {
  const { t } = useTranslation('common')
  const entries = (
    Object.entries(trend) as [keyof TrendMap, TrendMap[keyof TrendMap]][]
  ).map(([key, value]) => ({ key, value }))

  return (
    <Card aria-label={t('cards.trends')}>
      <CardHeader>
        <CardTitle>{t('cards.trends')}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 sm:grid-cols-2">
        {entries.map(({ key, value }) => (
          <div
            key={key}
            className={`flex items-center justify-between rounded-xl border border-white/10 px-3 py-2 text-xs font-medium ${trendColor(value)}`}
          >
            <span className="uppercase tracking-wide text-white/90 dark:text-white">
              {t(`trend.${key}`)}
            </span>
            <span aria-hidden>{trendIcon(value)}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
