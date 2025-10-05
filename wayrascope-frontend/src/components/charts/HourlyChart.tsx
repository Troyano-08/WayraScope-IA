import { useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { es, enUS } from 'date-fns/locale'
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { useTranslation } from 'react-i18next'

import type { HourlyResponse } from '../../lib/api'
import { formatHour, mpsToKmh } from '../../utils/format'
import { Toggle } from '../ui/Toggle'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/Card'
import { Chip } from '../ui/Chip'

type WindUnit = 'mps' | 'kmh'

type HourlyChartProps = {
  data?: HourlyResponse
}

export const HourlyChart = ({ data }: HourlyChartProps) => {
  const { t, i18n } = useTranslation('common')
  const [showHumidity, setShowHumidity] = useState(true)
  const [showPrecipitation, setShowPrecipitation] = useState(false)
  const [windUnit, setWindUnit] = useState<WindUnit>('mps')

  const locale = i18n.language === 'es' ? es : enUS

  const dataset = useMemo(() => {
    if (!data) return []
    return data.time.map((timestamp, index) => ({
      iso: timestamp,
      hour: formatHour(timestamp),
      temperature: data.temperature[index] ?? null,
      wind: data.wind[index] ?? null,
      humidity: data.humidity[index] ?? null,
      precipitation: data.precipitation[index] ?? null
    }))
  }, [data])

  const hasData = dataset.length > 0
  const windUnitLabel = windUnit === 'kmh' ? 'km/h' : data?.source.units.wind ?? 'm/s'
  const temperatureUnit = data?.source.units.temperature ?? '°C'
  const humidityUnit = data?.source.units.humidity ?? '%'
  const precipitationUnit = data?.source.units.precipitation ?? 'mm/h'

  const preparedDataset = dataset.map((entry) => ({
    ...entry,
    displayWind: entry.wind == null ? null : windUnit === 'kmh' ? mpsToKmh(entry.wind) : entry.wind
  }))

  const bestHours = data?.best_hours?.slice(0, 3) ?? []
  const bestHourSet = new Set(bestHours.map((item) => format(parseISO(item.time), 'HH:mm')))

  if (!hasData) {
    return (
      <Card aria-label={t('chart.hourly')}>
        <CardHeader>
          <CardTitle>{t('chart.hourly')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 dark:text-slate-300">{t('chart.noHourly')}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card aria-label={t('chart.hourly')}>
      <CardHeader className="flex flex-wrap items-center justify-between gap-3">
        <CardTitle>{t('chart.hourly')}</CardTitle>
        <div className="flex flex-wrap gap-2">
          <Toggle
            pressed={windUnit === 'kmh'}
            onClick={() => setWindUnit((prev) => (prev === 'mps' ? 'kmh' : 'mps'))}
            label={windUnit === 'kmh' ? t('chart.windKmh') : t('chart.windMs')}
          />
          <Toggle pressed={showHumidity} onClick={() => setShowHumidity((prev) => !prev)} label={t('chart.humidity')} />
          <Toggle
            pressed={showPrecipitation}
            onClick={() => setShowPrecipitation((prev) => !prev)}
            label={t('chart.precipitation')}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={preparedDataset} margin={{ top: 16, right: 32, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" />
              <XAxis dataKey="hour" tick={{ fill: 'rgba(148, 163, 184, 0.8)' }} tickLine={false} axisLine={false} />
              <YAxis
                yAxisId="temperature"
                tick={{ fill: 'rgba(148, 163, 184, 0.8)' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}°`}
              />
              <YAxis
                yAxisId="wind"
                orientation="right"
                tick={{ fill: 'rgba(148, 163, 184, 0.8)' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                cursor={{ stroke: 'rgba(110, 231, 249, 0.35)' }}
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  borderRadius: '0.75rem',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  color: '#e2e8f0',
                  minWidth: '200px'
                }}
                formatter={(value: number | null, name) => {
                  if (value == null) return [t('cards.noData'), name]
                  switch (name) {
                    case 'temperature':
                      return [`${value.toFixed(1)} ${temperatureUnit}`, t('chart.temperature')]
                    case 'displayWind':
                      return [`${value.toFixed(1)} ${windUnitLabel}`, t('chart.wind')]
                    case 'humidity':
                      return [`${value.toFixed(0)} ${humidityUnit}`, t('chart.humidity')]
                    case 'precipitation':
                      return [`${value.toFixed(2)} ${precipitationUnit}`, t('chart.precipitation')]
                    default:
                      return [value, name]
                  }
                }}
                labelFormatter={(value, payload) => {
                  const iso = payload?.[0]?.payload?.iso
                  if (!iso) return value
                  try {
                    return format(parseISO(iso), 'eeee HH:mm', { locale })
                  } catch {
                    return value
                  }
                }}
              />
              <Legend
                verticalAlign="top"
                iconType="circle"
                formatter={(value) => {
                  switch (value) {
                    case 'temperature':
                      return `${t('chart.temperature')} (${temperatureUnit})`
                    case 'displayWind':
                      return `${t('chart.wind')} (${windUnitLabel})`
                    case 'humidity':
                      return `${t('chart.humidity')} (${humidityUnit})`
                    case 'precipitation':
                      return `${t('chart.precipitation')} (${precipitationUnit})`
                    default:
                      return value
                  }
                }}
              />
              <Line
                type="monotone"
                dataKey="temperature"
                yAxisId="temperature"
                stroke="#22d3ee"
                strokeWidth={2}
                dot={false}
                name="temperature"
              />
              <Line
                type="monotone"
                dataKey="displayWind"
                yAxisId="wind"
                stroke="#6EE7F9"
                strokeWidth={2}
                dot={false}
                name="displayWind"
              />
              {showHumidity && (
                <Line
                  type="monotone"
                  dataKey="humidity"
                  yAxisId="temperature"
                  stroke="#a855f7"
                  strokeWidth={1.5}
                  dot={false}
                  name="humidity"
                />
              )}
              {showPrecipitation && (
                <Area
                  type="monotone"
                  dataKey="precipitation"
                  yAxisId="wind"
                  stroke="#38bdf8"
                  fill="rgba(56, 189, 248, 0.25)"
                  name="precipitation"
                />
              )}
              {Array.from(bestHourSet).map((hour) => (
                <ReferenceLine key={hour} x={hour} stroke="#f97316" strokeDasharray="3 3" />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
      {bestHours.length > 0 && (
        <CardFooter className="flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-300">
          <span className="uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
            {t('chart.bestHours')}
          </span>
          {bestHours.map((item) => (
            <Chip key={item.time} className="bg-amber-500/10 text-amber-300">
              {format(parseISO(item.time), 'HH:mm', { locale })} · {Math.round(item.score)} · {item.notes}
            </Chip>
          ))}
        </CardFooter>
      )}
    </Card>
  )
}
