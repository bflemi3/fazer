'use client'

import { X } from 'lucide-react'
import { useState, useRef, useEffect, useCallback, memo } from 'react'
import { useTranslations } from 'next-intl'
import { useToggleTodo, useDeleteTodo, useUpdateTodo } from '@/lib/hooks/use-todos'
import { useLongPress } from '@/lib/hooks/use-long-press'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { ListCard } from '@/components/ui/list-card'
import type { Todo } from '@/lib/hooks/use-todos'

type Props = {
  todo: Todo
  listId: string
  isJustAdded?: boolean
  isFading?: boolean
  onCompleted?: (todoId: string, todoTitle: string) => void
  onDeleted?: (todoId: string, todoTitle: string) => void
}

export const TodoItem = memo(function TodoItem({ todo, listId, isJustAdded, isFading, onCompleted, onDeleted }: Props) {
  const t = useTranslations()
  const toggleTodo = useToggleTodo(listId)
  const deleteTodo = useDeleteTodo(listId)
  const updateTodo = useUpdateTodo(listId)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(todo.title)
  const inputRef = useRef<HTMLInputElement>(null)

  const longPress = useLongPress(
    useCallback(() => setIsEditing(true), []),
  )

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
    if (isEditing || longPress.shouldSuppress()) return
    const shouldTrack = !todo.is_complete
    const { id, title } = todo
    toggleTodo.mutateAsync({ id, isComplete: !todo.is_complete }).then(() => {
      if (shouldTrack) onCompleted?.(id, title)
    })
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

  return (
    <ListCard
      onClick={handleClick}
      {...longPress.handlers}
      className={cn(
        'group flex cursor-pointer items-center gap-3',
        isJustAdded && 'border-dashed border-violet-400 dark:border-violet-500',
        isFading && 'animate-just-added-fade-border',
      )}
    >
      <Checkbox
        checked={todo.is_complete}
        onCheckedChange={() => {
          const shouldTrack = !todo.is_complete
          const { id, title } = todo
          toggleTodo.mutateAsync({ id, isComplete: !todo.is_complete }).then(() => {
            if (shouldTrack) onCompleted?.(id, title)
          })
        }}
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
          className="h-auto flex-1 border-0 bg-transparent px-0 py-0 text-lg shadow-none"
        />
      ) : (
        <span
          className={`flex-1 text-lg ${
            todo.is_complete
              ? 'text-zinc-400 line-through dark:text-zinc-500'
              : 'text-zinc-900 dark:text-zinc-50'
          }`}
        >
          {todo.title}
        </span>
      )}

      {isJustAdded && (
        <span className={cn(
          'shrink-0 rounded-md bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-600 dark:bg-violet-900/40 dark:text-violet-400',
          isFading && 'animate-just-added-fade-out',
        )}>
          {t('todos.justAdded')}
        </span>
      )}

      {!isJustAdded && (
        <Button
          variant="ghost"
          size="icon"
          className="text-zinc-400 hover:text-red-600 dark:text-zinc-500 dark:hover:text-red-400 sm:opacity-0 sm:group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation()
            const { id, title } = todo
            deleteTodo.mutate(id, {
              onSuccess: () => onDeleted?.(id, title),
            })
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </ListCard>
  )
})
