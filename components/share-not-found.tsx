'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'

export function ShareNotFound() {
  const t = useTranslations('share')

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="w-full max-w-sm px-6">
        <div className="flex flex-col items-center gap-6 text-center">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {t('notFound')}
            </h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              {t('notFoundDescription')}
            </p>
          </div>

          <Button asChild>
            <Link href="/login">
              {t('signIn')}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
