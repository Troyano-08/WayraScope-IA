import { create } from 'zustand'

import type {
  AnalyzeBody,
  AnalyzeCoordsBody,
  AnalyzeResponse,
  HourlyResponse
} from '../lib/api'

export const STORAGE_LANGUAGE = 'wayrascope:language'
export const STORAGE_THEME = 'wayrascope:theme'

const todayIso = new Date().toISOString().slice(0, 10)

const getStoredItem = (key: string): string | undefined => {
  if (typeof window === 'undefined') return undefined
  try {
    const value = window.localStorage.getItem(key)
    return value ?? undefined
  } catch (error) {
    console.warn('Storage read failed', error)
    return undefined
  }
}

const writeStoredItem = (key: string, value: string) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, value)
  } catch (error) {
    console.warn('Storage write failed', error)
  }
}

export type Coordinates = {
  lat: number
  lon: number
}

export type LanguageCode = 'es' | 'en'
export type ThemeMode = 'dark' | 'light'

type LastQuery =
  | { mode: 'city'; payload: AnalyzeBody }
  | { mode: 'coords'; payload: AnalyzeCoordsBody }

type HourlyCache = Record<string, HourlyResponse>

type AppState = {
  city: string
  date: string
  eventType: AnalyzeBody['event_type']
  coords?: Coordinates
  usePin: boolean
  language: LanguageCode
  theme: ThemeMode
  analyzeResult?: AnalyzeResponse
  analyzeLoading: boolean
  analyzeError?: string
  lastAnalyze?: string
  lastQuery?: LastQuery
  hourlyCache: HourlyCache
  setCity: (city: string) => void
  setDate: (date: string) => void
  setEventType: (eventType: AnalyzeBody['event_type']) => void
  setCoords: (coords?: Coordinates) => void
  setUsePin: (usePin: boolean) => void
  setLanguage: (language: LanguageCode) => void
  setTheme: (theme: ThemeMode) => void
  setAnalyzeLoading: (loading: boolean) => void
  setAnalyzeResult: (result?: AnalyzeResponse) => void
  setAnalyzeError: (error?: string) => void
  setLastAnalyze: (timestamp?: string) => void
  setLastQuery: (query?: LastQuery) => void
  cacheHourly: (key: string, data: HourlyResponse) => void
  getHourlyFromCache: (key: string) => HourlyResponse | undefined
  clearHourlyCache: () => void
  resetAnalysis: () => void
}

const initialLanguage = (getStoredItem(STORAGE_LANGUAGE) as LanguageCode | undefined) ?? 'es'
const initialTheme = (getStoredItem(STORAGE_THEME) as ThemeMode | undefined) ?? 'dark'

export const useAppStore = create<AppState>((set, get) => ({
  city: '',
  date: todayIso,
  eventType: 'viaje',
  coords: undefined,
  usePin: false,
  language: initialLanguage,
  theme: initialTheme,
  analyzeResult: undefined,
  analyzeLoading: false,
  analyzeError: undefined,
  lastAnalyze: undefined,
  lastQuery: undefined,
  hourlyCache: {},
  setCity: (city) => set({ city }),
  setDate: (date) => set({ date }),
  setEventType: (eventType) => set({ eventType }),
  setCoords: (coords) => set({ coords }),
  setUsePin: (usePin) => set({ usePin }),
  setLanguage: (language) => {
    writeStoredItem(STORAGE_LANGUAGE, language)
    set({ language })
  },
  setTheme: (theme) => {
    writeStoredItem(STORAGE_THEME, theme)
    set({ theme })
  },
  setAnalyzeLoading: (analyzeLoading) => set({ analyzeLoading }),
  setAnalyzeResult: (analyzeResult) => set({ analyzeResult }),
  setAnalyzeError: (analyzeError) => set({ analyzeError }),
  setLastAnalyze: (lastAnalyze) => set({ lastAnalyze }),
  setLastQuery: (lastQuery) => set({ lastQuery }),
  cacheHourly: (key, data) =>
    set({
      hourlyCache: {
        ...get().hourlyCache,
        [key]: data
      }
    }),
  getHourlyFromCache: (key) => get().hourlyCache[key],
  clearHourlyCache: () => set({ hourlyCache: {} }),
  resetAnalysis: () =>
    set({
      analyzeResult: undefined,
      analyzeError: undefined,
      analyzeLoading: false,
      lastAnalyze: undefined,
      lastQuery: undefined
    })
}))

export const buildHourlyKey = (
  lat: number,
  lon: number,
  date: string,
  eventType?: AnalyzeBody['event_type']
): string => {
  const roundedLat = lat.toFixed(3)
  const roundedLon = lon.toFixed(3)
  return `${roundedLat}|${roundedLon}|${date}|${eventType ?? 'all'}`
}
