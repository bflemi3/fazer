'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Plus, Search, ArrowUpDown } from 'lucide-react'
import { toast } from 'sonner'
import { useProfile } from '@/lib/hooks/use-profile'
import { useLists } from '@/lib/hooks/use-lists'
import { useRealtimeInvalidation } from '@/lib/hooks/use-realtime-invalidation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SettingsButton } from './settings-button'
import { CreateListModal } from './create-list-modal'
import { ListItem } from './list-item'

type SortOption = 'newest' | 'oldest' | 'name-asc' | 'name-desc'

export function HomeContent() {
  const t = useTranslations()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { firstName, isLoading: profileLoading } = useProfile()
  const { data: lists, isLoading: listsLoading } = useLists()

  // Live updates: invalidate cache when lists change
  useRealtimeInvalidation({
    channel: 'lists',
    table: 'lists',
    queryKeys: [['lists']],
  })

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('newest')

  useEffect(() => {
    if (searchParams.get('toast') === 'no-access') {
      toast(t('share.noAccess'))
      router.replace('/', { scroll: false })
    }
  }, [searchParams, router, t])

  const isLoading = profileLoading || listsLoading

  const filteredAndSortedLists = useMemo(() => {
    if (!lists) return []

    let result = [...lists]

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter((list) =>
        list.name.toLowerCase().includes(query)
      )
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'name-asc':
          return a.name.localeCompare(b.name)
        case 'name-desc':
          return b.name.localeCompare(a.name)
        default:
          return 0
      }
    })

    return result
  }, [lists, searchQuery, sortBy])

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
        <div className="mb-8 flex min-h-9 items-center pr-24">
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
            {/* Controls */}
            <div className="mb-4 flex items-center justify-between gap-2">
              <Button variant="outline" onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4" />
                {t('lists.newList')}
              </Button>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('lists.searchPlaceholder')}
                    className="w-40 pl-9 sm:w-48"
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuCheckboxItem
                      checked={sortBy === 'newest'}
                      onCheckedChange={() => setSortBy('newest')}
                    >
                      {t('lists.sort.newest')}
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={sortBy === 'oldest'}
                      onCheckedChange={() => setSortBy('oldest')}
                    >
                      {t('lists.sort.oldest')}
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={sortBy === 'name-asc'}
                      onCheckedChange={() => setSortBy('name-asc')}
                    >
                      {t('lists.sort.name-asc')}
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={sortBy === 'name-desc'}
                      onCheckedChange={() => setSortBy('name-desc')}
                    >
                      {t('lists.sort.name-desc')}
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* List items */}
            {filteredAndSortedLists.length > 0 ? (
              <div className="space-y-2">
                {filteredAndSortedLists.map((list) => (
                  <ListItem key={list.id} list={list} />
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
                {t('lists.noResults')}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
