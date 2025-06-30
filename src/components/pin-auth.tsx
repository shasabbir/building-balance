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

export function PinAuth({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false)
  const [isChecking, setIsChecking] = React.useState(true)
  const [pin, setPin] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const { toast } = useToast()

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
            title: "Invalid PIN",
            description: "PIN must be 6 digits long.",
        })
        return
    }
    setIsSubmitting(true)
    try {
      await api.checkPin(pin)
      localStorage.setItem('isPinAuthenticated', 'true')
      setIsAuthenticated(true)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: "The PIN you entered is incorrect.",
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
            <DialogTitle>Enter PIN Code</DialogTitle>
            <DialogDescription>
                Please enter the 6-digit PIN to access the application.
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
                Unlock
            </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
