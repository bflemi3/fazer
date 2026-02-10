'use client'

import { useTranslations } from 'next-intl'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Monitor, Sun, Moon, Check, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useLocale } from './locale-provider'
import { locales } from '@/lib/i18n/config'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

type SettingsModalProps = {
  open: boolean
  onClose: () => void
}

const themes = [
  { value: 'system', icon: Monitor },
  { value: 'light', icon: Sun },
  { value: 'dark', icon: Moon },
] as const

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const t = useTranslations()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { locale, setLocale } = useLocale()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    onClose()
    router.push('/login')
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('settings.title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Language */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
              {t('settings.language')}
            </label>
            <div className="flex gap-2">
              {locales.map((loc) => (
                <Button
                  key={loc}
                  variant={locale === loc ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setLocale(loc)}
                >
                  {t(`settings.locale.${loc}`)}
                  {locale === loc && <Check className="h-4 w-4" />}
                </Button>
              ))}
            </div>
          </div>

          {/* Appearance */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
              {t('settings.appearance')}
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              {themes.map(({ value, icon: Icon }) => (
                <Button
                  key={value}
                  variant={theme === value ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setTheme(value)}
                >
                  <Icon className="h-4 w-4" />
                  {t(`settings.theme.${value}`)}
                  {theme === value && <Check className="h-4 w-4" />}
                </Button>
              ))}
            </div>
          </div>

          {/* Sign out */}
          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              {t('auth.signOut')}
            </Button>
          </div>
        </div>

        <Link
          href="/changelog"
          onClick={onClose}
          className="-mb-2 block text-center text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
        >
          v{process.env.NEXT_PUBLIC_APP_VERSION}
        </Link>
      </DialogContent>
    </Dialog>
  )
}
