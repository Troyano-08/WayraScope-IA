import { useId } from 'react'
import { useTranslation } from 'react-i18next'

import { useAppStore } from '../../store/useAppStore'

export const DateInput = () => {
  const inputId = useId()
  const { t } = useTranslation('common')
  const { date, setDate } = useAppStore((state) => ({ date: state.date, setDate: state.setDate }))

  return (
    <div className="space-y-2">
      <label
        className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300"
        htmlFor={inputId}
      >
        {t('inputs.date')}
      </label>
      <input
        id={inputId}
        type="date"
        className="w-full rounded-xl border border-white/20 bg-white/70 px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-accent/70 focus:ring-2 focus:ring-accent/40 dark:border-white/10 dark:bg-white/5 dark:text-white"
        value={date}
        onChange={(event) => setDate(event.target.value)}
      />
    </div>
  )
}
