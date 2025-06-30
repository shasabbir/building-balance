
"use client"
import * as React from 'react'
import { PageHeader } from '@/components/page-header'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { useData } from '@/contexts/data-context'
import { ThemeToggle } from '@/components/theme-toggle'

export default function SettingsPage() {
  const { initiationDate, setInitiationDate } = useData()

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
                  setDate={(date) => {
                    if (date) setInitiationDate(date)
                  }}
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
            Manage your application preferences here. This section is a placeholder for future features.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium">Data Backup & Export</h3>
            <div className="flex flex-col items-start justify-between mt-2 text-sm text-muted-foreground p-4 border rounded-lg sm:flex-row sm:items-center">
                <p className="mb-2 sm:mb-0">Export your monthly financial data to an Excel file.</p>
                <Button variant="outline">Export to Excel</Button>
            </div>
             <div className="flex flex-col items-start justify-between mt-2 text-sm text-muted-foreground p-4 border rounded-lg sm:flex-row sm:items-center">
                <p className="mb-2 sm:mb-0">Backup your entire application data.</p>
                <Button variant="outline">Create Backup</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
