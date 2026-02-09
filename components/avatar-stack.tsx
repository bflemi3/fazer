'use client'

import { AvatarGroup, AvatarGroupCount } from '@/components/ui/avatar'
import { UserAvatar } from './user-avatar'
import type { ListMember } from '@/lib/hooks/use-collaborators'

type Props = {
  members: ListMember[]
  maxVisible?: number
  onClick?: () => void
}

export function AvatarStack({ members, maxVisible = 3, onClick }: Props) {
  const visible = members.slice(0, maxVisible)
  const overflow = members.length - maxVisible

  return (
    <button onClick={onClick} className="inline-flex cursor-pointer">
      <AvatarGroup>
        {visible.map((member) => (
          <UserAvatar
            key={member.id}
            displayName={member.display_name}
            avatarUrl={member.avatar_url}
            size="sm"
          />
        ))}
        {overflow > 0 && (
          <AvatarGroupCount>
            +{overflow}
          </AvatarGroupCount>
        )}
      </AvatarGroup>
    </button>
  )
}
