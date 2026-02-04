'use client'

import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { SignOutButton } from './sign-out-button'
import { SettingsButton } from './settings-button'
import type { Tables } from '@/supabase/database.types'

type Props = {
  list: Tables<'lists'>
}

export function ListContent({ list }: Props) {
  const router = useRouter()
  const t = useTranslations()

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Top right buttons */}
      <div className="fixed right-4 top-4 z-50 flex gap-2">
        <SignOutButton />
        <SettingsButton />
      </div>

      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Header with back button */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            className="mb-4 -ml-2"
            onClick={() => router.push('/')}
          >
            <ArrowLeft className="h-4 w-4" />
            {t('lists.title')}
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {list.name}
          </h1>
        </div>

        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Todo items will go here
        </p>
      </div>
    </div>
  )
}
