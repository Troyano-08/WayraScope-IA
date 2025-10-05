import { MoonStar, Sun } from 'lucide-react'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import { useAppStore, type ThemeMode } from '../../store/useAppStore'
import { Button } from '../ui/Button'

export const ThemeSwitch = () => {
  const { t } = useTranslation('common')
  const { theme, setTheme } = useAppStore((state) => ({
    theme: state.theme,
    setTheme: state.setTheme
  }))

  const toggleTheme = useCallback(() => {
    const next: ThemeMode = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
  }, [setTheme, theme])

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={toggleTheme}
      className="px-3 py-1 text-xs"
      leftIcon={theme === 'dark' ? <Sun className="h-4 w-4" aria-hidden /> : <MoonStar className="h-4 w-4" aria-hidden />}
      aria-label={theme === 'dark' ? t('header.switchLight') : t('header.switchDark')}
    >
      {theme === 'dark' ? t('header.light') : t('header.dark')}
    </Button>
  )
}
