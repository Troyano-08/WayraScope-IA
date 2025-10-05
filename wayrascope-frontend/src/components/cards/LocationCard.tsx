import { useState } from 'react'
import { Copy, Globe2, MapPin } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { AnalyzeResponse } from '../../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'

export const LocationCard = ({ location }: { location: AnalyzeResponse['location'] }) => {
  const { t } = useTranslation('common')
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${location.lat}, ${location.lon}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.warn('Clipboard copy failed', error)
    }
  }

  return (
    <Card aria-label={t('cards.location')}>
      <CardHeader>
        <CardTitle>{t('cards.location')}</CardTitle>
        <Globe2 className="h-5 w-5 text-accent" aria-hidden />
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="text-base font-semibold text-slate-900 dark:text-white">{location.city}</div>
        <div className="text-slate-500 dark:text-slate-300">{location.country}</div>
        <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/60 px-3 py-2 text-xs text-slate-700 dark:bg-white/5 dark:text-slate-300">
          <span className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-accent" aria-hidden />
            {t('cards.coordinates', {
              lat: location.lat.toFixed(4),
              lon: location.lon.toFixed(4)
            })}
          </span>
          <Button
            type="button"
            variant="ghost"
            className="px-2 py-1"
            onClick={handleCopy}
            aria-label={t('cards.copyCoords')}
          >
            <Copy className="h-4 w-4" aria-hidden />
          </Button>
        </div>
        {copied && <Badge className="bg-emerald-500/10 text-emerald-300">{t('cards.copied')}</Badge>}
      </CardContent>
    </Card>
  )
}
