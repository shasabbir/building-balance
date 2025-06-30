
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
import { isSameMonth, lastDayOfMonth } from "date-fns"


export default function OtherExpensesPage() {
  const { otherExpenses, setOtherExpenses } = useData()
  const { selectedDate } = useDate()

  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editingExpense, setEditingExpense] = React.useState<Expense | null>(null)
  const [expenseToDelete, setExpenseToDelete] = React.useState<Expense | null>(null)
  
  // Form state
  const [category, setCategory] = React.useState<Expense['category'] | "">("")
  const [amount, setAmount] = React.useState("")
  const [details, setDetails] = React.useState("")
  
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!category || !amount || !details) return

    if (editingExpense) {
      const expenseData = {
        category: category as Expense['category'],
        amount: parseFloat(amount),
        details,
      }
      setOtherExpenses(expenses => expenses.map(e => e.id === editingExpense.id ? { ...e, ...expenseData } : e))
    } else {
      const now = new Date()
      const transactionDate = isSameMonth(selectedDate, now) ? now : lastDayOfMonth(selectedDate)
      const expenseData = {
        date: transactionDate.toISOString(),
        category: category as Expense['category'],
        amount: parseFloat(amount),
        details,
      }
      setOtherExpenses(prev => [{ id: `e${Date.now()}`, ...expenseData }, ...prev])
    }
    
    setIsDialogOpen(false)
    setEditingExpense(null)
  }
  
  const handleDelete = (expense: Expense) => {
    setOtherExpenses(expenses => expenses.filter(e => e.id !== expense.id))
    setExpenseToDelete(null)
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
      <PageHeader title="Other Expenses">
        <Button size="sm" className="gap-1" onClick={() => openDialog(null)}>
            <PlusCircle className="h-4 w-4" />
            Add Expense
        </Button>
      </PageHeader>
      <Card>
        <CardHeader>
            <CardTitle>Expense Log</CardTitle>
            <CardDescription>A list of all miscellaneous expenses for this month.</CardDescription>
        </CardHeader>
        <CardContent>
          {monthlyExpenses.length > 0 ? (
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="hidden sm:table-cell">Details</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>
                    <span className="sr-only">Actions</span>
                    </TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {monthlyExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                    <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                        <Badge variant="outline">{expense.category}</Badge>
                    </TableCell>
                    <TableCell className="font-medium hidden sm:table-cell">{expense.details}</TableCell>
                    <TableCell className="text-right">৳{expense.amount.toLocaleString()}</TableCell>
                    <TableCell>
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onSelect={() => openDialog(expense)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setExpenseToDelete(expense)} className="text-red-600">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
                <TableFooter>
                    <TableRow>
                        <TableCell colSpan={3} className="font-bold">Total</TableCell>
                        <TableCell className="text-right font-bold">৳{totalExpenses.toLocaleString()}</TableCell>
                        <TableCell></TableCell>
                    </TableRow>
                </TableFooter>
            </Table>
          ) : (
            <div className="text-center text-muted-foreground p-8">No expenses this month.</div>
          )}
        </CardContent>
      </Card>
      
      {/* Add/Edit Expense Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingExpense ? "Edit Expense" : "Add Expense"}</DialogTitle>
                <DialogDescription>
                  {editingExpense ? "Update the details of this expense." : "Record a new household, maintenance, or other expense."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 items-start gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
                  <Label htmlFor="category" className="sm:text-right">
                    Category
                  </Label>
                  <Select value={category} onValueChange={(value) => setCategory(value as Expense['category'])}>
                    <SelectTrigger className="sm:col-span-3">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="household">Household</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 items-start gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
                  <Label htmlFor="amount" className="sm:text-right">
                    Amount
                  </Label>
                  <Input id="amount" type="number" className="sm:col-span-3" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>
                <div className="grid grid-cols-1 items-start gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
                  <Label htmlFor="details" className="sm:text-right">
                    Details
                  </Label>
                  <Input id="details" className="sm:col-span-3" value={details} onChange={(e) => setDetails(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Save Expense</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!expenseToDelete} onOpenChange={() => setExpenseToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the expense record.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => expenseToDelete && handleDelete(expenseToDelete)}>
                    Continue
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  )
}
