'use client'

import { useTranslations } from 'next-intl'
import { SignOutButton } from './sign-out-button'
import { useProfile } from '@/lib/hooks/use-profile'

export function HomeContent() {
  const t = useTranslations('auth')
  const { displayName, isLoading } = useProfile()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-100" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="w-full max-w-sm px-6">
        <div className="flex flex-col items-center gap-6 text-center">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {t('welcomeBack')}, {displayName}
            </h1>
          </div>

          <SignOutButton />
        </div>
      </div>
    </div>
  )
}
