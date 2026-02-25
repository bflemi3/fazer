'use client'

import { memo } from 'react'
import { useTranslations } from 'next-intl'
import {
  ResponsiveModal,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
  ResponsiveModalBody,
} from '@/components/ui/responsive-modal'
import { FeedbackForm } from './feedback-form'

type FeedbackType = 'bug' | 'feature' | 'general'

type Props = {
  open: boolean
  onClose: () => void
  defaultType?: FeedbackType
}

export const FeedbackModal = memo(function FeedbackModal({ open, onClose, defaultType }: Props) {
  const t = useTranslations('feedback')

  return (
    <ResponsiveModal open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <ResponsiveModalHeader>
        <ResponsiveModalTitle>{t('title')}</ResponsiveModalTitle>
        <ResponsiveModalDescription>{t('description')}</ResponsiveModalDescription>
      </ResponsiveModalHeader>

      <ResponsiveModalBody>
        <FeedbackForm defaultType={defaultType} onClose={onClose} />
      </ResponsiveModalBody>
    </ResponsiveModal>
  )
})
