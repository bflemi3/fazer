'use client'

import { useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Download } from 'lucide-react'
import { useInstallPrompt } from '@/lib/hooks/use-install-prompt'
import type { IOSBrowser } from '@/lib/hooks/use-install-prompt'

const DISMISS_COUNT_KEY = 'fazer-install-dismiss-count'
const MAX_DISMISSALS = 3

function getDismissCount(): number {
  try {
    return Number(localStorage.getItem(DISMISS_COUNT_KEY)) || 0
  } catch {
    return 0
  }
}

function incrementDismissCount(): void {
  try {
    localStorage.setItem(DISMISS_COUNT_KEY, String(getDismissCount() + 1))
  } catch {
    // localStorage unavailable
  }
}

const iosDescriptionKey: Record<IOSBrowser, string> = {
  safari: 'install.iosSafariDescription',
  chrome: 'install.iosChromeDescription',
  other: 'install.iosOtherDescription',
}

export function InstallPrompt() {
  const t = useTranslations()
  const { canPrompt, iosBrowser, isInstalled, promptInstall } = useInstallPrompt()
  const toastIdRef = useRef<string | number | undefined>(undefined)

  useEffect(() => {
    // Dismiss any existing toast when installed or when deps change (e.g. locale switch)
    if (toastIdRef.current !== undefined) {
      toast.dismiss(toastIdRef.current)
      toastIdRef.current = undefined
    }

    if (isInstalled) return
    if (!canPrompt && !iosBrowser) return
    if (getDismissCount() >= MAX_DISMISSALS) return

    if (canPrompt) {
      toastIdRef.current = toast(t('install.title'), {
        icon: <Download className="h-4 w-4" />,
        description: t('install.description'),
        duration: Infinity,
        action: {
          label: t('install.install'),
          onClick: () => {
            promptInstall()
            toastIdRef.current = undefined
          },
        },
        onDismiss: () => {
          incrementDismissCount()
          toastIdRef.current = undefined
        },
      })
    } else if (iosBrowser) {
      toastIdRef.current = toast(t('install.title'), {
        icon: <Download className="h-4 w-4" />,
        description: t(iosDescriptionKey[iosBrowser]),
        duration: Infinity,
        onDismiss: () => {
          incrementDismissCount()
          toastIdRef.current = undefined
        },
      })
    }
  }, [canPrompt, iosBrowser, isInstalled, promptInstall, t])

  return null
}
