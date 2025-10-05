import { useId } from 'react'
import { useTranslation } from 'react-i18next'

import { useAppStore } from '../../store/useAppStore'
import { Badge } from '../ui/Badge'

const citySuggestions = [
  'Lima',
  'Huánuco',
  'Cusco',
  'Arequipa',
  'Trujillo',
  'Piura',
  'Bogotá',
  'Quito',
  'La Paz',
  'Ciudad de México',
  'Buenos Aires',
  'Santiago',
  'Medellín'
]

export const CityInput = () => {
  const inputId = useId()
  const { t } = useTranslation('common')
  const { city, coords, usePin, setCity, setUsePin } = useAppStore((state) => ({
    city: state.city,
    coords: state.coords,
    usePin: state.usePin,
    setCity: state.setCity,
    setUsePin: state.setUsePin
  }))

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label
          className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300"
          htmlFor={inputId}
        >
          {t('inputs.city')}
        </label>
        {usePin && coords && (
          <Badge className="bg-accent/10 text-accent border border-accent/40 uppercase">
            {t('inputs.coordsBadge', {
              lat: coords.lat.toFixed(2),
              lon: coords.lon.toFixed(2)
            })}
          </Badge>
        )}
      </div>
      <input
        id={inputId}
        list="city-suggestions"
        className="w-full rounded-xl border border-white/20 bg-white/70 px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-accent/70 focus:ring-2 focus:ring-accent/40 dark:border-white/10 dark:bg-white/5 dark:text-white"
        placeholder={t('inputs.cityPlaceholder')}
        value={city}
        onChange={(event) => {
          setCity(event.target.value)
          if (event.target.value.trim().length > 0) {
            setUsePin(false)
          }
        }}
        autoComplete="off"
      />
      <datalist id="city-suggestions">
        {citySuggestions.map((suggestion) => (
          <option value={suggestion} key={suggestion} />
        ))}
      </datalist>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {t('inputs.mapHint')}
      </p>
    </div>
  )
}
