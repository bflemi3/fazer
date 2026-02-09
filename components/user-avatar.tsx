'use client'

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

type Props = {
  displayName: string | null
  avatarUrl: string | null
  size?: 'sm' | 'default' | 'lg'
  className?: string
}

function getInitials(name: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name[0].toUpperCase()
}

export function UserAvatar({ displayName, avatarUrl, size = 'default', className }: Props) {
  return (
    <Avatar size={size} className={className}>
      {avatarUrl && (
        <AvatarImage src={avatarUrl} alt={displayName || ''} />
      )}
      <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
    </Avatar>
  )
}
