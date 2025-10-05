import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import { analyzeCity, analyzeCoords } from '../lib/api'
import { useAppStore } from '../store/useAppStore'

export const useAnalyze = () => {
  const { t } = useTranslation('common')

  const {
    city,
    date,
    eventType,
    coords,
    usePin,
    setAnalyzeLoading,
    setAnalyzeError,
    setAnalyzeResult,
    setLastAnalyze,
    clearHourlyCache,
    setLastQuery,
    setCity,
    setCoords
  } = useAppStore((state) => ({
    city: state.city,
    date: state.date,
    eventType: state.eventType,
    coords: state.coords,
    usePin: state.usePin,
    setAnalyzeLoading: state.setAnalyzeLoading,
    setAnalyzeError: state.setAnalyzeError,
    setAnalyzeResult: state.setAnalyzeResult,
    setLastAnalyze: state.setLastAnalyze,
    clearHourlyCache: state.clearHourlyCache,
    setLastQuery: state.setLastQuery,
    setCity: state.setCity,
    setCoords: state.setCoords
  }))

  const { analyzeLoading, analyzeError } = useAppStore((state) => ({
    analyzeLoading: state.analyzeLoading,
    analyzeError: state.analyzeError
  }))

  const runAnalyze = useCallback(async () => {
    setAnalyzeLoading(true)
    setAnalyzeError(undefined)

    try {
      const trimmedCity = city.trim()

      if (usePin) {
        if (!coords) {
          const message = t('errors.mapRequired')
          setAnalyzeError(message)
          throw new Error(message)
        }

        const payload = {
          lat: coords.lat,
          lon: coords.lon,
          date,
          event_type: eventType
        }

        setLastQuery({ mode: 'coords', payload })
        const result = await analyzeCoords(payload)
        setAnalyzeResult(result)
        setLastAnalyze(new Date().toISOString())
        clearHourlyCache()
        if (result.location?.city) {
          setCity(result.location.city)
        }
        setCoords({ lat: result.location.lat, lon: result.location.lon })
        return result
      }

      if (!trimmedCity) {
        const message = t('errors.missingCity')
        setAnalyzeError(message)
        throw new Error(message)
      }

      const payload = { city: trimmedCity, date, event_type: eventType }
      setLastQuery({ mode: 'city', payload })

      const result = await analyzeCity(payload)
      setAnalyzeResult(result)
      setLastAnalyze(new Date().toISOString())
      clearHourlyCache()
      setCity(result.location.city)
      setCoords({ lat: result.location.lat, lon: result.location.lon })
      return result
    } catch (error) {
      const message = error instanceof Error ? error.message : t('errors.generic')
      setAnalyzeError(message)
      setAnalyzeResult(undefined)
      throw error
    } finally {
      setAnalyzeLoading(false)
    }
  }, [
    city,
    clearHourlyCache,
    coords,
    date,
    eventType,
    setAnalyzeError,
    setAnalyzeLoading,
    setAnalyzeResult,
    setCity,
    setCoords,
    setLastAnalyze,
    setLastQuery,
    t,
    usePin
  ])

  return {
    runAnalyze,
    isAnalyzing: analyzeLoading,
    error: analyzeError
  }
}
