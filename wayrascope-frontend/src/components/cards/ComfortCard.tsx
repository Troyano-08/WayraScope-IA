import { Wind } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { AnalyzeResponse } from '../../lib/api'
import { comfortEmoji, comfortTone } from '../../utils/format'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'

type Props = {
  comfortIndex: AnalyzeResponse['comfort_index']
  advisor: AnalyzeResponse['wayra_advisor']
}

export const ComfortCard = ({ comfortIndex, advisor }: Props) => {
  const { t } = useTranslation('common')
  const emoji = comfortEmoji(comfortIndex)
  const tone = comfortTone(comfortIndex)

  return (
    <Card aria-label={t('cards.comfort')}>
      <CardHeader>
        <CardTitle>{t('cards.comfort')}</CardTitle>
        <Wind className="h-5 w-5 text-accent" aria-hidden />
      </CardHeader>
      <CardContent className="space-y-2">
        <div className={`flex items-center gap-3 text-lg font-semibold ${tone}`}>
          <span aria-hidden className="text-2xl">
            {emoji}
          </span>
          <span>{comfortIndex}</span>
        </div>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{advisor}</p>
      </CardContent>
    </Card>
  )
}
