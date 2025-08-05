
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageHeader } from "@/components/page-header"
import type { Expense } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { useData } from "@/contexts/data-context"
import { useDate } from "@/contexts/date-context"
import { useLanguage } from "@/contexts/language-context"
import { isSameMonth, lastDayOfMonth } from "date-fns"


export default function OtherExpensesPage() {
  const { otherExpenses, addExpense, updateExpense, deleteExpense, accessLevel } = useData()
  const { selectedDate } = useDate()
  const { t } = useLanguage()

  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editingExpense, setEditingExpense] = React.useState<Expense | null>(null)
  const [expenseToDelete, setExpenseToDelete] = React.useState<Expense | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  
  // Form state
  const [category, setCategory] = React.useState<Expense['category'] | "">("")
  const [amount, setAmount] = React.useState("")
  const [details, setDetails] = React.useState("")
  
  const isReadOnly = accessLevel === 'readonly';

  const openDialog = (expense: Expense | null) => {
    setEditingExpense(expense)
    if (expense) {
      setCategory(expense.category)
      setAmount(expense.amount.toString())
      setDetails(expense.details)
    } else {
      setCategory("")
      setAmount("")
      setDetails("")
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!category || !amount || !details || isReadOnly) return
    
    setIsSubmitting(true)
    try {
        if (editingExpense) {
            const expenseData = {
                ...editingExpense,
                category: category as Expense['category'],
                amount: parseFloat(amount),
                details,
            }
            await updateExpense(expenseData)
        } else {
            const now = new Date()
            const transactionDate = isSameMonth(selectedDate, now) ? now : lastDayOfMonth(selectedDate)
            const expenseData = {
                date: transactionDate.toISOString(),
                category: category as Expense['category'],
                amount: parseFloat(amount),
                details,
            }
            await addExpense(expenseData)
        }
        
        setIsDialogOpen(false)
        setEditingExpense(null)
    } catch (error) {
        // toast handled in context
    } finally {
        setIsSubmitting(false)
    }
  }
  
  const handleDelete = async (expense: Expense) => {
    if (isReadOnly) return;
    setIsSubmitting(true)
    try {
        await deleteExpense(expense.id)
        setExpenseToDelete(null)
    } catch(error) {
        // toast handled in context
    } finally {
        setIsSubmitting(false)
    }
  }

  const monthlyExpenses = React.useMemo(() => {
    return otherExpenses
        .filter(expense => isSameMonth(new Date(expense.date), selectedDate))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [otherExpenses, selectedDate])
  
  const totalExpenses = React.useMemo(() => {
      return monthlyExpenses.reduce((total, expense) => total + expense.amount, 0)
  }, [monthlyExpenses])

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t('otherExpenses.title')}>
        <Button size="sm" className="gap-1" onClick={() => openDialog(null)} disabled={isReadOnly}>
            <PlusCircle className="h-4 w-4" />
            {t('otherExpenses.addExpense')}
        </Button>
      </PageHeader>
      <Card>
        <CardHeader>
            <CardTitle>{t('otherExpenses.expenseLog')}</CardTitle>
            <CardDescription>{t('otherExpenses.expenseLogDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {monthlyExpenses.length > 0 ? (
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>{t('common.date')}</TableHead>
                    <TableHead>{t('common.category')}</TableHead>
                    <TableHead className="hidden sm:table-cell">{t('common.details')}</TableHead>
                    <TableHead className="text-right">{t('common.amount')}</TableHead>
                    <TableHead>
                    <span className="sr-only">{t('common.actions')}</span>
                    </TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {monthlyExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                    <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                        <Badge variant="outline">{t(`otherExpenses.category${expense.category}`)}</Badge>
                    </TableCell>
                    <TableCell className="font-medium hidden sm:table-cell">{expense.details}</TableCell>
                    <TableCell className="text-right">৳{expense.amount.toLocaleString()}</TableCell>
                    <TableCell>
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost" disabled={isReadOnly}>
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">{t('common.toggleMenu')}</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>{t('common.actions')}</DropdownMenuLabel>
                            <DropdownMenuItem onSelect={() => openDialog(expense)}>{t('common.edit')}</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setExpenseToDelete(expense)} className="text-red-600">{t('common.delete')}</DropdownMenuItem>
                        </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
                <TableFooter>
                    <TableRow>
                        <TableCell colSpan={3} className="font-bold">{t('common.total')}</TableCell>
                        <TableCell className="text-right font-bold">৳{totalExpenses.toLocaleString()}</TableCell>
                        <TableCell></TableCell>
                    </TableRow>
                </TableFooter>
            </Table>
          ) : (
            <div className="text-center text-muted-foreground p-8">{t('otherExpenses.noExpenses')}</div>
          )}
        </CardContent>
      </Card>
      
      {/* Add/Edit Expense Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingExpense ? t('otherExpenses.dialogEditTitle') : t('otherExpenses.dialogAddTitle')}</DialogTitle>
                <DialogDescription>
                  {editingExpense ? t('otherExpenses.dialogEditDesc') : t('otherExpenses.dialogAddDesc')}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 items-start gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
                  <Label htmlFor="category" className="sm:text-right">
                    {t('common.category')}
                  </Label>
                  <Select value={category} onValueChange={(value) => setCategory(value as Expense['category'])}>
                    <SelectTrigger className="sm:col-span-3">
                      <SelectValue placeholder={t('otherExpenses.selectCategory')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="household">{t('otherExpenses.categoryHousehold')}</SelectItem>
                      <SelectItem value="maintenance">{t('otherExpenses.categoryMaintenance')}</SelectItem>
                      <SelectItem value="other">{t('otherExpenses.categoryOther')}</SelectItem>
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
                  <Label htmlFor="details" className="sm:text-right">
                    {t('common.details')}
                  </Label>
                  <Input id="details" className="sm:col-span-3" value={details} onChange={(e) => setDetails(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" loading={isSubmitting} disabled={isReadOnly}>{t('otherExpenses.saveExpense')}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!expenseToDelete} onOpenChange={() => setExpenseToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t('common.areYouSure')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('otherExpenses.deleteDesc')}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={() => expenseToDelete && handleDelete(expenseToDelete)} disabled={isSubmitting || isReadOnly}>
                      {isSubmitting ? t('common.deleting') : t('common.continue')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  )
}
