'use client'

import { NextIntlClientProvider } from 'next-intl'
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { defaultLocale, locales, type Locale } from '@/lib/i18n/config'

type LocaleContextType = {
  locale: Locale
  setLocale: (locale: Locale) => void
}

const LocaleContext = createContext<LocaleContextType | null>(null)

export function useLocale() {
  const context = useContext(LocaleContext)
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider')
  }
  return context
}

function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return defaultLocale

  const stored = localStorage.getItem('fazer-locale')
  if (stored && locales.includes(stored as Locale)) {
    return stored as Locale
  }

  const browserLang = navigator.language.split('-')[0]
  if (locales.includes(browserLang as Locale)) {
    return browserLang as Locale
  }

  return defaultLocale
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale)
  const [messages, setMessages] = useState<Record<string, unknown> | null>(null)

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    // Only store if different from browser default
    const browserLang = navigator.language.split('-')[0]
    if (newLocale === browserLang) {
      localStorage.removeItem('fazer-locale')
    } else {
      localStorage.setItem('fazer-locale', newLocale)
    }
  }, [])

  useEffect(() => {
    const initialLocale = getInitialLocale()
    setLocaleState(initialLocale)
  }, [])

  useEffect(() => {
    import(`@/messages/${locale}.json`).then((mod) => {
      setMessages(mod.default)
    })
  }, [locale])

  if (!messages) {
    return null
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        {children}
      </NextIntlClientProvider>
    </LocaleContext.Provider>
  )
}
