'use client'

import { memo } from 'react'
import { Plus, Search } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Props = {
  searchQuery: string
  onSearchChange: (query: string) => void
  onCreateList: () => void
}

export const ListControls = memo(function ListControls({
  searchQuery,
  onSearchChange,
  onCreateList,
}: Props) {
  const t = useTranslations()

  return (
    <div className="mb-4 flex items-center justify-between gap-2">
      <Button variant="outline" className="text-base" onClick={onCreateList}>
        <Plus className="h-4 w-4" />
        {t('lists.newList')}
      </Button>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <Input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t('lists.searchPlaceholder')}
          className="w-40 pl-9 sm:w-48"
        />
      </div>
    </div>
  )
})
