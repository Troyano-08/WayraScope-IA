import { useCallback, useEffect, useMemo, useState } from 'react'
import { addDays, format, parseISO } from 'date-fns'
import { es, enUS } from 'date-fns/locale'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { useTranslation } from 'react-i18next'

import type { AnalyzeResponse } from '../../lib/api'
import { formatNasaDate } from '../../utils/format'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Chip } from '../ui/Chip'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'

const buildDates = (range: string, length: number): string[] => {
  const [rawStart] = range.split(/\s*a\s*/i)
  const startIso = formatNasaDate(rawStart?.trim() ?? '')
  const start = parseISO(startIso)
  if (Number.isNaN(start.getTime())) {
    return Array.from({ length }, (_, index) => String(index + 1))
  }
  return Array.from({ length }, (_, index) => format(addDays(start, index), 'yyyy-MM-dd'))
}

type DailyChartProps = {
  range: AnalyzeResponse['range']
  temperature: AnalyzeResponse['temperature']
  precipitation: AnalyzeResponse['precipitation']
  uncertainty?: AnalyzeResponse['meta']['uncertainty']
  dataQuality?: AnalyzeResponse['meta']['data_quality']
  units: AnalyzeResponse['meta']['units']
  eventDate: string
}

type ChartMode = 'temperature' | 'precipitation'

