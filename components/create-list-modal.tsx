'use client'

import { useState, memo } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useCreateList, useLists } from '@/lib/hooks/use-lists'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Props = {
  open: boolean
  onClose: () => void
}

export const CreateListModal = memo(function CreateListModal({ open, onClose }: Props) {
  const t = useTranslations()
  const router = useRouter()
  const createList = useCreateList()
  const { data: lists } = useLists()
  const [name, setName] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    const position = lists ? lists.length : 0
    const newList = await createList.mutateAsync({ name: name.trim(), position })
    setName('')
    onClose()
    router.push(`/l/${newList.id}`)
  }

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      setName('')
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('lists.newList')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('lists.newListPlaceholder')}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={!name.trim() || createList.isPending}>
              {t('common.create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
})
