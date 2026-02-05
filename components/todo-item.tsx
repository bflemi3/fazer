'use client'

import { useTranslations } from 'next-intl'
import { Trash2, MoreHorizontal } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useToggleTodo, useDeleteTodo, useUpdateTodo } from '@/lib/hooks/use-todos'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import type { Todo } from '@/lib/hooks/use-todos'

type Props = {
  todo: Todo
  listId: string
}

export function TodoItem({ todo, listId }: Props) {
  const t = useTranslations()
  const toggleTodo = useToggleTodo(listId)
  const deleteTodo = useDeleteTodo(listId)
  const updateTodo = useUpdateTodo(listId)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(todo.title)
  const inputRef = useRef<HTMLInputElement>(null)
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  // Reset edit title when todo changes externally
  useEffect(() => {
    if (!isEditing) {
      setEditTitle(todo.title)
    }
  }, [todo.title, isEditing])

  function handleClick() {
    if (isEditing) return

    if (clickTimeoutRef.current) {
      // Second click within timeout = double click
      clearTimeout(clickTimeoutRef.current)
      clickTimeoutRef.current = null
      setIsEditing(true)
    } else {
      // First click - wait to see if it's a double click
      clickTimeoutRef.current = setTimeout(() => {
        clickTimeoutRef.current = null
        toggleTodo.mutateAsync({ id: todo.id, isComplete: !todo.is_complete })
      }, 250)
    }
  }

  async function handleSave() {
    const trimmedTitle = editTitle.trim()
    if (!trimmedTitle || trimmedTitle === todo.title) {
      setEditTitle(todo.title)
      setIsEditing(false)
      return
    }
    await updateTodo.mutateAsync({ id: todo.id, title: trimmedTitle })
    setIsEditing(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      setEditTitle(todo.title)
      setIsEditing(false)
    }
  }

  async function handleDelete() {
    await deleteTodo.mutateAsync(todo.id)
    setShowDeleteDialog(false)
  }

  return (
    <>
      <div
        onClick={handleClick}
        className="group flex cursor-pointer items-center gap-3 rounded-lg border border-zinc-200 bg-white p-4 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
      >
        <Checkbox
          checked={todo.is_complete}
          onCheckedChange={() => toggleTodo.mutateAsync({ id: todo.id, isComplete: !todo.is_complete })}
          onClick={(e) => e.stopPropagation()}
        />
        {isEditing ? (
          <Input
            ref={inputRef}
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            className="h-auto flex-1 py-0 text-base"
          />
        ) : (
          <span
            className={`flex-1 ${
              todo.is_complete
                ? 'text-zinc-400 line-through dark:text-zinc-500'
                : 'text-zinc-900 dark:text-zinc-50'
            }`}
          >
            {todo.title}
          </span>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="sm:opacity-0 sm:group-hover:opacity-100"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
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
            <AlertDialogTitle>{t('todos.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('todos.deleteDescription')}
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
    </>
  )
}
