'use client'

import { useState, useMemo, useEffect, useCallback, Suspense, memo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent, DropAnimation } from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { useSuspenseProfile } from '@/lib/hooks/use-profile'
import { useSuspenseLists, useReorderLists } from '@/lib/hooks/use-lists'
import { useRealtimeInvalidation } from '@/lib/hooks/use-realtime-invalidation'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { TopBar } from './top-bar'
import { ListControls } from './list-controls'
import { CreateListModal } from './create-list-modal'
import { SortableListItem, DragOverlayContent } from './sortable-list-item'
import { Hint } from './hint'
import { InstallPrompt } from './install-prompt'
// --- Skeletons ---

function HomeGreetingSkeleton() {
  return (
    <div className="flex min-h-9 items-center pr-24">
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
    <div className="flex min-h-9 items-center pr-24">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {t('auth.welcomeBack')}, {firstName}
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {t('lists.title')}
        </p>
      </div>
    </div>
  )
}

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: { active: { opacity: '0.5' } },
  }),
}

// --- HomeHeaderControls ---
// Renders list controls, install prompt, and hint when lists exist.
// Uses useSuspenseLists (deduplicated by React Query) to check hasLists.

const selectHasLists = (lists: unknown[]) => lists.length > 0

const HomeHeaderControls = memo(function HomeHeaderControls({
  searchQuery,
  onSearchChange,
  onCreateList,
}: {
  searchQuery: string
  onSearchChange: (query: string) => void
  onCreateList: () => void
}) {
  const t = useTranslations()
  const { data: hasLists } = useSuspenseLists({ select: selectHasLists })

  if (!hasLists) return null

  return (
    <>
      <ListControls
        className="mb-4"
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        onCreateList={onCreateList}
      />
      <InstallPrompt />
      <Hint storageKey="fazer-edit-hint-dismissed">
        {t('todos.editHint')}
      </Hint>
    </>
  )
})

// --- HomeListsView ---

const HomeListsView = memo(function HomeListsView({
  searchQuery,
  onCreateList,
}: {
  searchQuery: string
  onCreateList: () => void
}) {
  const t = useTranslations()
  const { data: lists } = useSuspenseLists()
  const reorderLists = useReorderLists()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [localOrder, setLocalOrder] = useState<string[]>(() => lists.map(l => l.id))

  // Sync local order when server data changes (mutation settled, realtime, etc.)
  const serverIds = useMemo(() => lists.map(l => l.id), [lists])
  useEffect(() => {
    setLocalOrder(serverIds)
  }, [serverIds])

  useRealtimeInvalidation({
    channel: 'lists',
    table: 'lists',
    queryKeys: [['lists']],
  })

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const isSearching = searchQuery.trim().length > 0

  const displayedListIds = useMemo(() => {
    if (!isSearching) return localOrder

    const query = searchQuery.toLowerCase()
    const nameMap = new Map(lists.map(l => [l.id, l.name]))
    return localOrder.filter((id) => nameMap.get(id)?.toLowerCase().includes(query))
  }, [localOrder, lists, searchQuery, isSearching])

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }, [])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveId(null)

    const { active, over } = event
    if (!over || active.id === over.id) return

    setLocalOrder((prev) => {
      const oldIndex = prev.indexOf(active.id as string)
      const newIndex = prev.indexOf(over.id as string)
      const reordered = arrayMove(prev, oldIndex, newIndex)

      const updates = reordered.map((id, index) => ({ id, position: index }))
      reorderLists.mutate(updates)

      return reordered
    })
  }, [reorderLists])

  const handleDragCancel = useCallback(() => {
    setActiveId(null)
  }, [])

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

  return displayedListIds.length > 0 ? (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={displayedListIds} strategy={verticalListSortingStrategy}>
        <div className="grid gap-2">
          {displayedListIds.map((id) => (
            <SortableListItem key={id} listId={id} disabled={isSearching} />
          ))}
        </div>
      </SortableContext>
      <DragOverlay dropAnimation={dropAnimation}>
        {activeId ? <DragOverlayContent listId={activeId} /> : null}
      </DragOverlay>
    </DndContext>
  ) : (
    <div className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
      {t('lists.noResults')}
    </div>
  )
})

// --- Orchestrator ---

export function HomeContent() {
  const t = useTranslations()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const handleOpenCreateModal = useCallback(() => setIsCreateModalOpen(true), [])
  const handleCloseCreateModal = useCallback(() => setIsCreateModalOpen(false), [])
  const handleSearchChange = useCallback((query: string) => setSearchQuery(query), [])

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

      {/* Sticky header */}
      <div className="sticky flex flex-col gap-2 top-0 z-40 bg-zinc-50 px-4 pt-4 pb-4 dark:bg-zinc-950">
        <Suspense fallback={<HomeGreetingSkeleton />}>
          <HomeGreeting />
        </Suspense>
        <Suspense fallback={null}>
          <HomeHeaderControls
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            onCreateList={handleOpenCreateModal}
          />
        </Suspense>
      </div>

      {/* Scrollable content */}
      <div className="px-4 pb-8">
        <Suspense fallback={<HomeListsSkeleton />}>
          <HomeListsView
            searchQuery={searchQuery}
            onCreateList={handleOpenCreateModal}
          />
        </Suspense>
      </div>
    </div>
  )
}
