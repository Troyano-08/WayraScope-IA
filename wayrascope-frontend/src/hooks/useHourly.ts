import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { getHourly, type HourlyResponse } from '../lib/api'
import { buildHourlyKey, useAppStore } from '../store/useAppStore'

export const useHourly = () => {
  const { t } = useTranslation('common')
  const { cacheHourly, getHourlyFromCache } = useAppStore((state) => ({
    cacheHourly: state.cacheHourly,
    getHourlyFromCache: state.getHourlyFromCache
  }))

  const [data, setData] = useState<HourlyResponse | undefined>()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | undefined>()

  const loadHourly = useCallback(
    async (
      lat: number,
      lon: number,
      date: string,
      eventType?: Parameters<typeof getHourly>[3],
      force = false
    ) => {
      const cacheKey = buildHourlyKey(lat, lon, date, eventType)
      if (!force) {
        const cached = getHourlyFromCache(cacheKey)
        if (cached) {
          setData(cached)
          setError(undefined)
          return cached
        }
      }

      setIsLoading(true)
      setError(undefined)

      try {
        const response = await getHourly(lat, lon, date, eventType)
        cacheHourly(cacheKey, response)
        setData(response)
        return response
      } catch (err) {
        const message = err instanceof Error ? err.message : t('errors.hourlyFetch')
        setError(message)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [cacheHourly, getHourlyFromCache, t]
  )

  return {
    data,
    isLoading,
    error,
    loadHourly
  }
}
