import { useMemo, useState } from 'react'
import { addDays, format, parseISO } from 'date-fns'
import { es, enUS } from 'date-fns/locale'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
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
}

type ChartMode = 'temperature' | 'precipitation'

export const DailyChart = ({ range, temperature, precipitation, uncertainty, dataQuality, units }: DailyChartProps) => {
  const { t, i18n } = useTranslation('common')
  const [mode, setMode] = useState<ChartMode>('temperature')

  const locale = i18n.language === 'es' ? es : enUS

  const dates = useMemo(() => {
    const length = Math.max(temperature.length, precipitation.length)
    return buildDates(range, length)
  }, [precipitation.length, range, temperature.length])

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

  const quality = dataQuality?.nasa?.[mode]
  const isIncomplete = quality && quality.coverage < 0.6

  const renderTemperatureChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={dataset} margin={{ left: 12, right: 12, top: 12, bottom: 8 }}>
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
          stroke="#22d3ee"
          strokeWidth={2}
          dot={false}
          name="temperature"
          connectNulls={false}
        />
        <Line type="monotone" dataKey="temp_p25" stroke="#38bdf8" strokeDasharray="4 4" dot={false} name="temp_p25" />
        <Line type="monotone" dataKey="temp_p75" stroke="#0ea5e9" strokeDasharray="4 4" dot={false} name="temp_p75" />
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
      </BarChart>
    </ResponsiveContainer>
  )

  return (
    <Card aria-label={t('chart.daily')}>
      <CardHeader className="flex flex-wrap items-center justify-between gap-3">
        <CardTitle>{t('chart.daily')}</CardTitle>
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
        <div className="h-72 w-full">
          {mode === 'temperature' ? renderTemperatureChart() : renderPrecipitationChart()}
        </div>
      </CardContent>
    </Card>
  )
}
