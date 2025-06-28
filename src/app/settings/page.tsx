import { PageHeader } from '@/components/page-header'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Settings" />
      <Card>
        <CardHeader>
          <CardTitle>Application Settings</CardTitle>
          <CardDescription>
            Manage your application preferences here. This section is a placeholder for future features.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium">Data Management</h3>
            <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground p-4 border rounded-lg">
                <p>Export your monthly financial data to an Excel file.</p>
                <Button variant="outline">Export to Excel</Button>
            </div>
             <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground p-4 border rounded-lg">
                <p>Backup your entire application data.</p>
                <Button variant="outline">Create Backup</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
