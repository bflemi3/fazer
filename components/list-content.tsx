'use client'

import { useState, useRef, useEffect } from 'react'
import { ArrowLeft, Plus, MoreHorizontal, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useTodos, useCreateTodo } from '@/lib/hooks/use-todos'
import { useRenameList, useDeleteList } from '@/lib/hooks/use-lists'
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
import { SettingsButton } from './settings-button'
import { CreateListModal } from './create-list-modal'
import { TodoItem } from './todo-item'
import type { Tables } from '@/supabase/database.types'

type Props = {
  list: Tables<'lists'>
}

export function ListContent({ list }: Props) {
  const router = useRouter()
  const t = useTranslations()
  const { data: todos, isLoading } = useTodos(list.id)
  const createTodo = useCreateTodo(list.id)
  const renameList = useRenameList()
  const deleteList = useDeleteList()

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newTodoTitle, setNewTodoTitle] = useState('')
  const [isEditingName, setIsEditingName] = useState(false)
  const [listName, setListName] = useState(list.name)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)

  const hasTodos = todos && todos.length > 0

  useEffect(() => {
    if (isCreating && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isCreating])

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus()
      nameInputRef.current.select()
    }
  }, [isEditingName])

  async function handleCreateTodo() {
    if (!newTodoTitle.trim()) return

    const nextPosition = todos ? todos.length : 0
    await createTodo.mutateAsync({
      listId: list.id,
      title: newTodoTitle.trim(),
      position: nextPosition,
    })
    setNewTodoTitle('')

    // Scroll input into view after new todo is rendered
    setTimeout(() => {
      inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 50)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleCreateTodo()
    } else if (e.key === 'Escape') {
      setIsCreating(false)
      setNewTodoTitle('')
    }
  }

  async function handleSaveName() {
    if (!listName.trim() || listName.trim() === list.name) {
      setListName(list.name)
      setIsEditingName(false)
      return
    }
    await renameList.mutateAsync({ id: list.id, name: listName.trim() })
    setIsEditingName(false)
  }

  function handleNameKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSaveName()
    } else if (e.key === 'Escape') {
      setListName(list.name)
      setIsEditingName(false)
    }
  }

  async function handleDeleteList() {
    await deleteList.mutateAsync(list.id)
    router.push('/')
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-100" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Top right buttons */}
      <div className="fixed right-4 top-4 z-50 flex gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsCreateModalOpen(true)}
          aria-label="Create new list"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <SettingsButton />
      </div>

      <CreateListModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <div className="px-4 pt-4 pb-8">
        {/* Header with back button */}
        <div className="mb-8">
          <div className="flex min-h-9 items-center">
            <Button
              variant="ghost"
              size="sm"
              className="-ml-2"
              onClick={() => router.push('/')}
            >
              <ArrowLeft className="h-4 w-4" />
              {t('lists.title')}
            </Button>
          </div>
          <div className="mt-4 flex items-start justify-between gap-2">
            {isEditingName ? (
              <Input
                ref={nameInputRef}
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                onBlur={handleSaveName}
                onKeyDown={handleNameKeyDown}
                className="h-auto flex-1 py-1 text-2xl md:text-2xl font-semibold tracking-tight"
              />
            ) : (
              <h1
                onClick={() => setIsEditingName(true)}
                className="cursor-pointer text-2xl font-semibold tracking-tight text-zinc-900 hover:text-zinc-600 dark:text-zinc-50 dark:hover:text-zinc-300"
              >
                {list.name}
              </h1>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400 [&>svg]:text-red-600 dark:[&>svg]:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                  {t('lists.deleteList')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Empty state */}
        {!hasTodos && !isCreating && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
              {t('todos.empty')}
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {t('todos.emptyDescription')}
            </p>
            <Button className="mt-6" onClick={() => setIsCreating(true)}>
              <Plus className="h-4 w-4" />
              {t('todos.newTodo')}
            </Button>
          </div>
        )}

        {/* Todo list */}
        {(hasTodos || isCreating) && (
          <div className="space-y-2">
            {todos?.map((todo) => (
              <TodoItem key={todo.id} todo={todo} listId={list.id} />
            ))}

            {/* Inline create input */}
            {isCreating && (
              <div className="space-y-2">
                <Input
                  ref={inputRef}
                  value={newTodoTitle}
                  onChange={(e) => setNewTodoTitle(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t('todos.newTodoPlaceholder')}
                  className="bg-white dark:bg-zinc-900"
                />
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {t('todos.createHint')}
                </p>
              </div>
            )}

            {/* Add button when not creating */}
            {!isCreating && (
              <Button
                variant="ghost"
                className="w-full justify-start text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                onClick={() => setIsCreating(true)}
              >
                <Plus className="h-4 w-4" />
                {t('todos.newTodo')}
              </Button>
            )}
          </div>
        )}
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
    </div>
  )
}
