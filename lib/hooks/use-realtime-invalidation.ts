import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

type Options = {
  channel: string
  table: string
  filter?: string
  queryKeys: unknown[][]
}

/**
 * Subscribe to Supabase Realtime postgres_changes for a table,
 * and invalidate the given React Query keys on every event.
 */
export function useRealtimeInvalidation({ channel, table, filter, queryKeys }: Options) {
  const queryClient = useQueryClient()
  const queryKeysRef = useRef(queryKeys)
  queryKeysRef.current = queryKeys

  useEffect(() => {
    const supabase = createClient()

    const sub = supabase
      .channel(channel)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table, filter },
        () => {
          for (const key of queryKeysRef.current) {
            queryClient.invalidateQueries({ queryKey: key })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(sub)
    }
  }, [channel, table, filter, queryClient])
}
