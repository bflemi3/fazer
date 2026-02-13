'use client'

import { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react'
import { useRouter } from 'next/navigation'
import { useLongPress } from '@/lib/hooks/use-long-press'
import { useTranslations } from 'next-intl'
import { formatDistanceToNow } from 'date-fns'
import { MoreHorizontal, Trash2, Share2, Pencil } from 'lucide-react'
import { useDeleteList, useRenameList, useSuspenseLists } from '@/lib/hooks/use-lists'
import { useProfile } from '@/lib/hooks/use-profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ListCard } from '@/components/ui/list-card'
import { ShareModal } from './share-modal'
import type { List } from '@/lib/hooks/use-lists'

type Props = {
  listId: string
}

export const ListItem = memo(function ListItem({ listId }: Props) {
  const t = useTranslations()
  const router = useRouter()
  const deleteList = useDeleteList()
  const renameList = useRenameList()
  const { profile } = useProfile()

  const selectList = useMemo(
    () => (lists: List[]) => lists.find(l => l.id === listId),
    [listId]
  )
  const { data: list } = useSuspenseLists({ select: selectList })

  const listName = list?.name ?? ''
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(listName)
  const [showShareModal, setShowShareModal] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const longPress = useLongPress(
    useCallback(() => setIsEditing(true), []),
  )

  useEffect(() => {
    router.prefetch(`/l/${listId}`)
  }, [router, listId])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  useEffect(() => {
    if (!isEditing) {
      setEditName(listName)
    }
  }, [listName, isEditing])

  if (!list) return null

  // Narrowed binding — `list` is guaranteed defined after the guard above,
  // but TS can't narrow across nested function declarations.
  const l = list!

  const isOwner = profile?.id === l.owner_id

  function handleClick() {
    if (isEditing || longPress.shouldSuppress()) return
    router.push(`/l/${listId}`)
  }

  async function handleSave() {
    const trimmed = editName.trim()
    if (!trimmed || trimmed === l.name) {
      setEditName(l.name)
      setIsEditing(false)
      return
    }
    await renameList.mutateAsync({ id: listId, name: trimmed })
    setIsEditing(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      setEditName(l.name)
      setIsEditing(false)
    }
  }

  async function handleDelete() {
    await deleteList.mutateAsync(listId)
    setShowDeleteDialog(false)
  }

  return (
    <>
      <ListCard onClick={handleClick} {...longPress.handlers} className="group flex cursor-pointer items-center justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {isEditing ? (
            <Input
              ref={inputRef}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
              className="h-auto flex-1 border-0 bg-transparent px-0 py-0 text-lg font-medium shadow-none"
            />
          ) : (
            <div className="min-w-0 flex-1 text-left">
              <span className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
                {l.name}
              </span>
              <span className="block text-sm text-zinc-500 dark:text-zinc-400">
                {t('lists.created', { time: formatDistanceToNow(new Date(l.created_at), { addSuffix: true }) })}
              </span>
            </div>
          )}
        </div>

        <div onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="sm:opacity-0 sm:group-hover:opacity-100"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onCloseAutoFocus={(e) => e.preventDefault()}>
              <DropdownMenuItem onClick={() => setIsEditing(true)}>
                <Pencil className="h-4 w-4" />
                {t('common.rename')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowShareModal(true)}>
                <Share2 className="h-4 w-4" />
                {t('common.share')}
              </DropdownMenuItem>
              {isOwner && (
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                >
                  <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                  {t('common.delete')}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </ListCard>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('lists.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('lists.deleteDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ShareModal
        listId={listId}
        shareToken={l.share_token}
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
    </>
  )
})
