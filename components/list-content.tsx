'use client'

import { Suspense, useRef, useCallback, useEffect } from 'react'
import posthog from 'posthog-js'
import { TopBar } from './top-bar'
import { ListHeader } from './list-header'
import { TodoList } from './todo-list'
import { Skeleton } from '@/components/ui/skeleton'
import type { Tables } from '@/supabase/database.types'

type Props = {
  list: Tables<'lists'>
}

function ListHeaderSkeleton() {
  return (
    <div>
      {/* Back link row */}
      <div className="flex min-h-9 items-center">
        <Skeleton className="h-4 w-20" />
      </div>
      {/* Title + actions row */}
      <div className="mt-4 flex items-start justify-between gap-4">
        <Skeleton className="h-8 w-48" />
        <div className="flex shrink-0 items-center gap-1">
          <Skeleton className="h-9 w-9" />
        </div>
      </div>
      {/* Members row */}
      <div className="mt-2 flex -space-x-2">
        <Skeleton className="size-6 rounded-full" />
        <Skeleton className="size-6 rounded-full" />
      </div>
    </div>
  )
}

function TodoListSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  )
}

export function ListContent({ list }: Props) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const fromShare = params.get('from_share')
    if (fromShare) {
      const trackingKey = `fazer-share-tracked:${fromShare}`
      if (!localStorage.getItem(trackingKey)) {
        posthog.capture('list_shared', { list_id: list.id, share_token: fromShare, method: 'link' })
        localStorage.setItem(trackingKey, '1')
      }
      window.history.replaceState({}, '', `/l/${list.id}`)
    }
  }, [list.id])

  const triggerCreateRef = useRef<(() => void) | null>(null)
  const handleAddClick = useCallback(() => triggerCreateRef.current?.(), [])

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <TopBar onPlusClick={handleAddClick} />

      {/* Sticky header */}
      <div className="sticky top-0 z-40 bg-zinc-50 px-4 pt-4 pb-6 dark:bg-zinc-950">
        <Suspense fallback={<ListHeaderSkeleton />}>
          <ListHeader listId={list.id} />
        </Suspense>
      </div>

      {/* Scrollable content */}
      <div className="px-4 pb-20">
        <Suspense fallback={<TodoListSkeleton />}>
          <TodoList
            listId={list.id}
            triggerCreateRef={triggerCreateRef}
          />
        </Suspense>
      </div>
    </div>
  )
}
