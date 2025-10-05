import { useTranslation } from 'react-i18next'

import type { AnalyzeResponse } from '../lib/api'

export type SourcesFooterProps = {
  sources: AnalyzeResponse['sources']
  units: AnalyzeResponse['meta']['units']
}

export const SourcesFooter = ({ sources, units }: SourcesFooterProps) => {
  const { t } = useTranslation('common')

  return (
    <footer id="sources" className="mt-12 space-y-3 rounded-2xl border border-white/10 bg-white/60 px-5 py-4 text-xs text-slate-600 dark:bg-white/5 dark:text-slate-400">
      <p className="uppercase tracking-[0.3em] text-slate-500 dark:text-slate-300">{t('footer.sources')}</p>
      <p className="text-slate-700 dark:text-slate-200">NASA POWER · Open-Meteo · WAQI</p>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
        {Object.entries(units).map(([key, value]) => (
          <span key={key} className="capitalize text-slate-600 dark:text-slate-300">
            <strong className="font-semibold text-slate-800 dark:text-slate-100">{key}</strong>: {value}
          </span>
        ))}
      </div>
      {sources.length > 0 && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          {sources.join(' · ')}
        </p>
      )}
      <p className="text-[11px] text-slate-500 dark:text-slate-400">{t('footer.license')}</p>
      <p className="text-[11px] text-slate-500 dark:text-slate-400">{t('footer.version')}</p>
    </footer>
  )
}
