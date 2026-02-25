'use client'

import { memo } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SettingsButton } from './settings-button'

type Props = {
  onPlusClick: () => void
}

export const TopBar = memo(function TopBar({ onPlusClick }: Props) {
  return (
    <div className="fixed right-4 top-4 z-50 flex gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={onPlusClick}
      >
        <Plus className="h-4 w-4" />
      </Button>
      <SettingsButton />
    </div>
  )
})
