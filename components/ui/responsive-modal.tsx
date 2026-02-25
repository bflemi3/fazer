'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/lib/hooks/use-is-mobile'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from '@/components/ui/drawer'

type ResponsiveModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

function ResponsiveModal({ open, onOpenChange, children }: ResponsiveModalProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          {children}
          {/* Safe area padding for notched devices */}
          <div className="safe-area-pb" />
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {children}
      </DialogContent>
    </Dialog>
  )
}

function ResponsiveModalHeader({ className, ...props }: React.ComponentProps<'div'>) {
  const isMobile = useIsMobile()
  const Component = isMobile ? DrawerHeader : DialogHeader
  return <Component className={className} {...props} />
}

function ResponsiveModalTitle({ className, ...props }: React.ComponentProps<'h2'>) {
  const isMobile = useIsMobile()
  const Component = isMobile ? DrawerTitle : DialogTitle
  return <Component className={className} {...(props as React.ComponentProps<typeof DialogTitle>)} />
}

function ResponsiveModalDescription({ className, ...props }: React.ComponentProps<'p'>) {
  const isMobile = useIsMobile()
  const Component = isMobile ? DrawerDescription : DialogDescription
  return <Component className={className} {...(props as React.ComponentProps<typeof DialogDescription>)} />
}

function ResponsiveModalBody({ className, ...props }: React.ComponentProps<'div'>) {
  const isMobile = useIsMobile()
  return (
    <div
      className={cn(isMobile ? 'px-4 pb-2' : '', className)}
      {...props}
    />
  )
}

function ResponsiveModalFooter({ className, ...props }: React.ComponentProps<'div'>) {
  const isMobile = useIsMobile()
  const Component = isMobile ? DrawerFooter : DialogFooter
  return <Component className={className} {...props} />
}

export {
  ResponsiveModal,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
  ResponsiveModalBody,
  ResponsiveModalFooter,
}
