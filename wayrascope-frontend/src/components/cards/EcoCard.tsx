import { Leaf } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { AnalyzeResponse } from '../../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'

export const EcoCard = ({ ecoImpact }: { ecoImpact: AnalyzeResponse['eco_impact'] }) => {
  const { t } = useTranslation('common')

  return (
    <Card aria-label={t('cards.eco')}>
      <CardHeader>
        <CardTitle>{t('cards.eco')}</CardTitle>
        <Leaf className="h-5 w-5 text-accent" aria-hidden />
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{ecoImpact}</p>
      </CardContent>
    </Card>
  )
}
