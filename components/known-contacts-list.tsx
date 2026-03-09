'use client'

import { memo } from 'react'
import posthog from 'posthog-js'
import { useTranslations } from 'next-intl'
import { Plus } from 'lucide-react'
import { useList } from '@/lib/hooks/use-lists'
import { useProfile } from '@/lib/hooks/use-profile'
import { useKnownContacts } from '@/lib/hooks/use-known-contacts'
import { useAddCollaborator } from '@/lib/hooks/use-collaborators'
import { UserAvatar } from './user-avatar'

const selectName = (list: { name: string }) => list.name

type Props = {
  listId: string
  existingMemberIds: string[]
}

export const KnownContactsList = memo(function KnownContactsList({ listId, existingMemberIds }: Props) {
  const t = useTranslations('share')
  const { profile } = useProfile()
  const userId = profile?.id ?? ''
  const { data: listName } = useList(listId, { select: selectName })
  const { data: allContacts } = useKnownContacts(userId)
  const addCollaborator = useAddCollaborator(listId, userId)

  const contacts = allContacts?.filter((c) => !existingMemberIds.includes(c.id)) ?? []

  const handleAdd = (contactId: string) => 
    addCollaborator.mutate({ listId, userId: contactId }, {
      onSuccess: () => {
        posthog.capture('list_shared', { list_id: listId, list_name: listName, method: 'direct' })
      },
    })

  if (!contacts.length) return null

  return (
    <div>
      <h3 className="mb-3 text-base sm:text-sm font-medium text-zinc-900 dark:text-zinc-50">
        {t('shareWithPeople')}
      </h3>
      <div className="space-y-3 max-h-48 overflow-y-auto">
        {contacts.map((contact) => (
          <div
            key={contact.id}
            role="button"
            tabIndex={0}
            onClick={() => !addCollaborator.isPending && handleAdd(contact.id)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(contact.id) }}
            className="flex items-center gap-3 cursor-pointer rounded-lg hover:bg-accent active:scale-[0.98] transition-colors disabled:opacity-50"
            aria-disabled={addCollaborator.isPending}
          >
            <UserAvatar
              displayName={contact.display_name}
              avatarUrl={contact.avatar_url}
            />
            <span className="min-w-0 flex-1 truncate text-base sm:text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {contact.display_name || contact.email}
            </span>
            <Plus className="size-5 sm:size-4 shrink-0 text-muted-foreground" />
          </div>
        ))}
      </div>
    </div>
  )
})
