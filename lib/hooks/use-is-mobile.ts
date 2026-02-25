'use client'

import { useState, useEffect } from 'react'

const MOBILE_BREAKPOINT = 640 // Tailwind's `sm` breakpoint

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    setIsMobile(mql.matches)

    function onChange(e: MediaQueryListEvent) {
      setIsMobile(e.matches)
    }

    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return isMobile
}
