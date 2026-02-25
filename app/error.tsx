'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import posthog from 'posthog-js'
import { Button } from '@/components/ui/button'
import { FeedbackModal } from '@/components/feedback-modal'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations()
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const handleOpenFeedback = useCallback(() => setFeedbackOpen(true), [])
  const handleCloseFeedback = useCallback(() => setFeedbackOpen(false), [])

  useEffect(() => {
    posthog.capture('$exception', {
      $exception_message: error.message,
      $exception_source: 'error_boundary',
    })
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-sm text-center">
        <Image
          src="/icons/icon-192x192.png"
          alt="Fazer"
          width={64}
          height={64}
          className="mx-auto rounded-2xl"
        />
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Fazer
        </h1>
        <p className="mt-4 text-base text-zinc-600 dark:text-zinc-400">
          {t('error.description')}
        </p>
        <div className="mt-6 flex flex-col items-center gap-2">
          <Button variant="outline" onClick={reset}>
            {t('common.tryAgain')}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleOpenFeedback}>
            {t('feedback.reportThis')}
          </Button>
        </div>
      </div>

      <FeedbackModal
        open={feedbackOpen}
        onClose={handleCloseFeedback}
        defaultType="bug"
      />
    </div>
  )
}
