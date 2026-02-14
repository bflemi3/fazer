'use client'

import { memo } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { ListItem } from './list-item'

type Props = {
  listId: string
  disabled: boolean
}

export const SortableListItem = memo(function SortableListItem({
  listId,
  disabled,
}: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: listId, disabled })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2"
    >
      {!disabled && (
        <button
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          className="flex shrink-0 cursor-grab items-center justify-center text-zinc-400 hover:text-zinc-600 active:cursor-grabbing dark:text-zinc-500 dark:hover:text-zinc-300"
          style={{ touchAction: 'none' }}
          tabIndex={0}
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-5 w-5" />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <ListItem listId={listId} />
      </div>
    </div>
  )
})

export function DragOverlayContent({ listId }: { listId: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex shrink-0 cursor-grabbing items-center justify-center text-zinc-400 dark:text-zinc-500">
        <GripVertical className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <ListItem listId={listId} />
      </div>
    </div>
  )
}
