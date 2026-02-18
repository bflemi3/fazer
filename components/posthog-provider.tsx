'use client'

import { useEffect, useRef } from 'react'
import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useProfile } from '@/lib/hooks/use-profile'

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'

function PostHogInit() {
  const initRef = useRef(false)

  useEffect(() => {
    if (!POSTHOG_KEY || initRef.current) return
    initRef.current = true

    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      autocapture: false,
      capture_pageview: true,
      capture_pageleave: true,
    })
  }, [])

  return null
}

function PostHogIdentify() {
  const { profile } = useProfile()
  const identifiedRef = useRef<string | null>(null)

  useEffect(() => {
    if (!POSTHOG_KEY) return

    if (profile && identifiedRef.current !== profile.id) {
      posthog.identify(profile.id, {
        email: profile.email,
        name: profile.displayName,
      })
      identifiedRef.current = profile.id
    } else if (!profile && identifiedRef.current) {
      posthog.reset()
      identifiedRef.current = null
    }
  }, [profile])

  return null
}

function PostHogNewUserDetection() {
  const detectedRef = useRef(false)

  useEffect(() => {
    if (!POSTHOG_KEY || detectedRef.current) return
    detectedRef.current = true

    const params = new URLSearchParams(window.location.search)
    if (params.get('new_user') !== '1') return

    const referredByShare = localStorage.getItem('fazer-referred-by-share')
    const referredBy = referredByShare ? 'share_link' : 'organic'

    posthog.capture('user_signed_up', { referred_by: referredBy })

    localStorage.removeItem('fazer-referred-by-share')

    // Clean the URL
    params.delete('new_user')
    const newSearch = params.toString()
    const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : '')
    window.history.replaceState({}, '', newUrl)
  }, [])

  return null
}

export function PostHogAnalytics({ children }: { children: React.ReactNode }) {
  if (!POSTHOG_KEY) {
    return <>{children}</>
  }

  return (
    <PHProvider client={posthog}>
      <PostHogInit />
      <PostHogIdentify />
      <PostHogNewUserDetection />
      {children}
    </PHProvider>
  )
}
