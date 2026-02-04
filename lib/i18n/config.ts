export const locales = ['en', 'pt'] as const
export type Locale = (typeof locales)[number]

export const localeNames: Record<Locale, string> = {
  en: 'English',
  pt: 'Português',
}

export const defaultLocale: Locale = 'en'
