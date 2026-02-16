'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import posthog from 'posthog-js'
import { useTranslations } from 'next-intl'
import { useTodos } from '@/lib/hooks/use-todos'
import { useList } from '@/lib/hooks/use-lists'
import { useRealtimeInvalidation } from '@/lib/hooks/use-realtime-invalidation'
import { Button } from '@/components/ui/button'
import { ListCard } from '@/components/ui/list-card'
import { UserAvatar } from './user-avatar'
import type { Tables } from '@/supabase/database.types'
import type { Profile } from '@/lib/hooks/use-profile'

type Props = {
  list: Tables<'lists'>
  ownerProfile: Profile
  shareToken: string
}

export function SharedListContent({ list, ownerProfile, shareToken }: Props) {
  const t = useTranslations()

  useEffect(() => {
    posthog.capture('share_link_visited', { list_id: list.id, share_token: shareToken })
    localStorage.setItem('fazer-referred-by-share', '1')
  }, [list.id, shareToken])

  const { data: listData } = useList(list.id)
  const currentList = listData ?? list
  const { data: todos, isLoading } = useTodos(list.id)

  // Live updates: invalidate cache when todos or list metadata change
  useRealtimeInvalidation({
    channel: `todos:${list.id}`,
    table: 'todos',
    filter: `list_id=eq.${list.id}`,
    queryKeys: [['todos', list.id]],
  })
  useRealtimeInvalidation({
    channel: `list:${list.id}`,
    table: 'lists',
    filter: `id=eq.${list.id}`,
    queryKeys: [['lists', list.id]],
  })

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-100" />
      </div>
    )
  }

  const ownerName = ownerProfile.displayName || ownerProfile.display_name || ownerProfile.email || ''

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="px-4 pt-4 pb-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
            <UserAvatar
              displayName={ownerName}
              avatarUrl={ownerProfile.avatar_url}
              size="sm"
            />
            <span>
              {t('share.sharedBy', { name: ownerName })}
            </span>
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {currentList.name}
          </h1>

          {/* Sign in CTA */}
          <div className="mt-4 flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="flex-1 text-sm text-zinc-600 dark:text-zinc-400">
              {t('share.signInToEdit')}
            </p>
            <Button asChild size="sm">
              <Link href={`/login?next=/s/${shareToken}`}>
                {t('share.signIn')}
              </Link>
            </Button>
          </div>
        </div>

        {/* Todo list (read-only) */}
        {todos && todos.length > 0 ? (
          <div className="space-y-2">
            {todos.map((todo) => (
              <ListCard key={todo.id}>
                <span
                  className={
                    todo.is_complete
                      ? 'text-zinc-400 line-through dark:text-zinc-500'
                      : 'text-zinc-900 dark:text-zinc-50'
                  }
                >
                  {todo.title}
                </span>
              </ListCard>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {t('todos.empty')}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
