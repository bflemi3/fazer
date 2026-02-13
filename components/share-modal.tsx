'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Check, Copy, X } from 'lucide-react'
import { useCollaborators, useRemoveCollaborator } from '@/lib/hooks/use-collaborators'
import { useProfile } from '@/lib/hooks/use-profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { UserAvatar } from './user-avatar'

type Props = {
  listId: string
  shareToken: string
  open: boolean
  onClose: () => void
}

export function ShareModal({ listId, shareToken, open, onClose }: Props) {
  const t = useTranslations('share')
  const { profile } = useProfile()
  const currentUserId = profile?.id
  const { data: members } = useCollaborators(listId)
  const removeCollaborator = useRemoveCollaborator(listId)
  const [copied, setCopied] = useState(false)

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/s/${shareToken}`
    : ''

  const isOwner = members?.some((m) => m.id === currentUserId && m.role === 'owner') ?? false

  async function handleCopy() {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Share link */}
          <div className="flex gap-2">
            <Input
              readOnly
              value={shareUrl}
              className="flex-1"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopy}
              className="shrink-0"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* People with access */}
          {members && members.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {t('peopleWithAccess')}
              </h3>
              <div className="space-y-2">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <UserAvatar
                      displayName={member.display_name}
                      avatarUrl={member.avatar_url}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                        {member.display_name || member.email}
                        {member.id === currentUserId && (
                          <span className="ml-1 font-normal text-zinc-500 dark:text-zinc-400">
                            ({t('you')})
                          </span>
                        )}
                      </p>
                      {member.role === 'owner' && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {t('owner')}
                        </p>
                      )}
                    </div>
                    {isOwner && member.role === 'collaborator' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-zinc-400 hover:text-red-600 dark:text-zinc-500 dark:hover:text-red-400"
                        onClick={() => removeCollaborator.mutate({ listId, userId: member.id })}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
