import { Activity } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { AnalyzeResponse } from '../../lib/api'
import { getAqiStyles, sentenceCase } from '../../utils/format'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Chip } from '../ui/Chip'

export const AqiCard = ({ airQuality }: { airQuality: AnalyzeResponse['air_quality_index'] }) => {
  const { t } = useTranslation('common')
  const { aqi, category, dominant_pollutant: dominant } = airQuality

  return (
    <Card aria-label={t('cards.aqi')}>
      <CardHeader>
        <CardTitle>{t('cards.aqi')}</CardTitle>
        <Activity className="h-5 w-5 text-accent" aria-hidden />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-4xl font-semibold text-slate-900 dark:text-white">{aqi ?? t('cards.noData')}</div>
        <Chip className={`border px-3 py-1 text-xs font-semibold uppercase ${getAqiStyles(category)}`}>
          {sentenceCase(category)}
        </Chip>
        <p className="text-xs text-slate-600 dark:text-slate-300">
          {t('cards.dominant')}{' '}
          <span className="font-semibold text-slate-900 dark:text-white">
            {dominant ? sentenceCase(dominant) : t('cards.noData')}
          </span>
        </p>
        <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">{airQuality.source}</p>
      </CardContent>
    </Card>
  )
}
