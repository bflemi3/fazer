'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { TodoItem } from './todo-item'
import type { Todo } from '@/lib/hooks/use-todos'

type Props = {
  todo: Todo
  listId: string
}

export function SortableTodoItem({ todo, listId }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`touch-none rounded-lg ${isDragging ? 'opacity-0' : ''}`}
    >
      <TodoItem todo={todo} listId={listId} />
    </div>
  )
}
