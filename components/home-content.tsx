'use client'

import { useState, useMemo, useEffect, useCallback, Suspense, memo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useSuspenseProfile } from '@/lib/hooks/use-profile'
import { useSuspenseLists } from '@/lib/hooks/use-lists'
import { useRealtimeInvalidation } from '@/lib/hooks/use-realtime-invalidation'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { TopBar } from './top-bar'
import { ListControls } from './list-controls'
import { CreateListModal } from './create-list-modal'
import { ListItem } from './list-item'
import { Hint } from './hint'
import { InstallPrompt } from './install-prompt'
// --- Skeletons ---

function HomeGreetingSkeleton() {
  return (
    <div className="mb-8 flex min-h-9 items-center pr-24">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-1 h-5 w-32" />
      </div>
    </div>
  )
}

function HomeListsSkeleton() {
  return (
    <div>
      {/* List controls bar placeholder */}
      <Skeleton className="mb-4 h-10 w-full rounded-md" />
      {/* List item placeholders */}
      <div className="space-y-2">
        <Skeleton className="h-[72px] w-full rounded-lg" />
        <Skeleton className="h-[72px] w-full rounded-lg" />
        <Skeleton className="h-[72px] w-full rounded-lg" />
      </div>
    </div>
  )
}

// --- Child components ---

function HomeGreeting() {
  const t = useTranslations()
  const { firstName } = useSuspenseProfile()

  return (
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
  )
}

const HomeListsView = memo(function HomeListsView({ onCreateList }: { onCreateList: () => void }) {
  const t = useTranslations()
  const { data: lists } = useSuspenseLists()
  const [searchQuery, setSearchQuery] = useState('')

  useRealtimeInvalidation({
    channel: 'lists',
    table: 'lists',
    queryKeys: [['lists']],
  })

  const handleSearchChange = useCallback((query: string) => setSearchQuery(query), [])

  const isSearching = searchQuery.trim().length > 0

  const displayedListIds = useMemo(() => {
    if (!isSearching) return lists.map(l => l.id)

    const query = searchQuery.toLowerCase()
    return lists
      .filter((list) => list.name.toLowerCase().includes(query))
      .map(l => l.id)
  }, [lists, searchQuery, isSearching])

  const hasLists = lists.length > 0

  if (!hasLists) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
          {t('lists.empty')}
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {t('lists.emptyDescription')}
        </p>
        <Button className="mt-6" onClick={onCreateList}>
          <Plus className="h-4 w-4" />
          {t('lists.newList')}
        </Button>
      </div>
    )
  }

  return (
    <>
      <ListControls
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onCreateList={onCreateList}
      />

      <InstallPrompt />

      <Hint storageKey="fazer-edit-hint-dismissed">
        {t('todos.editHint')}
      </Hint>

      {displayedListIds.length > 0 ? (
        <div className="space-y-2">
          {displayedListIds.map((id) => (
            <ListItem key={id} listId={id} />
          ))}
        </div>
      ) : (
        <div className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
          {t('lists.noResults')}
        </div>
      )}
    </>
  )
})

// --- Orchestrator ---

export function HomeContent() {
  const t = useTranslations()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const handleOpenCreateModal = useCallback(() => setIsCreateModalOpen(true), [])
  const handleCloseCreateModal = useCallback(() => setIsCreateModalOpen(false), [])

  useEffect(() => {
    if (searchParams.get('toast') === 'no-access') {
      toast(t('share.noAccess'))
      router.replace('/', { scroll: false })
    }
  }, [searchParams, router, t])

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <TopBar onCreateList={handleOpenCreateModal} />

      <CreateListModal
        open={isCreateModalOpen}
        onClose={handleCloseCreateModal}
      />

      <div className="px-4 pt-4 pb-8">
        <Suspense fallback={<HomeGreetingSkeleton />}>
          <HomeGreeting />
        </Suspense>

        <Suspense fallback={<HomeListsSkeleton />}>
          <HomeListsView onCreateList={handleOpenCreateModal} />
        </Suspense>
      </div>
    </div>
  )
}
