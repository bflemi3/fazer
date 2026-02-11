import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SharedListContent } from '@/components/shared-list-content'
import { ShareNotFound } from '@/components/share-not-found'

type Props = {
  params: Promise<{ token: string }>
}

export default async function SharedListPage({ params }: Props) {
  const { token } = await params
  const supabase = await createClient()

  // Check auth first — determines which path to take
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    // Authenticated: join via RPC (bypasses RLS chicken-and-egg problem)
    const { data: listId } = await supabase.rpc('join_list_via_share_token', {
      p_share_token: token,
    })

    if (!listId) {
      return <ShareNotFound />
    }

    redirect(`/l/${listId}`)
  }

  // Anonymous: fetch list by share_token (anon RLS policy allows SELECT)
  const { data: list } = await supabase
    .from('lists')
    .select('*')
    .eq('share_token', token)
    .single()

  if (!list) {
    return <ShareNotFound />
  }

  // Fetch owner profile (anon can read profiles via RLS policy)
  const { data: ownerData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', list.owner_id)
    .single()

  const firstName = ownerData?.display_name?.split(' ')[0] || ''
  const displayName = firstName || ownerData?.email || ''

  return (
    <SharedListContent
      list={list}
      ownerProfile={{
        id: ownerData?.id || list.owner_id,
        email: ownerData?.email || null,
        display_name: ownerData?.display_name || null,
        avatar_url: ownerData?.avatar_url || null,
        created_at: ownerData?.created_at || '',
        updated_at: ownerData?.updated_at || '',
        firstName,
        displayName,
      }}
      shareToken={token}
    />
  )
}
