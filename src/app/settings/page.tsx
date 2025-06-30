
"use client"
import * as React from 'react'
import { PageHeader } from '@/components/page-header'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { useData } from '@/contexts/data-context'
import { ThemeToggle } from '@/components/theme-toggle'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function SettingsPage() {
  const { initiationDate, updateInitiationDate, clearAllData } = useData()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isClearAlertOpen, setIsClearAlertOpen] = React.useState(false)

  const handleDateChange = async (date?: Date) => {
    if (date) {
      setIsSubmitting(true)
      try {
        await updateInitiationDate(date)
      } finally {
        setIsSubmitting(false)
      }
    }
  }
  
  const handleClearData = async () => {
      setIsSubmitting(true)
      try {
          await clearAllData()
      } finally {
          setIsSubmitting(false)
          setIsClearAlertOpen(false)
      }
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Settings" />
      <Card>
        <CardHeader>
          <CardTitle>System Settings</CardTitle>
          <CardDescription>
            Global settings for the application.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <div>
            <h3 className="font-medium mb-2">System Initiation Month</h3>
            <div className="flex flex-col gap-2 items-start justify-between mt-2 text-sm text-muted-foreground p-4 border rounded-lg sm:flex-row sm:items-center">
                <p className="mb-2 sm:mb-0">Set the month from which all calculations should begin. This will be the earliest month you can navigate to.</p>
                <DatePicker 
                  date={initiationDate} 
                  setDate={handleDateChange}
                  />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Customize the look and feel of the app.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <h3 className="font-medium mb-4">Theme</h3>
          <ThemeToggle />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>
            Manage your application data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium">Clear All Data</h3>
            <div className="flex flex-col items-start justify-between mt-2 text-sm text-muted-foreground p-4 border rounded-lg sm:flex-row sm:items-center">
                <p className="mb-2 sm:mb-0 max-w-prose">Permanently delete all data and reset the application to its initial state. <span className="font-bold text-destructive">This action cannot be undone.</span></p>
                <Button variant="destructive" onClick={() => setIsClearAlertOpen(true)}>Clear All Data</Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <AlertDialog open={isClearAlertOpen} onOpenChange={setIsClearAlertOpen}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                  This will permanently erase all data from the server and your local device. The application will be reset to its default state. This action cannot be undone.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearData} disabled={isSubmitting}>
                      {isSubmitting ? 'Clearing...' : 'Continue'}
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
