'use client'

import { useMutation } from '@tanstack/react-query'
import { getFeedbackContext } from '@/lib/feedback-context'

type FeedbackInput = {
  type: 'bug' | 'feature' | 'general'
  message: string
  screenshot?: File | null
}

async function submitFeedback({ type, message, screenshot }: FeedbackInput) {
  const ctx = getFeedbackContext()

  const formData = new FormData()
  formData.append('type', type)
  formData.append('message', message)
  formData.append('route', ctx.route)
  formData.append('appVersion', ctx.appVersion)
  formData.append('viewport', ctx.viewport)
  formData.append('browser', ctx.browser)
  formData.append('isOnline', String(ctx.isOnline))

  if (screenshot) {
    formData.append('screenshot', screenshot)
  }

  const res = await fetch('/api/feedback', {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || `HTTP ${res.status}`)
  }

  return res.json()
}

export function useFeedbackSubmit() {
  return useMutation({
    mutationFn: submitFeedback,
  })
}
