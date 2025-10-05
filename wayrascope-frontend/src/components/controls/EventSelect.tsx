import { useId } from 'react'
import { useTranslation } from 'react-i18next'

import { useAppStore } from '../../store/useAppStore'

type EventType = ReturnType<typeof useAppStore.getState>['eventType']

const eventOptions: { value: EventType; labelKey: string }[] = [
  { value: 'viaje', labelKey: 'inputs.eventOptions.viaje' },
  { value: 'desfile', labelKey: 'inputs.eventOptions.desfile' },
  { value: 'caminata', labelKey: 'inputs.eventOptions.caminata' },
  { value: 'pesca', labelKey: 'inputs.eventOptions.pesca' },
  { value: 'boda', labelKey: 'inputs.eventOptions.boda' },
  { value: 'picnic', labelKey: 'inputs.eventOptions.picnic' }
]

export const EventSelect = () => {
  const selectId = useId()
  const { t } = useTranslation('common')
  const { eventType, setEventType } = useAppStore((state) => ({
    eventType: state.eventType,
    setEventType: state.setEventType
  }))

  return (
    <div className="space-y-2">
      <label
        className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300"
        htmlFor={selectId}
      >
        {t('inputs.event')}
      </label>
      <select
        id={selectId}
        className="w-full rounded-xl border border-white/20 bg-white/70 px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-accent/70 focus:ring-2 focus:ring-accent/40 dark:border-white/10 dark:bg-white/5 dark:text-white"
        value={eventType}
        onChange={(event) => setEventType(event.target.value as EventType)}
      >
        {eventOptions.map((option) => (
          <option className="bg-slate-100 text-slate-900 dark:bg-slate-900 dark:text-white" key={option.value} value={option.value}>
            {t(option.labelKey)}
          </option>
        ))}
      </select>
    </div>
  )
}
