'use client'

import { memo } from 'react'
import { Search } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type Props = {
  className?: string
  searchQuery: string
  onSearchChange: (query: string) => void
}

export const ListControls = memo(function ListControls({
  className,
  searchQuery,
  onSearchChange,
}: Props) {
  const t = useTranslations()

  return (
    <div className={cn('flex items-center', className)}>
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <Input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t('lists.searchPlaceholder')}
          className="pl-9"
        />
      </div>
    </div>
  )
})
