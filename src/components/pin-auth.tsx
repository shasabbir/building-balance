
"use client"

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { api } from '@/services/api'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/contexts/language-context'

export function PinAuth({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false)
  const [isChecking, setIsChecking] = React.useState(true)
  const [pin, setPin] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const { toast } = useToast()
  const { t } = useLanguage()

  React.useEffect(() => {
    try {
      const authStatus = localStorage.getItem('isPinAuthenticated')
      if (authStatus === 'true') {
        setIsAuthenticated(true)
      }
    } catch (e) {
      console.error("Could not read from localStorage", e)
    } finally {
      setIsChecking(false)
    }
  }, [])

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pin.length !== 6) {
        toast({
            variant: "destructive",
            title: t('pinAuth.invalidPinTitle'),
            description: t('pinAuth.invalidPinDescription'),
        })
        return
    }
    setIsSubmitting(true)
    try {
      await api.checkPin(pin)
      localStorage.setItem('isPinAuthenticated', 'true')
      localStorage.setItem('pin', pin)
      setIsAuthenticated(true)
    } catch (error) {
      toast({
        variant: "destructive",
        title: t('pinAuth.authFailedTitle'),
        description: t('pinAuth.authFailedDescription'),
      })
      setPin('')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isChecking) {
    return null;
  }

  if (isAuthenticated) {
    return <>{children}</>
  }

  return (
    <Dialog open={true}>
      <DialogContent 
        hideCloseButton={true} 
        onEscapeKeyDown={(e) => e.preventDefault()} 
        onInteractOutside={(e) => e.preventDefault()} 
        className="sm:max-w-md"
    >
        <form onSubmit={handlePinSubmit}>
            <DialogHeader>
            <DialogTitle>{t('pinAuth.title')}</DialogTitle>
            <DialogDescription>
                {t('pinAuth.description')}
            </DialogDescription>
            </DialogHeader>
            <div className="py-8">
                <Input
                    type="password"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="******"
                    className="text-center text-2xl tracking-[0.5em]"
                    autoFocus
                />
            </div>
            <DialogFooter>
            <Button type="submit" loading={isSubmitting} className="w-full">
                {t('pinAuth.unlockButton')}
            </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
