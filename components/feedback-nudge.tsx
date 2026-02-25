'use client'

import { useEffect, memo } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { useProfile } from '@/lib/hooks/use-profile'

const SESSION_COUNT_KEY = 'fazer-session-count'
const NUDGE_DISMISSED_KEY = 'fazer-feedback-nudge-dismissed'
const NUDGE_THRESHOLD = 5

type Props = {
  onOpenFeedback: () => void
}

export const FeedbackNudge = memo(function FeedbackNudge({ onOpenFeedback }: Props) {
  const t = useTranslations('feedback')
  const { profile } = useProfile()

  useEffect(() => {
    if (!profile) return

    // Check if already dismissed
    if (localStorage.getItem(NUDGE_DISMISSED_KEY)) return

    // Increment session count
    const count = parseInt(localStorage.getItem(SESSION_COUNT_KEY) || '0', 10) + 1
    localStorage.setItem(SESSION_COUNT_KEY, String(count))

    if (count < NUDGE_THRESHOLD) return

    // Show the nudge toast after a short delay
    const timer = setTimeout(() => {
      toast(t('nudgeMessage'), {
        action: {
          label: t('nudgeAction'),
          onClick: () => {
            localStorage.setItem(NUDGE_DISMISSED_KEY, '1')
            onOpenFeedback()
          },
        },
        onDismiss: () => {
          localStorage.setItem(NUDGE_DISMISSED_KEY, '1')
        },
        duration: 10000,
      })
    }, 2000)

    return () => clearTimeout(timer)
  }, [profile, t, onOpenFeedback])

  return null
})
