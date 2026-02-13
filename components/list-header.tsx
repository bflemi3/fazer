'use client'

import { Suspense, useState, useRef, useEffect, useCallback, memo } from 'react'
import Link from 'next/link'
import { ArrowLeft, MoreHorizontal, Trash2, Share2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useSuspenseList, useRenameList, useDeleteList } from '@/lib/hooks/use-lists'
import { useSuspenseCollaborators } from '@/lib/hooks/use-collaborators'
import { useProfile } from '@/lib/hooks/use-profile'
import { useRealtimeInvalidation } from '@/lib/hooks/use-realtime-invalidation'
import { useLongPress } from '@/lib/hooks/use-long-press'
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
import { AvatarStack } from './avatar-stack'
import { Skeleton } from '@/components/ui/skeleton'
import { ShareModal } from './share-modal'

// --- Selectors ---

const selectName = (list: { name: string }) => list.name
const selectOwnerId = (list: { owner_id: string }) => list.owner_id
const selectShareToken = (list: { share_token: string }) => list.share_token

function ListMembersSkeleton() {
  return (
    <div className="mt-3 flex -space-x-2">
      <Skeleton className="size-6 rounded-full" />
      <Skeleton className="size-6 rounded-full" />
      <Skeleton className="size-6 rounded-full" />
    </div>
  )
}

// --- ListTitle ---
// Owns rename state, long-press, input, and realtime name sync.
// Keystroke re-renders stay inside this component.

const ListTitle = memo(function ListTitle({ listId }: { listId: string }) {
  const { data: liveName } = useSuspenseList(listId, { select: selectName })

  useRealtimeInvalidation({
    channel: `list:${listId}`,
    table: 'lists',
    filter: `id=eq.${listId}`,
    queryKeys: [['lists', listId]],
  })

  const renameList = useRenameList()

  const [isEditingName, setIsEditingName] = useState(false)
  const [listName, setListName] = useState(liveName)
  const nameInputRef = useRef<HTMLInputElement>(null)

  const nameLongPress = useLongPress(
    useCallback(() => setIsEditingName(true), []),
  )

  // Sync local list name when query data updates (e.g. from realtime)
  useEffect(() => {
    if (!isEditingName) {
      setListName(liveName)
    }
  }, [liveName, isEditingName])

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus()
      nameInputRef.current.select()
    }
  }, [isEditingName])

  async function handleSaveName() {
    if (!listName.trim() || listName.trim() === liveName) {
      setListName(liveName)
      setIsEditingName(false)
      return
    }
    await renameList.mutateAsync({ id: listId, name: listName.trim() })
    setIsEditingName(false)
  }

  function handleNameKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSaveName()
    } else if (e.key === 'Escape') {
      setListName(liveName)
      setIsEditingName(false)
    }
  }

  if (isEditingName) {
    return (
      <Input
        ref={nameInputRef}
        value={listName}
        onChange={(e) => setListName(e.target.value)}
        onBlur={handleSaveName}
        onKeyDown={handleNameKeyDown}
        className="h-auto flex-1 py-1 text-2xl md:text-2xl font-semibold tracking-tight"
      />
    )
  }

  return (
    <h1
      {...nameLongPress.handlers}
      className="min-w-0 cursor-pointer text-2xl font-semibold tracking-tight text-zinc-900 hover:text-zinc-600 dark:text-zinc-50 dark:hover:text-zinc-300"
    >
      {listName}
    </h1>
  )
})

// --- ListActions ---
// Owns delete dialog state, profile check for isOwner, and delete mutation.

const ListActions = memo(function ListActions({ listId, onShowShareModal }: { listId: string; onShowShareModal: () => void }) {
  const { data: ownerId } = useSuspenseList(listId, { select: selectOwnerId })
  const { profile } = useProfile()
  const isOwner = profile?.id === ownerId

  const router = useRouter()
  const t = useTranslations()
  const deleteList = useDeleteList()

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  async function handleDeleteList() {
    await deleteList.mutateAsync(listId)
    router.push('/')
  }

  return (
    <>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          className="hidden sm:inline-flex"
          onClick={onShowShareModal}
        >
          <Share2 className="h-4 w-4" />
          {t('common.share')}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="sm:hidden"
          onClick={onShowShareModal}
        >
          <Share2 className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onShowShareModal}>
              <Share2 className="h-4 w-4" />
              {t('common.share')}
            </DropdownMenuItem>
            {isOwner && (
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
              >
                <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                {t('lists.deleteList')}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

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
              onClick={handleDeleteList}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
})

// --- ListMembers ---
// Owns collaborator data and realtime invalidation.

const ListMembers = memo(function ListMembers({ listId, onShowShareModal }: { listId: string; onShowShareModal: () => void }) {
  const { data: members } = useSuspenseCollaborators(listId)

  useRealtimeInvalidation({
    channel: `collaborators:${listId}`,
    table: 'lists',
    filter: `id=eq.${listId}`,
    queryKeys: [['collaborators', listId]],
  })

  if (members.length === 0) return null

  return (
    <div className="mt-3">
      <AvatarStack
        members={members}
        onClick={onShowShareModal}
      />
    </div>
  )
})

// --- ListHeader (thin orchestrator) ---
// Owns only showShareModal state — the one piece shared between actions and avatar stack.
// No data hooks. Just layout + coordination.

export const ListHeader = memo(function ListHeader({ listId }: { listId: string }) {
  const { data: shareToken } = useSuspenseList(listId, { select: selectShareToken })
  const t = useTranslations()
  const [showShareModal, setShowShareModal] = useState(false)
  const handleShowShareModal = useCallback(() => setShowShareModal(true), [])

  return (
    <>
      <div className="mb-8">
        <div className="flex min-h-9 items-center">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2"
            asChild
          >
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              {t('lists.title')}
            </Link>
          </Button>
        </div>
        <div className="mt-4 flex items-start justify-between gap-4">
          <ListTitle listId={listId} />
          <ListActions listId={listId} onShowShareModal={handleShowShareModal} />
        </div>

        <Suspense fallback={<ListMembersSkeleton />}>
          <ListMembers listId={listId} onShowShareModal={handleShowShareModal} />
        </Suspense>
      </div>

      <ShareModal
        listId={listId}
        shareToken={shareToken}
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
    </>
  )
})
