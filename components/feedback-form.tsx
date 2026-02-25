'use client'

import { useState, useCallback, memo } from 'react'
import { useTranslations } from 'next-intl'
import { Bug, Lightbulb, MessageCircle, Camera, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useFeedbackSubmit } from '@/lib/hooks/use-feedback-submit'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

type FeedbackType = 'bug' | 'feature' | 'general'

type Props = {
  defaultType?: FeedbackType
  onClose: () => void
}

const typeConfig = [
  { value: 'bug' as const, icon: Bug },
  { value: 'feature' as const, icon: Lightbulb },
  { value: 'general' as const, icon: MessageCircle },
]

async function capturePageScreenshot(): Promise<File> {
  const { toBlob } = await import('html-to-image')

  const blob = await toBlob(document.documentElement, {
    filter: (node: Node) => {
      if (node instanceof Element) {
        const slot = node.getAttribute('data-slot')
        if (slot === 'dialog-overlay' || slot === 'dialog-content') return false
        if (slot === 'drawer-overlay' || slot === 'drawer-content') return false
      }
      return true
    },
  })

  if (!blob) throw new Error('Failed to capture screenshot')
  return new File([blob], 'screenshot.png', { type: 'image/png' })
}

export const FeedbackForm = memo(function FeedbackForm({ defaultType, onClose }: Props) {
  const t = useTranslations('feedback')
  const submit = useFeedbackSubmit()

  const [type, setType] = useState<FeedbackType>(defaultType ?? 'general')
  const [message, setMessage] = useState('')
  const [includeScreenshot, setIncludeScreenshot] = useState(false)

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    try {
      let screenshot: File | null = null

      if (includeScreenshot) {
        try {
          screenshot = await capturePageScreenshot()
        } catch {
          toast.error(t('screenshotCaptureFailed'))
          return
        }
      }

      await submit.mutateAsync({ type, message: message.trim(), screenshot })
      toast.success(t('submitSuccess'))
      onClose()
    } catch (error) {
      if (error instanceof Error && error.message === 'Too many requests') {
        toast.error(t('rateLimited'))
      } else {
        toast.error(t('submitError'))
      }
    }
  }, [type, message, includeScreenshot, submit, onClose, t])

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type picker */}
      <div className="flex gap-2">
        {typeConfig.map(({ value, icon: Icon }) => (
          <Button
            key={value}
            type="button"
            variant={type === value ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => setType(value)}
          >
            <Icon className="h-4 w-4" />
            {t(`type.${value}`)}
          </Button>
        ))}
      </div>

      {/* Message */}
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={t('messagePlaceholder')}
        rows={4}
        className="resize-none"
      />

      {/* Screenshot toggle */}
      <label className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Camera className="h-4 w-4" />
          {t('includeScreenshot')}
        </div>
        <Switch
          checked={includeScreenshot}
          onCheckedChange={setIncludeScreenshot}
        />
      </label>

      {/* Submit */}
      <Button
        type="submit"
        className="w-full"
        disabled={!message.trim() || submit.isPending}
      >
        {submit.isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('submitting')}
          </>
        ) : (
          t('submit')
        )}
      </Button>
    </form>
  )
})
