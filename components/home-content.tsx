'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plus } from 'lucide-react'
import { useProfile } from '@/lib/hooks/use-profile'
import { useLists } from '@/lib/hooks/use-lists'
import { Button } from '@/components/ui/button'
import { SettingsButton } from './settings-button'
import { CreateListModal } from './create-list-modal'
import { ListItem } from './list-item'

export function HomeContent() {
  const t = useTranslations()
  const { firstName, isLoading: profileLoading } = useProfile()
  const { data: lists, isLoading: listsLoading } = useLists()

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const isLoading = profileLoading || listsLoading

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-100" />
      </div>
    )
  }

  const hasLists = lists && lists.length > 0

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
        {/* Header */}
        <div className="mb-8 flex min-h-9 items-center">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {t('auth.welcomeBack')}, {firstName}
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {t('lists.title')}
            </p>
          </div>
        </div>

        {/* Empty state */}
        {!hasLists && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
              {t('lists.empty')}
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {t('lists.emptyDescription')}
            </p>
            <Button className="mt-6" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4" />
              {t('lists.newList')}
            </Button>
          </div>
        )}

        {/* Lists */}
        {hasLists && (
          <>
            <div className="mb-4">
              <Button variant="outline" onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4" />
                {t('lists.newList')}
              </Button>
            </div>

            <div className="space-y-2">
              {lists.map((list) => (
                <ListItem key={list.id} list={list} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
