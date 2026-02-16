'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import posthog from 'posthog-js'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
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
          Something didn't load right. Give it another shot, or refresh the page if it keeps happening.
        </p>
        <Button variant="outline" className="mt-6" onClick={reset}>
          Try again
        </Button>
      </div>
    </div>
  )
}
