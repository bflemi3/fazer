'use client'

import { useState, useEffect, useCallback } from 'react'
import posthog from 'posthog-js'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export type IOSBrowser = 'safari' | 'chrome' | 'other'

function getIsStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

function detectIOSBrowser(): IOSBrowser | null {
  if (typeof navigator === 'undefined') return null
  const ua = navigator.userAgent
  const isiOS = /iPad|iPhone|iPod/.test(ua) && !('MSStream' in window)
  if (!isiOS) return null
  if (/CriOS/.test(ua)) return 'chrome'
  if (/Safari/.test(ua) && !/FxiOS|Chrome/.test(ua)) return 'safari'
  return 'other'
}

/** Detected once — userAgent and display-mode don't change within a session. */
const iosBrowser = detectIOSBrowser()

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(getIsStandalone)

  // Track standalone installs (covers iOS where no appinstalled event exists)
  useEffect(() => {
    if (!isInstalled) return
    try {
      const key = 'fazer-install-tracked'
      if (!localStorage.getItem(key)) {
        posthog.capture('app_installed', { method: 'standalone_detection' })
        localStorage.setItem(key, '1')
      }
    } catch {
      // localStorage unavailable
    }
  }, [isInstalled])

  // Listen for install events (Chromium today, possibly iOS in the future)
  useEffect(() => {
    function handleBeforeInstallPrompt(e: Event) {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    function handleAppInstalled() {
      setDeferredPrompt(null)
      setIsInstalled(true)
      posthog.capture('app_installed', { method: 'native_prompt' })
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setDeferredPrompt(null)
    }
  }, [deferredPrompt])

  return {
    canPrompt: deferredPrompt !== null,
    iosBrowser,
    isInstalled,
    promptInstall,
  }
}
