'use client'

import { useState, memo } from 'react'
import { useRouter } from 'next/navigation'
import posthog from 'posthog-js'
import { useTranslations } from 'next-intl'
import { useCreateList, useLists } from '@/lib/hooks/use-lists'
import {
  ResponsiveModal,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalBody,
} from '@/components/ui/responsive-modal'
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
    const isFirstList = !lists || lists.length === 0
    const newList = await createList.mutateAsync({ name: name.trim(), position })
    posthog.capture('list_created', { list_id: newList.id, list_name: newList.name, is_first_list: isFirstList })
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
    <ResponsiveModal open={open} onOpenChange={handleOpenChange}>
      <ResponsiveModalHeader>
        <ResponsiveModalTitle>{t('lists.newList')}</ResponsiveModalTitle>
      </ResponsiveModalHeader>

      <ResponsiveModalBody>
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
      </ResponsiveModalBody>
    </ResponsiveModal>
  )
})
