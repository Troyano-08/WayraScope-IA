import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { clsx } from 'clsx'

import { AnalyzeButton } from './components/controls/AnalyzeButton'
import { CityInput } from './components/controls/CityInput'
import { DateInput } from './components/controls/DateInput'
import { EventSelect } from './components/controls/EventSelect'
import { LanguageSwitch } from './components/controls/LanguageSwitch'
import { ThemeSwitch } from './components/controls/ThemeSwitch'
import { MapPicker } from './components/map/MapPicker'
import { AqiCard } from './components/cards/AqiCard'
import { ComfortCard } from './components/cards/ComfortCard'
import { EcoCard } from './components/cards/EcoCard'
import { LocationCard } from './components/cards/LocationCard'
import { TrendsBar } from './components/cards/TrendsBar'
import { DailyChart } from './components/charts/DailyChart'
import { HourlyChart } from './components/charts/HourlyChart'
import { ProbabilitiesPanel } from './components/ProbabilitiesPanel'
import { BestDays } from './components/BestDays'
import { Downloads } from './components/Downloads'
import { SourcesFooter } from './components/SourcesFooter'
import { Alert } from './components/ui/Alert'
import { Skeleton } from './components/ui/Skeleton'
import { LoadingPlanet } from './components/ui/LoadingPlanet'
import { useAnalyze } from './hooks/useAnalyze'
import { useHourly } from './hooks/useHourly'
import { useAppStore, STORAGE_THEME } from './store/useAppStore'

const SummarySkeleton = () => (
  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
    {Array.from({ length: 4 }).map((_, index) => (
      <Skeleton key={index} className="h-36 w-full" />
    ))}
  </div>
)

const ChartSkeleton = () => <Skeleton className="h-80 w-full" />

export const App = () => {
  const { t, i18n } = useTranslation('common')
  const {
    analyzeResult,
    analyzeLoading,
    analyzeError,
    date,
    setDate,
    eventType,
    theme,
    setTheme,
    language,
    city: cityInput
  } = useAppStore((state) => ({
    analyzeResult: state.analyzeResult,
    analyzeLoading: state.analyzeLoading,
    analyzeError: state.analyzeError,
    date: state.date,
    setDate: state.setDate,
    eventType: state.eventType,
    theme: state.theme,
    setTheme: state.setTheme,
    language: state.language,
    city: state.city
  }))
  const { error: analyzeHookError } = useAnalyze()
  const { data: hourlyData, isLoading: hourlyLoading, error: hourlyError, loadHourly } = useHourly()

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(STORAGE_THEME) as 'dark' | 'light' | null
    if (!storedTheme) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setTheme(prefersDark ? 'dark' : 'light')
    }
  }, [setTheme])

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
  }, [theme])

  useEffect(() => {
    if (i18n.language !== language) {
      i18n.changeLanguage(language).catch((error) => console.warn('i18n change failed', error))
    }
  }, [i18n, language])

  useEffect(() => {
    if (!analyzeResult) return
    loadHourly(analyzeResult.location.lat, analyzeResult.location.lon, date, eventType).catch((error) => {
      console.warn('Hourly fetch failed', error)
    })
  }, [analyzeResult, date, eventType, loadHourly])

  const handleSelectBestDay = (bestDate: string) => {
    setDate(bestDate)
    if (!analyzeResult) return
    loadHourly(analyzeResult.location.lat, analyzeResult.location.lon, bestDate, eventType, true).catch(
      (error) => console.warn('Hourly fetch failed', error)
    )
  }

  const showSkeletons = analyzeLoading
  const showEmptyState = !analyzeLoading && !analyzeResult

  const advisorText = useMemo(() => analyzeResult?.wayra_advisor ?? '', [analyzeResult])
  const downloadsCity = useMemo(() => analyzeResult?.location.city ?? cityInput, [analyzeResult, cityInput])

  return (
    <div className={clsx('min-h-screen pb-16 text-slate-900 transition-colors duration-500', theme === 'dark' && 'text-white')}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10">
        <header className="relative overflow-hidden rounded-3xl border border-white/40 bg-white/75 p-6 shadow-glow starfield backdrop-blur-xl transition duration-500 dark:border-slate-500/30 dark:bg-slate-900/70">
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{t('app.title')}</h1>
              <p className="mt-1 max-w-xl text-sm text-slate-600 dark:text-slate-300">{t('app.subtitle')}</p>
              <a
                href="#sources"
                className="mt-3 inline-flex items-center text-xs font-semibold uppercase tracking-[0.3em] text-accent hover:text-accent/80"
              >
                {t('app.sourcesLink')}
              </a>
            </div>
            <div className="flex items-center gap-2 self-start">
              <ThemeSwitch />
              <LanguageSwitch />
            </div>
          </div>
        </header>

        <section className="glass-card space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <CityInput />
            <DateInput />
            <EventSelect />
            <div className="flex flex-col justify-end">
              <AnalyzeButton />
            </div>
          </div>
          <MapPicker />
          {(analyzeError || analyzeHookError) && (
            <Alert
              variant="error"
              title={t('alerts.errorTitle')}
              description={analyzeError ?? analyzeHookError ?? t('errors.generic')}
            />
          )}
        </section>

        {showSkeletons && (
          <div className="space-y-6">
            <LoadingPlanet label={t('inputs.analyzing')} />
            <SummarySkeleton />
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
        )}

        {showEmptyState && (
          <div className="rounded-3xl border border-dashed border-white/20 bg-white/60 p-10 text-center text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
            <p className="text-lg font-semibold text-slate-800 dark:text-white">{t('app.emptyTitle')}</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{t('app.emptySubtitle')}</p>
          </div>
        )}

        {analyzeResult && !showSkeletons && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <LocationCard location={analyzeResult.location} />
              <ComfortCard comfortIndex={analyzeResult.comfort_index} advisor={analyzeResult.wayra_advisor} />
              <EcoCard ecoImpact={analyzeResult.eco_impact} />
              <AqiCard airQuality={analyzeResult.air_quality_index} />
            </div>

            <TrendsBar trend={analyzeResult.trend} />

            <DailyChart
              range={analyzeResult.range}
              temperature={analyzeResult.temperature}
              precipitation={analyzeResult.precipitation}
              uncertainty={analyzeResult.meta.uncertainty}
              dataQuality={analyzeResult.meta.data_quality}
              units={analyzeResult.meta.units}
              eventDate={date}
            />

            <ProbabilitiesPanel probabilities={analyzeResult.probabilities} units={analyzeResult.meta.units} />

            <BestDays bestDays={analyzeResult.best_days} selectedDate={date} onSelect={handleSelectBestDay} />

            {advisorText && (
              <div className="rounded-3xl border border-accent/40 bg-accent/10 p-6 text-sm text-accent">
                <p className="font-semibold uppercase tracking-[0.3em] text-xs text-accent/80">{t('app.advisorTitle')}</p>
                <p className="mt-2 text-base text-accent/90">{advisorText}</p>
              </div>
            )}

            {hourlyError && (
              <Alert
                variant="warning"
                title={t('alerts.hourlyTitle')}
                description={hourlyError}
              />
            )}

            {hourlyLoading ? <LoadingPlanet size="sm" label={t('inputs.analyzing')} /> : <HourlyChart data={hourlyData} />}

            <Downloads city={downloadsCity} date={date} disabled={!analyzeResult} />

            <SourcesFooter sources={analyzeResult.sources} units={analyzeResult.meta.units} />
          </div>
        )}
      </div>
    </div>
  )
}

export default App
