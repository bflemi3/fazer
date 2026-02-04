'use client'

import { useState } from 'react'
import { ArrowLeft, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { SettingsButton } from './settings-button'
import { CreateListModal } from './create-list-modal'
import type { Tables } from '@/supabase/database.types'

type Props = {
  list: Tables<'lists'>
}

export function ListContent({ list }: Props) {
  const router = useRouter()
  const t = useTranslations()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Top right buttons */}
      <div className="fixed right-4 top-4 z-50 flex gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsCreateModalOpen(true)}
          aria-label="Create new list"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <SettingsButton />
      </div>

      <CreateListModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <div className="px-4 pt-4 pb-8">
        {/* Header with back button */}
        <div className="mb-8">
          <div className="flex min-h-9 items-center">
            <Button
              variant="ghost"
              size="sm"
              className="-ml-2"
              onClick={() => router.push('/')}
            >
              <ArrowLeft className="h-4 w-4" />
              {t('lists.title')}
            </Button>
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
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
