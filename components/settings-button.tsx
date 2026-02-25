'use client'

import { useState } from 'react'
import { Settings } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { SettingsModal } from './settings-modal'
import { Button } from '@/components/ui/button'

export function SettingsButton() {
  const [open, setOpen] = useState(false)
  const t = useTranslations()

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setOpen(true)}
        aria-label={t('common.settings')}
      >
        <Settings className="h-4 w-4" />
      </Button>

      <SettingsModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}
