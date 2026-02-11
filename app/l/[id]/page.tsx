import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ListContent } from '@/components/list-content'

type Props = {
  params: Promise<{ id: string }>
}

export default async function ListPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?next=/l/${id}`)
  }

  // Verify the user has access to this list (RLS enforces owner/collaborator)
  const { data: list } = await supabase
    .from('lists')
    .select('*')
    .eq('id', id)
    .single()

  if (!list) {
    redirect('/?toast=no-access')
  }

  return <ListContent list={list} />
}
