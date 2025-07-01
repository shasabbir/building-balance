
"use client"
import * as React from "react"
import { PlusCircle, MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PageHeader } from "@/components/page-header"
import type { UtilityBill } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { useData } from "@/contexts/data-context"
import { useDate } from "@/contexts/date-context"
import { useLanguage } from "@/contexts/language-context"
import { isSameMonth, lastDayOfMonth } from "date-fns"


export default function UtilityBillsPage() {
  const { utilityBills, addUtilityBill, updateUtilityBill, deleteUtilityBill } = useData()
  const { selectedDate } = useDate()
  const { t } = useLanguage()

  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editingBill, setEditingBill] = React.useState<UtilityBill | null>(null)
  const [billToDelete, setBillToDelete] = React.useState<UtilityBill | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Form state
  const [billType, setBillType] = React.useState<UtilityBill['type'] | "">("")
  const [amount, setAmount] = React.useState("")
  const [notes, setNotes] = React.useState("")

  const openDialog = (bill: UtilityBill | null) => {
    setEditingBill(bill)
    if (bill) {
      setBillType(bill.type)
      setAmount(bill.amount.toString())
      setNotes(bill.notes)
    } else {
      setBillType("")
      setAmount("")
      setNotes("")
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!billType || !amount) return

    setIsSubmitting(true)
    try {
        if (editingBill) {
            const billData = {
                ...editingBill,
                type: billType as UtilityBill['type'],
                amount: parseFloat(amount),
                notes,
            }
            await updateUtilityBill(billData)
        } else {
            const now = new Date()
            const transactionDate = isSameMonth(selectedDate, now) ? now : lastDayOfMonth(selectedDate)
            const billData = {
                date: transactionDate.toISOString(),
                type: billType as UtilityBill['type'],
                amount: parseFloat(amount),
                notes,
            }
            await addUtilityBill(billData)
        }
        
        setIsDialogOpen(false)
        setEditingBill(null)
    } catch(error) {
      // toast handled in context
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleDelete = async (bill: UtilityBill) => {
      setIsSubmitting(true)
      try {
          await deleteUtilityBill(bill.id)
          setBillToDelete(null)
      } catch(error) {
        // toast handled in context
      } finally {
          setIsSubmitting(false)
      }
  }

  const monthlyBills = React.useMemo(() => {
    return utilityBills
      .filter(bill => isSameMonth(new Date(bill.date), selectedDate))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [utilityBills, selectedDate])
  
  const totalAmount = React.useMemo(() => {
    return monthlyBills.reduce((acc, bill) => acc + bill.amount, 0)
  }, [monthlyBills])

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t('utilityBills.title')}>
        <Button size="sm" className="gap-1" onClick={() => openDialog(null)}>
          <PlusCircle className="h-4 w-4" />
          {t('utilityBills.addBill')}
        </Button>
      </PageHeader>
      
      <Card>
        <CardHeader>
            <CardTitle>{t('utilityBills.billsForMonth')}</CardTitle>
            <CardDescription>{t('utilityBills.billsForMonthDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {monthlyBills.length > 0 ? (
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>{t('common.date')}</TableHead>
                    <TableHead>{t('common.type')}</TableHead>
                    <TableHead className="hidden sm:table-cell">{t('common.notes')}</TableHead>
                    <TableHead className="text-right">{t('common.amount')}</TableHead>
                    <TableHead>
                    <span className="sr-only">{t('common.actions')}</span>
                    </TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {monthlyBills.map((bill) => (
                    <TableRow key={bill.id}>
                    <TableCell>{new Date(bill.date).toLocaleDateString()}</TableCell>
                    <TableCell><Badge variant="outline">{t(`utilityBills.${bill.type.toLowerCase()}`)}</Badge></TableCell>
                    <TableCell className="font-medium hidden sm:table-cell">{bill.notes || "-"}</TableCell>
                    <TableCell className="text-right">৳{bill.amount.toLocaleString()}</TableCell>
                    <TableCell>
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">{t('common.toggleMenu')}</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>{t('common.actions')}</DropdownMenuLabel>
                            <DropdownMenuItem onSelect={() => openDialog(bill)}>{t('common.edit')}</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setBillToDelete(bill)} className="text-red-600">{t('common.delete')}</DropdownMenuItem>
                        </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
                <TableFooter>
                    <TableRow>
                        <TableCell colSpan={3} className="font-bold">{t('common.total')}</TableCell>
                        <TableCell className="text-right font-bold">৳{totalAmount.toLocaleString()}</TableCell>
                        <TableCell></TableCell>
                    </TableRow>
                </TableFooter>
            </Table>
          ) : (
            <div className="text-center text-muted-foreground p-8">{t('utilityBills.noBills')}</div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingBill ? t('utilityBills.dialogEditTitle') : t('utilityBills.dialogAddTitle')}</DialogTitle>
              <DialogDescription>
                {editingBill ? t('utilityBills.dialogEditDesc') : t('utilityBills.dialogAddDesc')}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 items-start gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
                <Label htmlFor="type" className="sm:text-right">
                  {t('utilityBills.type')}
                </Label>
                <Select value={billType} onValueChange={(value) => setBillType(value as UtilityBill['type'])}>
                  <SelectTrigger className="sm:col-span-3">
                    <SelectValue placeholder={t('utilityBills.selectBillType')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Electricity">{t('utilityBills.electricity')}</SelectItem>
                    <SelectItem value="Water">{t('utilityBills.water')}</SelectItem>
                    <SelectItem value="Gas">{t('utilityBills.gas')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 items-start gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
                <Label htmlFor="amount" className="sm:text-right">
                  {t('common.amount')}
                </Label>
                <Input id="amount" type="number" className="sm:col-span-3" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <div className="grid grid-cols-1 items-start gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
                <Label htmlFor="notes" className="sm:text-right">
                  {t('common.notes')}
                </Label>
                <Input id="notes" className="sm:col-span-3" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" loading={isSubmitting}>{t('utilityBills.savePayment')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
       <AlertDialog open={!!billToDelete} onOpenChange={() => setBillToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.areYouSure')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('utilityBills.deleteDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => billToDelete && handleDelete(billToDelete)} disabled={isSubmitting}>
              {isSubmitting ? t('common.deleting') : t('common.continue')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