export const DailyChart = ({ range, temperature, precipitation, uncertainty, dataQuality, units, eventDate }: DailyChartProps) => {
  const { t, i18n } = useTranslation('common')
  const [mode, setMode] = useState<ChartMode>('temperature')
  const [activeTemperatureIndex, setActiveTemperatureIndex] = useState<number | null>(null)

  useEffect(() => {
    if (mode !== 'temperature') {
      setActiveTemperatureIndex(null)
    }
  }, [mode, setActiveTemperatureIndex])

  const locale = i18n.language === 'es' ? es : enUS

  const dates = useMemo(() => {
    const length = Math.max(temperature.length, precipitation.length)
    return buildDates(range, length)
  }, [precipitation.length, range, temperature.length])

  const windowLabel = useMemo(() => {
    const parts = range.split(/\s*a\s*/i)
    if (parts.length !== 2) return null
    try {
      const startDate = parseISO(formatNasaDate(parts[0].trim()))
      const endDate = parseISO(formatNasaDate(parts[1].trim()))
      return `${format(startDate, 'dd MMM', { locale })} → ${format(endDate, 'dd MMM', { locale })}`
    } catch {
      return null
    }
  }, [locale, range])

  const dataset = useMemo(
    () =>
      dates.map((date, index) => ({
        date,
        temperature: temperature[index] ?? null,
        precipitation: precipitation[index] ?? null,
        temp_p25: uncertainty?.temperature?.p25?.[index] ?? null,
        temp_p75: uncertainty?.temperature?.p75?.[index] ?? null,
        prec_p25: uncertainty?.precipitation?.p25?.[index] ?? null,
        prec_p75: uncertainty?.precipitation?.p75?.[index] ?? null
      })),
    [dates, precipitation, temperature, uncertainty]
  )

  const temperatureStats = useMemo(() => {
    const values = dataset
      .map((entry) => entry.temperature)
      .filter((value): value is number => typeof value === 'number')

    if (values.length === 0) {
      return null
    }

    const min = Math.min(...values)
    const max = Math.max(...values)
    const avg = values.reduce((accumulator, value) => accumulator + value, 0) / values.length

    return { min, max, avg }
  }, [dataset])

  const eventDateIndex = useMemo(() => dataset.findIndex((entry) => entry.date === eventDate), [dataset, eventDate])

  const fallbackTemperatureIndex = useMemo(() => {
    if (eventDateIndex !== -1 && dataset[eventDateIndex]?.temperature != null) {
      return eventDateIndex
    }
    for (let index = dataset.length - 1; index >= 0; index -= 1) {
      if (dataset[index]?.temperature != null) {
        return index
      }
    }
    return null
  }, [dataset, eventDateIndex])

  const currentTemperatureIndex = activeTemperatureIndex ?? fallbackTemperatureIndex
  const activeTemperaturePoint = currentTemperatureIndex != null ? dataset[currentTemperatureIndex] : null

  const activeTemperatureLabel = useMemo(() => {
    if (!activeTemperaturePoint?.date) {
      return null
    }

    try {
      return format(parseISO(activeTemperaturePoint.date), 'EEEE d MMM', { locale })
    } catch {
      return activeTemperaturePoint.date
    }
  }, [activeTemperaturePoint, locale])

  const activeTemperatureValue = activeTemperaturePoint?.temperature ?? null
  const activeTemperatureSpread =
    activeTemperaturePoint?.temp_p25 != null && activeTemperaturePoint?.temp_p75 != null
      ? {
          min: activeTemperaturePoint.temp_p25,
          max: activeTemperaturePoint.temp_p75
        }
      : null

  const temperaturePosition = useMemo(() => {
    if (!temperatureStats || activeTemperatureValue == null) {
      return null
    }

    const denominator = temperatureStats.max - temperatureStats.min
    if (denominator === 0) {
      return 0.5
    }

    const ratio = (activeTemperatureValue - temperatureStats.min) / denominator
    if (Number.isNaN(ratio)) {
      return null
    }

    return Math.min(Math.max(ratio, 0), 1)
  }, [activeTemperatureValue, temperatureStats])

  const eventDateLabel = useMemo(() => {
    if (!eventDate) return null
    try {
      return format(parseISO(eventDate), 'EEEE d MMM', { locale })
    } catch {
      return eventDate
    }
  }, [eventDate, locale])

  const temperatureBadges = useMemo(
    () =>
      temperatureStats
        ? [
            { id: 'min', label: t('chart.min'), value: temperatureStats.min },
            { id: 'avg', label: t('chart.avg'), value: temperatureStats.avg },
            { id: 'max', label: t('chart.max'), value: temperatureStats.max }
          ]
        : [],
    [temperatureStats, t]
  )

  const handleTemperatureHover = useCallback(
    (state: { activeTooltipIndex?: number; isTooltipActive?: boolean } | undefined) => {
      if (!state?.isTooltipActive || typeof state.activeTooltipIndex !== 'number') {
        return
      }

      setActiveTemperatureIndex(state.activeTooltipIndex)
    },
    [setActiveTemperatureIndex]
  )

  const resetTemperatureHover = useCallback(() => {
    setActiveTemperatureIndex(null)
  }, [setActiveTemperatureIndex])

  const quality = dataQuality?.nasa?.[mode]
  const isIncomplete = quality && quality.coverage < 0.6

  const renderTemperatureChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={dataset}
        margin={{ left: 12, right: 12, top: 12, bottom: 8 }}
        onMouseMove={handleTemperatureHover}
        onMouseLeave={resetTemperatureHover}
        onTouchStart={handleTemperatureHover}
        onTouchMove={handleTemperatureHover}
        onTouchEnd={resetTemperatureHover}
      >
        <defs>
          <linearGradient id="temperatureLineGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
        <XAxis
          dataKey="date"
          tickFormatter={(value) => format(parseISO(value), 'dd MMM', { locale })}
          stroke="rgba(148, 163, 184, 0.7)"
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="rgba(148, 163, 184, 0.7)"
          tickLine={false}
          axisLine={false}
          width={44}
          tickFormatter={(value) => `${value}°`}
        />
        <Tooltip
          cursor={{ stroke: 'rgba(34, 211, 238, 0.35)', strokeWidth: 1 }}
          contentStyle={{
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderRadius: '0.75rem',
            border: '1px solid rgba(148, 163, 184, 0.35)',
            color: '#e2e8f0'
          }}
          labelFormatter={(value) => format(parseISO(value), 'yyyy-MM-dd')}
          formatter={(value: number | null, name) => {
            if (value == null) return [t('cards.noData'), name]
            switch (name) {
              case 'temp_p25':
                return [`${value.toFixed(1)} ${units.temperature}`, t('chart.p25')]
              case 'temp_p75':
                return [`${value.toFixed(1)} ${units.temperature}`, t('chart.p75')]
              default:
                return [`${value.toFixed(1)} ${units.temperature}`, t('chart.temperature')]
            }
          }}
        />
        <Line
          type="monotone"
          dataKey="temperature"
          stroke="url(#temperatureLineGradient)"
          strokeWidth={2}
          dot={false}
          name="temperature"
          activeDot={{ r: 6, fill: '#6EE7F9', stroke: 'rgba(15, 23, 42, 0.6)', strokeWidth: 2 }}
          connectNulls={false}
        />
        <Line type="monotone" dataKey="temp_p25" stroke="#38bdf8" strokeDasharray="4 4" dot={false} name="temp_p25" />
        <Line type="monotone" dataKey="temp_p75" stroke="#0ea5e9" strokeDasharray="4 4" dot={false} name="temp_p75" />
        {eventDate && (
          <ReferenceLine
            x={eventDate}
            stroke="rgba(148, 163, 184, 0.5)"
            strokeDasharray="4 4"
            label={{ value: t('chart.eventMarker'), position: 'insideTopRight', fill: 'rgba(148, 163, 184, 0.9)', fontSize: 10 }}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  )

  const renderPrecipitationChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={dataset} margin={{ left: 12, right: 12, top: 12, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
        <XAxis
          dataKey="date"
          tickFormatter={(value) => format(parseISO(value), 'dd MMM', { locale })}
          stroke="rgba(148, 163, 184, 0.7)"
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="rgba(148, 163, 184, 0.7)"
          tickLine={false}
          axisLine={false}
          width={44}
          tickFormatter={(value) => `${value} mm`}
        />
        <Tooltip
          cursor={{ fill: 'rgba(34, 211, 238, 0.15)' }}
          contentStyle={{
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderRadius: '0.75rem',
            border: '1px solid rgba(148, 163, 184, 0.35)',
            color: '#e2e8f0'
          }}
          labelFormatter={(value) => format(parseISO(value), 'yyyy-MM-dd')}
          formatter={(value: number | null, name) => {
            if (value == null) return [t('cards.noData'), name]
            switch (name) {
              case 'prec_p25':
                return [`${value.toFixed(2)} ${units.precipitation}`, t('chart.p25')]
              case 'prec_p75':
                return [`${value.toFixed(2)} ${units.precipitation}`, t('chart.p75')]
              default:
                return [`${value.toFixed(2)} ${units.precipitation}`, t('chart.precipitation')]
            }
          }}
        />
        <Bar dataKey="precipitation" fill="#6EE7F9" radius={[8, 8, 0, 0]} name="precipitation" />
        <Line type="monotone" dataKey="prec_p25" stroke="#38bdf8" strokeDasharray="5 5" dot={false} name="prec_p25" />
        <Line type="monotone" dataKey="prec_p75" stroke="#0ea5e9" strokeDasharray="5 5" dot={false} name="prec_p75" />
        {eventDate && (
          <ReferenceLine
            x={eventDate}
            stroke="rgba(148, 163, 184, 0.5)"
            strokeDasharray="4 4"
            label={{ value: t('chart.eventMarker'), position: 'insideTopRight', fill: 'rgba(148, 163, 184, 0.9)', fontSize: 10 }}
          />
        )}
      </BarChart>
    </ResponsiveContainer>
  )

  return (
    <Card aria-label={t('chart.daily')}>
      <CardHeader className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <CardTitle>{t('chart.daily')}</CardTitle>
          <Chip className="bg-white/20 px-2 py-1 text-[10px] uppercase tracking-[0.25em] text-slate-600 shadow-none backdrop-blur dark:bg-white/10 dark:text-slate-300">
            {t('chart.windowRange')}
          </Chip>
          {windowLabel && (
            <span className="text-xs font-medium uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500">
              {windowLabel}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant={mode === 'temperature' ? 'solid' : 'ghost'}
            onClick={() => setMode('temperature')}
            className="px-3 py-1 text-xs uppercase"
          >
            {t('chart.temperature')}
          </Button>
          <Button
            variant={mode === 'precipitation' ? 'solid' : 'ghost'}
            onClick={() => setMode('precipitation')}
            className="px-3 py-1 text-xs uppercase"
          >
            {t('chart.precipitation')}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isIncomplete && (
          <Alert
            variant="warning"
            title={t('alerts.data_gaps_title')}
            description={t('alerts.data_gaps', {
              coverage: Math.round((quality?.coverage ?? 0) * 100)
            })}
          />
        )}
        {mode === 'temperature' && (
          <div className="rounded-2xl border border-white/40 bg-white/60 p-4 shadow-inner transition duration-500 dark:border-slate-500/30 dark:bg-slate-900/60">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                  {t('chart.insights')}
                </p>
                <p className="mt-1 text-base font-semibold text-slate-800 dark:text-white">
                  {activeTemperatureLabel ?? t('chart.hoverHint')}
                </p>
                {eventDateLabel && (
                  <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                    {t('chart.eventContext', { date: eventDateLabel })}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-4xl font-bold text-accent drop-shadow-sm">
                  {activeTemperatureValue != null ? `${activeTemperatureValue.toFixed(1)} ${units.temperature}` : t('cards.noData')}
                </span>
                {activeTemperatureSpread && (
                  <span className="text-xs text-slate-500 dark:text-slate-300">
                    {t('chart.range', {
                      min: activeTemperatureSpread.min.toFixed(1),
                      max: activeTemperatureSpread.max.toFixed(1),
                      unit: units.temperature
                    })}
                  </span>
                )}
              </div>
            </div>
            {temperatureBadges.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {temperatureBadges.map((stat) => (
                  <span
                    key={stat.id}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/40 bg-white/50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-600 transition dark:border-slate-500/40 dark:bg-white/5 dark:text-slate-200"
                  >
                    {stat.label}
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {stat.value.toFixed(1)} {units.temperature}
                    </span>
                  </span>
                ))}
              </div>
            )}
            {temperaturePosition != null && temperatureBadges.length > 0 && (
              <div className="relative mt-4 h-2 w-full rounded-full bg-white/40 transition-[background-color] duration-500 dark:bg-white/10">
                <span
                  className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent shadow-[0_0_12px_rgba(110,231,249,0.6)] transition-[left] duration-500 ease-out"
                  style={{ left: `${temperaturePosition * 100}%` }}
                />
              </div>
            )}
          </div>
        )}
        <div className="h-72 w-full">
          {mode === 'temperature' ? renderTemperatureChart() : renderPrecipitationChart()}
        </div>
      </CardContent>
    </Card>
  )
}
