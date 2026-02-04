'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Plus, MoreHorizontal, Trash2 } from 'lucide-react'
import { useProfile } from '@/lib/hooks/use-profile'
import { useLists, useCreateList, useDeleteList } from '@/lib/hooks/use-lists'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SignOutButton } from './sign-out-button'
import { SettingsButton } from './settings-button'

export function HomeContent() {
  const t = useTranslations()
  const router = useRouter()
  const { firstName, isLoading: profileLoading } = useProfile()
  const { data: lists, isLoading: listsLoading } = useLists()
  const createList = useCreateList()
  const deleteList = useDeleteList()

  const [isCreating, setIsCreating] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)

  const isLoading = profileLoading || listsLoading

  async function handleCreateList(e: React.FormEvent) {
    e.preventDefault()
    if (!newListName.trim()) return

    await createList.mutateAsync(newListName.trim())
    setNewListName('')
    setIsCreating(false)
  }

  async function handleDeleteList(id: string) {
    if (confirm(t('lists.deleteConfirm'))) {
      await deleteList.mutateAsync(id)
    }
    setMenuOpenId(null)
  }

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
        <SignOutButton />
        <SettingsButton />
      </div>

      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {t('auth.welcomeBack')}, {firstName}
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {t('lists.title')}
          </p>
        </div>

        {/* Empty state */}
        {!hasLists && !isCreating && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
              {t('lists.empty')}
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {t('lists.emptyDescription')}
            </p>
            <Button className="mt-6" onClick={() => setIsCreating(true)}>
              <Plus className="h-4 w-4" />
              {t('lists.newList')}
            </Button>
          </div>
        )}

        {/* New list form */}
        {isCreating && (
          <form onSubmit={handleCreateList} className="mb-6">
            <div className="flex gap-2">
              <Input
                autoFocus
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder={t('lists.newListPlaceholder')}
                className="flex-1"
              />
              <Button type="submit" disabled={!newListName.trim() || createList.isPending}>
                {t('common.create')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreating(false)
                  setNewListName('')
                }}
              >
                {t('common.cancel')}
              </Button>
            </div>
          </form>
        )}

        {/* Lists */}
        {hasLists && (
          <>
            {!isCreating && (
              <div className="mb-4">
                <Button variant="outline" onClick={() => setIsCreating(true)}>
                  <Plus className="h-4 w-4" />
                  {t('lists.newList')}
                </Button>
              </div>
            )}

            <div className="space-y-2">
              {lists.map((list) => (
                <div
                  key={list.id}
                  className="group flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-4 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                >
                  <button
                    onClick={() => router.push(`/l/${list.id}`)}
                    className="flex-1 text-left"
                  >
                    <span className="font-medium text-zinc-900 dark:text-zinc-50">
                      {list.name}
                    </span>
                  </button>

                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100"
                      onClick={() => setMenuOpenId(menuOpenId === list.id ? null : list.id)}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>

                    {menuOpenId === list.id && (
                      <div className="absolute right-0 top-full z-10 mt-1 w-36 overflow-hidden rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
                        <button
                          onClick={() => handleDeleteList(list.id)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-zinc-50 dark:text-red-400 dark:hover:bg-zinc-800"
                        >
                          <Trash2 className="h-4 w-4" />
                          {t('common.delete')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
