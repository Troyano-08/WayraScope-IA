import { Leaf } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { AnalyzeResponse } from '../../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'

export const EcoCard = ({
  ecoImpact,
  ecoImpactI18n
}: {
  ecoImpact: AnalyzeResponse['eco_impact']
  ecoImpactI18n?: AnalyzeResponse['eco_impact_i18n']
}) => {
  const { t, i18n } = useTranslation('common')
  const lang = (i18n.language as 'es' | 'en') || 'es'
  const localizedEco = ecoImpactI18n?.[lang] ?? ecoImpact

  return (
    <Card aria-label={t('cards.eco')}>
      <CardHeader>
        <CardTitle>{t('cards.eco')}</CardTitle>
        <Leaf className="h-5 w-5 text-accent" aria-hidden />
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{localizedEco}</p>
      </CardContent>
    </Card>
  )
}
