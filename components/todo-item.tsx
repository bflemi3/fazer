'use client'

import { X } from 'lucide-react'
import { useState, useRef, useEffect, useCallback, memo } from 'react'
import { useTranslations } from 'next-intl'
import { useToggleTodo, useDeleteTodo, useUpdateTodo } from '@/lib/hooks/use-todos'
import { useLongPress } from '@/lib/hooks/use-long-press'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { ListCard } from '@/components/ui/list-card'
import type { Todo } from '@/lib/hooks/use-todos'

type Props = {
  todo: Todo
  listId: string
}

export const TodoItem = memo(function TodoItem({ todo, listId }: Props) {
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
    toggleTodo.mutateAsync({ id: todo.id, isComplete: !todo.is_complete })
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
      className="group flex cursor-pointer items-center gap-3"
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

      <Button
        variant="ghost"
        size="icon"
        className="text-zinc-400 hover:text-red-600 dark:text-zinc-500 dark:hover:text-red-400 sm:opacity-0 sm:group-hover:opacity-100"
        onClick={(e) => {
          e.stopPropagation()
          deleteTodo.mutate(todo.id)
        }}
      >
        <X className="h-4 w-4" />
      </Button>
    </ListCard>
  )
})
