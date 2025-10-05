import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import { useAppStore, type LanguageCode } from '../../store/useAppStore'
import { Button } from '../ui/Button'

const languages: LanguageCode[] = ['es', 'en']

export const LanguageSwitch = () => {
  const { i18n, t } = useTranslation('common')
  const { language, setLanguage } = useAppStore((state) => ({
    language: state.language,
    setLanguage: state.setLanguage
  }))

  const handleChange = useCallback(
    async (lang: LanguageCode) => {
      setLanguage(lang)
      await i18n.changeLanguage(lang)
    },
    [i18n, setLanguage]
  )

  return (
    <div className="flex items-center gap-1" aria-label={t('header.languageToggleLabel')}>
      {languages.map((lang) => (
        <Button
          key={lang}
          type="button"
          variant={language === lang ? 'solid' : 'ghost'}
          className="px-3 py-1 text-xs uppercase"
          onClick={() => handleChange(lang)}
        >
          {lang.toUpperCase()}
        </Button>
      ))}
    </div>
  )
}
