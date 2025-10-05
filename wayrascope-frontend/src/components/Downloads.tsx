import { useCallback, useMemo, useState } from 'react'
import { Download, Loader2, Info } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { downloadCsv, downloadJson } from '../lib/api'
import { Button } from './ui/Button'
import { Alert } from './ui/Alert'

type DownloadsProps = {
  city?: string
  date: string
  disabled?: boolean
}

// TODO(manual): Confirmar que "CSV" descarga archivo con nombre del Content-Disposition o fallback.
// TODO(manual): Abrir el CSV descargado en Excel/LibreOffice y verificar contenido y delimitadores.
// TODO(manual): Revisar en DevTools que la respuesta de CSV/JSON sea blob y no se intente parsear como JSON automáticamente.
// TODO(manual): Descargar JSON y abrirlo para asegurar que contiene { meta, data }.
// TODO(manual): Simular error de red/backend y validar que se muestra el toast de error sin crear un archivo.
// TODO(manual): Con pin sin nombre de ciudad, comprobar que CSV queda deshabilitado con tooltip y JSON muestra toast informativo si falta ciudad.

export const Downloads = ({ city, date, disabled = false }: DownloadsProps) => {
  const { t } = useTranslation('common')
  const [loadingCsv, setLoadingCsv] = useState(false)
  const [loadingJson, setLoadingJson] = useState(false)
  const [toast, setToast] = useState<{
    message: string
    type: 'success' | 'error' | 'info'
  } | null>(null)

  const normalizedCity = useMemo(() => {
    const trimmed = city?.trim()
    if (!trimmed || trimmed.length === 0) return undefined
    if (trimmed.toLowerCase() === '(coords)') return undefined
    return trimmed
  }, [city])

  const showToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message })
    window.setTimeout(() => setToast(null), 4000)
  }, [])

  const isCsvDisabled = disabled || loadingJson || !normalizedCity
  const isJsonDisabled = disabled || loadingCsv || !normalizedCity

  const handleCsv = async () => {
    if (isCsvDisabled) {
      if (!normalizedCity) {
        showToast('info', t('downloads.csvTooltipNoCity'))
      }
      return
    }

    setLoadingCsv(true)
    try {
      const { filename } = await downloadCsv({ city: normalizedCity!, date })
      showToast('success', t('downloads.success', { filename }))
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t('downloads.error')
      showToast('error', message)
    } finally {
      setLoadingCsv(false)
    }
  }

  const handleJson = async () => {
    if (isJsonDisabled) {
      if (!normalizedCity) {
        showToast('info', t('downloads.jsonTooltipNoCity'))
      }
      return
    }

    setLoadingJson(true)
    try {
      const { filename, meta } = await downloadJson({ city: normalizedCity!, date })
      if (meta) {
        console.debug('WayraScope JSON meta', meta)
      }
      showToast('success', t('downloads.success', { filename }))
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t('downloads.error')
      showToast('error', message)
    } finally {
      setLoadingJson(false)
    }
  }

  return (
    <section className="space-y-4" aria-label={t('downloads.title')}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-300">
          {t('downloads.title')}
        </h2>
        <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
          <Info className="h-3.5 w-3.5" aria-hidden />
          {t('downloads.subtitle')}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="ghost"
          className="flex-1 min-w-[140px]"
          leftIcon={loadingCsv ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Download className="h-4 w-4" aria-hidden />}
          onClick={handleCsv}
          disabled={isCsvDisabled}
          aria-busy={loadingCsv}
          title={isCsvDisabled && !normalizedCity ? t('downloads.csvTooltipNoCity') : undefined}
        >
          {t('downloads.csv')}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="flex-1 min-w-[140px]"
          leftIcon={loadingJson ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Download className="h-4 w-4" aria-hidden />}
          onClick={handleJson}
          disabled={isJsonDisabled}
          aria-busy={loadingJson}
          title={!normalizedCity ? t('downloads.jsonTooltipNoCity') : undefined}
        >
          {t('downloads.json')}
        </Button>
      </div>

      <div aria-live="polite">
        {toast && (
          <Alert
            variant={toast.type === 'success' ? 'success' : toast.type === 'info' ? 'info' : 'error'}
            description={toast.message}
          />
        )}
      </div>
    </section>
  )
}
