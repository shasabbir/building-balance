
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
import { useLanguage } from '@/contexts/language-context'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

export default function SettingsPage() {
  const { initiationDate, updateInitiationDate, clearAllData, accessLevel } = useData()
  const { language, setLanguage, t } = useLanguage()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isClearAlertOpen, setIsClearAlertOpen] = React.useState(false)

  const isReadOnly = accessLevel === 'readonly';

  const handleDateChange = async (date?: Date) => {
    if (date && !isReadOnly) {
      setIsSubmitting(true)
      try {
        await updateInitiationDate(date)
      } finally {
        setIsSubmitting(false)
      }
    }
  }
  
  const handleClearData = async () => {
      if (isReadOnly) return;
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
      <PageHeader title={t('settings.title')} />
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.system')}</CardTitle>
          <CardDescription>
            {t('settings.systemDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <div>
            <h3 className="font-medium mb-2">{t('settings.initiationMonth')}</h3>
            <div className="flex flex-col gap-2 items-start justify-between mt-2 text-sm text-muted-foreground p-4 border rounded-lg sm:flex-row sm:items-center">
                <p className="mb-2 sm:mb-0">{t('settings.initiationMonthDesc')}</p>
                <DatePicker 
                  date={initiationDate} 
                  setDate={handleDateChange}
                  disabled={isReadOnly}
                  />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.appearance')}</CardTitle>
          <CardDescription>
            {t('settings.appearanceDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div>
            <h3 className="font-medium mb-4">{t('settings.theme')}</h3>
            <ThemeToggle />
          </div>
          <div>
            <h3 className="font-medium mb-4">{t('settings.language')}</h3>
            <RadioGroup
              value={language}
              onValueChange={(value) => setLanguage(value as 'en' | 'bn')}
              className="grid max-w-md grid-cols-1 gap-4 sm:grid-cols-3"
            >
              <div>
                <RadioGroupItem value="en" id="en" className="peer sr-only" />
                <Label
                  htmlFor="en"
                  className="flex cursor-pointer flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  {t('settings.english')}
                </Label>
              </div>
              <div>
                <RadioGroupItem value="bn" id="bn" className="peer sr-only" />
                <Label
                  htmlFor="bn"
                  className="flex cursor-pointer flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  {t('settings.bengali')}
                </Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.dataManagement')}</CardTitle>
          <CardDescription>
            {t('settings.dataManagementDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium">{t('settings.clearAllData')}</h3>
            <div className="flex flex-col items-start justify-between mt-2 text-sm text-muted-foreground p-4 border rounded-lg sm:flex-row sm:items-center">
                <p className="mb-2 sm:mb-0 max-w-prose">{t('settings.clearAllDataDesc')} <span className="font-bold text-destructive">This action cannot be undone.</span></p>
                <Button variant="destructive" onClick={() => setIsClearAlertOpen(true)} disabled={isReadOnly}>{t('settings.clearAllDataButton')}</Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <AlertDialog open={isClearAlertOpen} onOpenChange={setIsClearAlertOpen}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>{t('common.areYouSure')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('settings.clearAlertDesc')}
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearData} disabled={isSubmitting || isReadOnly}>
                      {isSubmitting ? t('settings.clearing') : t('common.continue')}
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
