'use client'

import { useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useProfile } from '@/lib/hooks/use-profile'
import { FeedbackModal } from './feedback-modal'
import { FeedbackNudge } from './feedback-nudge'

export function Footer() {
  const t = useTranslations('feedback')
  const { profile } = useProfile()
  const [feedbackOpen, setFeedbackOpen] = useState(false)

  const handleOpenFeedback = useCallback(() => setFeedbackOpen(true), [])
  const handleCloseFeedback = useCallback(() => setFeedbackOpen(false), [])

  // Only show for authenticated users
  if (!profile) return null

  return (
    <>
      <div className="fixed bottom-0 inset-x-0 z-40 bg-background/80 backdrop-blur-sm border-t border-border safe-area-pb">
        <button
          type="button"
          onClick={handleOpenFeedback}
          className="w-full px-4 py-3 text-center text-sm text-muted-foreground hover:text-foreground transition-colors active:scale-[0.98]"
        >
          {t('footerCta')}
        </button>
      </div>

      <FeedbackModal open={feedbackOpen} onClose={handleCloseFeedback} />
      <FeedbackNudge onOpenFeedback={handleOpenFeedback} />
    </>
  )
}
