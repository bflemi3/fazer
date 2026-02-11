'use client'

import { useState } from 'react'
import { Lightbulb, X } from 'lucide-react'
import { useTranslations } from 'next-intl'

type HintProps = {
  storageKey: string
  icon?: React.ReactNode
  action?: React.ReactNode
  children: React.ReactNode
}

export function Hint({ storageKey, icon, action, children }: HintProps) {
  const t = useTranslations()
  const [visible, setVisible] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(storageKey) !== 'true'
    }
    return true
  })

  if (!visible) return null

  function dismiss() {
    setVisible(false)
    localStorage.setItem(storageKey, 'true')
  }

  return (
    <div className="mb-4 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-base text-primary dark:border-primary/20 dark:bg-primary/10 dark:text-primary">
      {icon === undefined ? <Lightbulb className="h-4 w-4 shrink-0" /> : icon}
      <span className="flex-1">{children}</span>
      {action}
      <button
        onClick={dismiss}
        className="shrink-0 rounded p-0.5 hover:bg-primary/10 dark:hover:bg-primary/20"
        aria-label={t('common.close')}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
