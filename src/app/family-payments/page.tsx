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
import { PageHeader } from "@/components/page-header"
import type { Payout } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useData } from "@/contexts/data-context"
import { useDate } from "@/contexts/date-context"
import { isSameMonth, lastDayOfMonth } from "date-fns"


export default function FamilyPaymentsPage() {
  const { payouts, setPayouts, familyMembers } = useData()
  const { selectedDate } = useDate()

  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editingPayout, setEditingPayout] = React.useState<Payout | null>(null)
  const [payoutToDelete, setPayoutToDelete] = React.useState<Payout | null>(null)

  // Form State
  const [selectedMemberId, setSelectedMemberId] = React.useState("")
  const [amount, setAmount] = React.useState("")
  
  const openDialog = (payout: Payout | null) => {
      setEditingPayout(payout)
      if (payout) {
          setSelectedMemberId(payout.familyMemberId)
          setAmount(payout.amount.toString())
      } else {
          setSelectedMemberId("")
          setAmount("")
      }
      setIsDialogOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMemberId || !amount) return

    const member = familyMembers.find(m => m.id === selectedMemberId)
    if (!member) return

    if (editingPayout) {
        const payoutData = {
          familyMemberId: selectedMemberId,
          familyMemberName: member.name,
          amount: parseFloat(amount),
        }
        setPayouts(payouts => payouts.map(p => p.id === editingPayout.id ? { ...p, ...payoutData } : p))
    } else {
        const now = new Date()
        const transactionDate = isSameMonth(selectedDate, now) ? now : lastDayOfMonth(selectedDate)
        const payoutData = {
          familyMemberId: selectedMemberId,
          familyMemberName: member.name,
          amount: parseFloat(amount),
          date: transactionDate.toISOString(),
        }
        setPayouts(prev => [{ id: `p${Date.now()}`, ...payoutData }, ...prev])
    }

    setIsDialogOpen(false)
    setEditingPayout(null)
  }

  const handleDelete = (payout: Payout) => {
      setPayouts(payouts => payouts.filter(p => p.id !== payout.id))
      setPayoutToDelete(null)
  }

  const familyMembersWithSummary = React.useMemo(() => {
    return familyMembers.map(member => {
      const memberPayoutsThisMonth = payouts.filter(p => p.familyMemberId === member.id && isSameMonth(new Date(p.date), selectedDate))
      const paid = memberPayoutsThisMonth.reduce((acc, p) => acc + p.amount, 0)
      const payable = member.expected - paid
      return {
        ...member,
        paid,
        payable: payable > 0 ? payable : 0,
      }
    })
  }, [payouts, familyMembers, selectedDate])
  
  const monthlyPayouts = React.useMemo(() => {
    return payouts
        .filter(payout => isSameMonth(new Date(payout.date), selectedDate))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [payouts, selectedDate])

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Family Payments">
        <Button size="sm" className="gap-1" onClick={() => openDialog(null)}>
            <PlusCircle className="h-4 w-4" />
            Add Payout
        </Button>
      </PageHeader>
      
      <Card>
        <CardHeader>
          <CardTitle>Payout Summary</CardTitle>
          <CardDescription>Monthly expected and paid amounts for each family member.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member Name</TableHead>
                <TableHead className="text-right">Expected</TableHead>
                <TableHead className="text-right">Paid This Month</TableHead>
                <TableHead className="text-right">This Month Payable</TableHead>
                <TableHead className="text-right">Total Payable (All Time)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {familyMembersWithSummary.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell className="text-right">৳{member.expected.toLocaleString()}</TableCell>
                  <TableCell className="text-right">৳{member.paid.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    {member.payable > 0 ? (
                      <Badge variant="destructive">৳{member.payable.toLocaleString()}</Badge>
                    ) : (
                      '৳0'
                    )}
                  </TableCell>
                  <TableCell className="text-right font-semibold">৳{member.cumulativePayable.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>Payout History for this Month</CardTitle>
            <CardDescription>Full list of all payouts made this month.</CardDescription>
        </CardHeader>
        <CardContent>
            {monthlyPayouts.length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Member Name</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead><span className="sr-only">Actions</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {monthlyPayouts.map((payout) => (
                            <TableRow key={payout.id}>
                                <TableCell>{new Date(payout.date).toLocaleDateString()}</TableCell>
                                <TableCell className="font-medium">{payout.familyMemberName}</TableCell>
                                <TableCell className="text-right">৳{payout.amount.toLocaleString()}</TableCell>
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
                                            <DropdownMenuItem onSelect={() => openDialog(payout)}>Edit</DropdownMenuItem>
                                            <DropdownMenuItem onSelect={() => setPayoutToDelete(payout)} className="text-red-600">Delete</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            ) : (
                <div className="text-center text-muted-foreground p-8">No payouts this month.</div>
            )}
        </CardContent>
      </Card>
      
      {/* Add/Edit Payout Dialog */}
       <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingPayout ? "Edit Payout" : "Add Payout"}</DialogTitle>
                <DialogDescription>
                  {editingPayout ? "Update the details of this payout." : "Record a new payment made to a family member."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Member
                  </Label>
                  <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a member" />
                    </SelectTrigger>
                    <SelectContent>
                      {familyMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="amount" className="text-right">
                    Amount Paid
                  </Label>
                  <Input id="amount" type="number" className="col-span-3" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Save Payout</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        
        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!payoutToDelete} onOpenChange={() => setPayoutToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the payout record.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => payoutToDelete && handleDelete(payoutToDelete)}>
                    Continue
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  )
}
