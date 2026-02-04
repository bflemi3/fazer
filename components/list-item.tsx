'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { formatDistanceToNow } from 'date-fns'
import { MoreHorizontal, Trash2, Share2, Pencil } from 'lucide-react'
import { useDeleteList, useRenameList } from '@/lib/hooks/use-lists'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { List } from '@/lib/hooks/use-lists'

type Props = {
  list: List
}

export function ListItem({ list }: Props) {
  const t = useTranslations()
  const router = useRouter()
  const deleteList = useDeleteList()
  const renameList = useRenameList()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showRenameDialog, setShowRenameDialog] = useState(false)
  const [newName, setNewName] = useState(list.name)

  async function handleDelete() {
    await deleteList.mutateAsync(list.id)
    setShowDeleteDialog(false)
  }

  async function handleRename(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim() || newName.trim() === list.name) {
      setShowRenameDialog(false)
      return
    }
    await renameList.mutateAsync({ id: list.id, name: newName.trim() })
    setShowRenameDialog(false)
  }

  return (
    <>
      <div className="group flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-4 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800">
        <button
          onClick={() => router.push(`/l/${list.id}`)}
          className="flex-1 text-left"
        >
          <span className="font-medium text-zinc-900 dark:text-zinc-50">
            {list.name}
          </span>
          <span className="block text-xs text-zinc-500 dark:text-zinc-400">
            {t('lists.created', { time: formatDistanceToNow(new Date(list.created_at), { addSuffix: true }) })}
          </span>
        </button>

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
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setShowRenameDialog(true)}>
              <Pencil className="h-4 w-4" />
              {t('common.rename')}
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              <Share2 className="h-4 w-4" />
              {t('common.share')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setShowDeleteDialog(true)}
              className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
            >
              <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
              {t('common.delete')}
            </DropdownMenuItem>
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
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('lists.renameTitle')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRename} className="space-y-4">
            <Input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t('lists.newListPlaceholder')}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowRenameDialog(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={!newName.trim() || renameList.isPending}>
                {t('common.save')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
