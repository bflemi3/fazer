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

  // Fetch list by share_token
  const { data: list } = await supabase
    .from('lists')
    .select('*')
    .eq('share_token', token)
    .single()

  if (!list) {
    return <ShareNotFound />
  }

  // Check if the user is authenticated
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect(`/l/${list.id}`)
  }

  // Fetch owner profile (anon can read profiles via RLS policy)
  const { data: ownerData, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', list.owner_id)
    .single()

  console.log('[share] owner_id:', list.owner_id, 'profile:', ownerData, 'error:', profileError)

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
