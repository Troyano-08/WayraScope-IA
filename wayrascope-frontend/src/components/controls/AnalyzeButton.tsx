import { Loader2, Sparkles } from 'lucide-react'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import { useAnalyze } from '../../hooks/useAnalyze'
import { useAppStore } from '../../store/useAppStore'
import { Button } from '../ui/Button'

export const AnalyzeButton = () => {
  const { t } = useTranslation('common')
  const { runAnalyze, isAnalyzing } = useAnalyze()
  const { city, usePin, coords } = useAppStore((state) => ({
    city: state.city,
    usePin: state.usePin,
    coords: state.coords
  }))

  const handleClick = useCallback(async () => {
    try {
      await runAnalyze()
    } catch {
      // Error handled through store/i18n alerts
    }
  }, [runAnalyze])

  const trimmed = city.trim()
  const isDisabled = isAnalyzing || (!usePin && trimmed.length === 0) || (usePin && !coords)

  return (
    <Button
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      className="w-full"
      leftIcon={isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Sparkles className="h-4 w-4" aria-hidden />}
    >
      {isAnalyzing ? t('inputs.analyzing') : t('inputs.analyze')}
    </Button>
  )
}
