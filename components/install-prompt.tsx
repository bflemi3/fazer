'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Hint } from '@/components/hint'
import { useInstallPrompt } from '@/lib/hooks/use-install-prompt'

export function InstallPrompt() {
  const t = useTranslations()
  const { canPrompt, isIOS, isInstalled, promptInstall } = useInstallPrompt()

  if (isInstalled) return null
  if (!canPrompt && !isIOS) return null

  return (
    <Hint
      storageKey="fazer-install-dismissed"
      icon={null}
      action={canPrompt ? (
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 text-base text-primary hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20"
          onClick={promptInstall}
        >
          {t('install.install')}
        </Button>
      ) : undefined}
    >
      {isIOS ? t('install.iosDescription') : t('install.description')}
    </Hint>
  )
}
