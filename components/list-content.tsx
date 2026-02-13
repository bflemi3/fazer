'use client'

import { Suspense, useState, useCallback } from 'react'
import { TopBar } from './top-bar'
import { ListHeader } from './list-header'
import { TodoList } from './todo-list'
import { CreateListModal } from './create-list-modal'
import { Skeleton } from '@/components/ui/skeleton'
import type { Tables } from '@/supabase/database.types'

type Props = {
  list: Tables<'lists'>
}

function ListHeaderSkeleton() {
  return (
    <div className="mb-8">
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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const handleOpenCreateModal = useCallback(() => setIsCreateModalOpen(true), [])

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <TopBar onCreateList={handleOpenCreateModal} />

      <CreateListModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <div className="px-4 pt-4 pb-8">
        <Suspense fallback={<ListHeaderSkeleton />}>
          <ListHeader listId={list.id} />
        </Suspense>

        <Suspense fallback={<TodoListSkeleton />}>
          <TodoList listId={list.id} />
        </Suspense>
      </div>
    </div>
  )
}
