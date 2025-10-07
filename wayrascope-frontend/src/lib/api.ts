import axios from 'axios'

import {
  parseFilenameFromContentDisposition,
  saveBlobAsFile,
  sanitizeFilenameSegment
} from './download'

export type AnalyzeBody = {
  city: string
  date: string
  event_type: 'viaje' | 'desfile' | 'caminata' | 'pesca' | 'boda' | 'picnic'
}

export type AnalyzeCoordsBody = {
  lat: number
  lon: number
  date: string
  event_type?: AnalyzeBody['event_type']
}

export type TrendMap = {
  temperature: string
  precipitation: string
  humidity: string
  wind: string
}

export type BestDay = {
  date: string
  score: number
  notes: string
}

type ProbabilityBase = {
  prob: number | null
  n: number
}

export type Probabilities = {
  very_hot: ProbabilityBase & { threshold: number }
  very_cold: ProbabilityBase & { threshold: number }
  very_windy: ProbabilityBase & { threshold: number }
  very_humid: ProbabilityBase & { threshold: number }
  very_uncomfortable: ProbabilityBase & { rule: string }
}

export type UncertaintyBand = {
  p25: (number | null)[]
  p75: (number | null)[]
}

export type AnalyzeResponse = {
  location: {
    city: string
    country: string
    lat: number
    lon: number
  }
  range: string
  temperature: (number | null)[]
  humidity: (number | null)[]
  precipitation: (number | null)[]
  wind: (number | null)[]
  air_quality_index: {
    aqi: number | null
    category: string
    dominant_pollutant: string | null
    source: string
  }
  comfort_index: string
  comfort_index_i18n?: Record<'es' | 'en', string>
  eco_impact: string
  eco_impact_i18n?: Record<'es' | 'en', string>
  trend: TrendMap
  wayra_advisor: string
  wayra_advisor_i18n?: Record<'es' | 'en', string>
  best_days: BestDay[]
  probabilities?: Probabilities
  sources: string[]
  meta: {
    units: Record<string, string>
    data_quality?: {
      nasa?: Record<string, { n: number; valid: number; nulls: number; coverage: number }>
    }
    uncertainty?: Record<string, UncertaintyBand>
  }
}

export type HourlyBestHour = {
  time: string
  score: number
  notes: string
}

export type HourlyResponse = {
  date: string
  time: string[]
  temperature: number[]
  humidity: number[]
  wind: number[]
  precipitation: number[]
  best_hours?: HourlyBestHour[]
  source: {
    name: string
    units: Record<string, string>
  }
}

export type ApiError = Error & {
  status?: number
  details?: unknown
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000'

export const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status as number | undefined
    const details = error.response?.data
    const message =
      (typeof details === 'object' && details !== null && 'detail' in details
        ? String((details as { detail?: unknown }).detail)
        : undefined) ??
      (status === 502
        ? 'Error en el servicio WayraScope (502). Intenta nuevamente en unos minutos.'
        : error.message || 'Falla inesperada de red')

    const normalized: ApiError = Object.assign(new Error(message), {
      status,
      details
    })

    return Promise.reject(normalized)
  }
)

export const analyzeCity = async (payload: AnalyzeBody): Promise<AnalyzeResponse> => {
  const { data } = await api.post<AnalyzeResponse>('/analyze', payload)
  return data
}

export const analyzeCoords = async (payload: AnalyzeCoordsBody): Promise<AnalyzeResponse> => {
  const { data } = await api.post<AnalyzeResponse>('/analyze/coords', payload)
  return data
}

export const getHourly = async (
  lat: number,
  lon: number,
  date: string,
  eventType?: AnalyzeBody['event_type']
): Promise<HourlyResponse> => {
  const { data } = await api.get<HourlyResponse>('/weather/hourly', {
    params: {
      lat,
      lon,
      date,
      ...(eventType ? { event_type: eventType } : {})
    }
  })
  return data
}

const buildFallbackFilename = (city: string, date: string, extension: string) => {
  const cityPart = sanitizeFilenameSegment(city)
  const datePart = sanitizeFilenameSegment(date)
  return `wayrascope_${cityPart}_${datePart}.${extension}`
}

type DownloadTarget = {
  city?: string
  coords?: { lat: number; lon: number }
  date: string
}

const buildDownloadParams = ({ city, coords, date }: DownloadTarget, fmt: 'csv' | 'json') => {
  const params: Record<string, string | number> = { date, fmt }
  if (coords) {
    params.lat = Number(coords.lat.toFixed(4))
    params.lon = Number(coords.lon.toFixed(4))
  }
  if (city) {
    params.city = city
  }
  return params
}

const buildFallbackName = ({ city, coords, date, extension }: DownloadTarget & { extension: string }) => {
  const baseCity = city ?? (coords ? `${coords.lat.toFixed(3)}_${coords.lon.toFixed(3)}` : 'wayrascope')
  return `wayrascope_${sanitizeFilenameSegment(baseCity)}_${sanitizeFilenameSegment(date)}.${extension}`
}

export const downloadCsv = async ({ city, coords, date }: DownloadTarget): Promise<{ filename: string; meta?: unknown }> => {
  const response = await api.get<Blob>('/download', {
    params: buildDownloadParams({ city, coords, date }, 'csv'),
    responseType: 'blob'
  })

  const disposition = response.headers['content-disposition'] as string | undefined
  const filename =
    parseFilenameFromContentDisposition(disposition) ?? buildFallbackName({ city, coords, date, extension: 'csv' })

  const metaHeader = response.headers['x-wayrameta'] as string | undefined
  let meta: unknown
  if (metaHeader) {
    try {
      meta = JSON.parse(metaHeader)
      console.debug('WayraScope CSV meta', meta)
    } catch (error) {
      console.warn('No se pudo parsear X-WayraMeta', error)
    }
  }

  const contentType = (response.headers['content-type'] as string | undefined) ?? 'text/csv;charset=UTF-8'
  const blob =
    response.data instanceof Blob
      ? response.data
      : new Blob([response.data], { type: contentType })
  saveBlobAsFile(blob, filename)

  return { filename, meta }
}

export const downloadJson = async ({ city, coords, date }: DownloadTarget): Promise<{ filename: string; meta?: unknown }> => {
  const response = await api.get<Blob>('/download', {
    params: buildDownloadParams({ city, coords, date }, 'json'),
    responseType: 'blob'
  })

  const disposition = response.headers['content-disposition'] as string | undefined
  const filename =
    parseFilenameFromContentDisposition(disposition) ?? buildFallbackName({ city, coords, date, extension: 'json' })

  const metaHeader = response.headers['x-wayrameta'] as string | undefined
  let meta: unknown
  if (metaHeader) {
    try {
      meta = JSON.parse(metaHeader)
    } catch (error) {
      console.warn('No se pudo parsear X-WayraMeta', error)
    }
  }

  const contentType = (response.headers['content-type'] as string | undefined) ?? 'application/json;charset=UTF-8'
  const blob =
    response.data instanceof Blob
      ? response.data
      : new Blob([response.data], { type: contentType })
  saveBlobAsFile(blob, filename)

  return { filename, meta }
}
