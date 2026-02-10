'use client'

import { useState } from 'react'
import { Download, Share, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { useInstallPrompt } from '@/lib/hooks/use-install-prompt'

const STORAGE_KEY = 'fazer-install-dismissed'

export function InstallPrompt() {
  const t = useTranslations()
  const { canPrompt, isIOS, isInstalled, promptInstall } = useInstallPrompt()

  const [dismissed, setDismissed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEY) === 'true'
    }
    return false
  })

  if (isInstalled || dismissed) return null
  if (!canPrompt && !isIOS) return null

  function dismiss() {
    setDismissed(true)
    localStorage.setItem(STORAGE_KEY, 'true')
  }

  return (
    <div className="mb-4 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-primary dark:border-primary/20 dark:bg-primary/10 dark:text-primary">
      {isIOS ? (
        <Share className="h-4 w-4 shrink-0" />
      ) : (
        <Download className="h-4 w-4 shrink-0" />
      )}
      <span className="flex-1">
        {isIOS ? t('install.iosDescription') : t('install.description')}
      </span>
      {canPrompt && (
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 text-primary hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20"
          onClick={promptInstall}
        >
          {t('install.install')}
        </Button>
      )}
      <button
        onClick={dismiss}
        className="shrink-0 rounded p-0.5 hover:bg-primary/10 dark:hover:bg-primary/20"
        aria-label={t('install.dismiss')}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
