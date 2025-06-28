
"use client"
import * as React from "react"
import { PlusCircle, MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
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
import { isSameMonth, lastDayOfMonth } from "date-fns"


export default function UtilityBillsPage() {
  const { utilityBills, setUtilityBills } = useData()
  const { selectedDate } = useDate()

  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editingBill, setEditingBill] = React.useState<UtilityBill | null>(null)
  const [billToDelete, setBillToDelete] = React.useState<UtilityBill | null>(null)

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!billType || !amount) return

    if (editingBill) {
      const billData = {
        type: billType as UtilityBill['type'],
        amount: parseFloat(amount),
        notes,
      }
      setUtilityBills(bills => bills.map(b => b.id === editingBill.id ? { ...b, ...billData } : b))
    } else {
      const now = new Date()
      const transactionDate = isSameMonth(selectedDate, now) ? now : lastDayOfMonth(selectedDate)
      const billData = {
        date: transactionDate.toISOString(),
        type: billType as UtilityBill['type'],
        amount: parseFloat(amount),
        notes,
      }
      setUtilityBills(prev => [{ id: `b${Date.now()}`, ...billData }, ...prev])
    }
    
    setIsDialogOpen(false)
    setEditingBill(null)
  }
  
  const handleDelete = (bill: UtilityBill) => {
      setUtilityBills(bills => bills.filter(b => b.id !== bill.id))
      setBillToDelete(null)
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
      <PageHeader title="Utility Bills">
        <Button size="sm" className="gap-1" onClick={() => openDialog(null)}>
          <PlusCircle className="h-4 w-4" />
          Add Bill Payment
        </Button>
      </PageHeader>
      
      <Card>
        <CardHeader className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Utility Bills for this Month</CardTitle>
            <CardDescription>A complete log of all utility payments for the selected month.</CardDescription>
          </div>
          <div className="text-2xl font-bold">Total: ৳{totalAmount.toLocaleString()}</div>
        </CardHeader>
        <CardContent>
          {monthlyBills.length > 0 ? (
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="hidden sm:table-cell">Notes</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>
                    <span className="sr-only">Actions</span>
                    </TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {monthlyBills.map((bill) => (
                    <TableRow key={bill.id}>
                    <TableCell>{new Date(bill.date).toLocaleDateString()}</TableCell>
                    <TableCell><Badge variant="outline">{bill.type}</Badge></TableCell>
                    <TableCell className="font-medium hidden sm:table-cell">{bill.notes || "-"}</TableCell>
                    <TableCell className="text-right">৳{bill.amount.toLocaleString()}</TableCell>
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
                            <DropdownMenuItem onSelect={() => openDialog(bill)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setBillToDelete(bill)} className="text-red-600">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
          ) : (
            <div className="text-center text-muted-foreground p-8">No utility bills this month.</div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingBill ? "Edit Bill Payment" : "Add Bill Payment"}</DialogTitle>
              <DialogDescription>
                {editingBill ? "Update the details of the bill." : "Record a new utility bill payment."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 items-start gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
                <Label htmlFor="type" className="sm:text-right">
                  Type
                </Label>
                <Select value={billType} onValueChange={(value) => setBillType(value as UtilityBill['type'])}>
                  <SelectTrigger className="sm:col-span-3">
                    <SelectValue placeholder="Select bill type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Electricity">Electricity</SelectItem>
                    <SelectItem value="Water">Water</SelectItem>
                    <SelectItem value="Gas">Gas</SelectItem>
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
                <Label htmlFor="notes" className="sm:text-right">
                  Notes
                </Label>
                <Input id="notes" className="sm:col-span-3" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Save Payment</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
       <AlertDialog open={!!billToDelete} onOpenChange={() => setBillToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the bill payment record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => billToDelete && handleDelete(billToDelete)}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
