
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
import { PageHeader } from "@/components/page-header"
import type { FamilyMember, Payout } from "@/lib/types"
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
import { getEffectiveValue } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"


export default function FamilyPaymentsPage() {
  const { payouts, familyMembers, addPayout, updatePayout, deletePayout, addFamilyMember, updateFamilyMember, deleteFamilyMember } = useData()
  const { selectedDate } = useDate()
  const { toast } = useToast()

  const [isPayoutDialogOpen, setIsPayoutDialogOpen] = React.useState(false)
  const [isMemberDialogOpen, setIsMemberDialogOpen] = React.useState(false)
  
  const [editingPayout, setEditingPayout] = React.useState<Payout | null>(null)
  const [editingMember, setEditingMember] = React.useState<FamilyMember | null>(null)
  
  const [itemToDelete, setItemToDelete] = React.useState<{type: 'payout' | 'member', id: string} | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Payout Form State
  const [selectedMemberId, setSelectedMemberId] = React.useState("")
  const [payoutAmount, setPayoutAmount] = React.useState("")
  
  // Member Form State
  const [memberName, setMemberName] = React.useState("")
  const [memberExpected, setMemberExpected] = React.useState("")

  const referenceDate = React.useMemo(() => (
    isSameMonth(selectedDate, new Date()) ? new Date() : lastDayOfMonth(selectedDate)
  ), [selectedDate]);
  
  const openPayoutDialog = (payout: Payout | null) => {
      setEditingPayout(payout)
      if (payout) {
          setSelectedMemberId(payout.familyMemberId)
          setPayoutAmount(payout.amount.toString())
      } else {
          setSelectedMemberId("")
          setPayoutAmount("")
      }
      setIsPayoutDialogOpen(true)
  }

  const handlePayoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMemberId || !payoutAmount) return

    const member = familyMembers.find(m => m.id === selectedMemberId)
    if (!member) return

    setIsSubmitting(true)
    try {
      if (editingPayout) {
          const payoutData = {
            ...editingPayout,
            familyMemberId: selectedMemberId,
            familyMemberName: member.name,
            amount: parseFloat(payoutAmount),
          }
          await updatePayout(payoutData)
      } else {
          const now = new Date()
          const transactionDate = isSameMonth(selectedDate, now) ? now : lastDayOfMonth(selectedDate)
          const payoutData = {
            familyMemberId: selectedMemberId,
            familyMemberName: member.name,
            amount: parseFloat(payoutAmount),
            date: transactionDate.toISOString(),
          }
          await addPayout(payoutData)
      }
      setIsPayoutDialogOpen(false)
      setEditingPayout(null)
    } catch(error) {
        // toast is handled in context
    } finally {
        setIsSubmitting(false)
    }
  }

  const openMemberDialog = (member: FamilyMember | null) => {
    setEditingMember(member)
    if (member) {
      setMemberName(member.name)
      const currentExpected = getEffectiveValue(member.expectedHistory, new Date())
      setMemberExpected(currentExpected.toString())
    } else {
      setMemberName("")
      setMemberExpected("")
    }
    setIsMemberDialogOpen(true)
  }

  const handleMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!memberName || !memberExpected) return

    setIsSubmitting(true)
    try {
      if (editingMember) {
        const newExpectedAmount = parseFloat(memberExpected)
        const currentExpectedAmount = getEffectiveValue(editingMember.expectedHistory, new Date())
        
        const history = Array.isArray(editingMember.expectedHistory) ? editingMember.expectedHistory : []
        let updatedHistory = [...history]

        if (newExpectedAmount !== currentExpectedAmount) {
            const today = new Date();
            const existingTodayIndex = updatedHistory.findIndex(
              (entry) => new Date(entry.effectiveDate).toDateString() === today.toDateString()
            );

            if (existingTodayIndex !== -1) {
              updatedHistory[existingTodayIndex].amount = newExpectedAmount;
            } else {
              updatedHistory.push({ amount: newExpectedAmount, effectiveDate: today.toISOString() });
            }
        }

        const memberData = {
          ...editingMember,
          name: memberName,
          expectedHistory: updatedHistory,
        }
        await updateFamilyMember(memberData)
      } else {
        const newMember = {
          name: memberName,
          expectedHistory: [{ amount: parseFloat(memberExpected), effectiveDate: new Date().toISOString() }],
        }
        await addFamilyMember(newMember)
      }

      setIsMemberDialogOpen(false)
      setEditingMember(null)
    } catch(error) {
      // toast is handled in context
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
      if (!itemToDelete) return
      
      setIsSubmitting(true)
      try {
        if (itemToDelete.type === 'payout') {
          await deletePayout(itemToDelete.id)
        } else if (itemToDelete.type === 'member') {
          const hasPayouts = payouts.some(p => p.familyMemberId === itemToDelete.id)
          if (hasPayouts) {
            toast({
              variant: "destructive",
              title: "Cannot Delete Member",
              description: "This family member has existing payout records.",
            })
            setItemToDelete(null)
            return
          }
          await deleteFamilyMember(itemToDelete.id)
        }
      } catch (error) {
        // toast is handled in context
      } finally {
        setItemToDelete(null)
        setIsSubmitting(false)
      }
  }

  const getDeleteItemDescription = () => {
    if (!itemToDelete) return ""
    switch (itemToDelete.type) {
        case 'payout':
            return "This will permanently delete the payout record. This action cannot be undone."
        case 'member':
            return "This will permanently delete the family member and all their records. This action cannot be undone."
        default:
            return "This action cannot be undone."
    }
  }

  const familyMembersWithSummary = React.useMemo(() => {
    return familyMembers.map(member => {
      const expected = getEffectiveValue(member.expectedHistory, referenceDate)
      const memberPayoutsThisMonth = payouts.filter(p => p.familyMemberId === member.id && isSameMonth(new Date(p.date), selectedDate))
      const paid = memberPayoutsThisMonth.reduce((acc, p) => acc + p.amount, 0)
      const payable = expected - paid
      return {
        ...member,
        expected,
        paid,
        payable: payable > 0 ? payable : 0,
      }
    })
  }, [payouts, familyMembers, selectedDate, referenceDate])

  const summaryTotals = React.useMemo(() => {
    return {
        expected: familyMembersWithSummary.reduce((acc, m) => acc + m.expected, 0),
        paid: familyMembersWithSummary.reduce((acc, m) => acc + m.paid, 0),
        payable: familyMembersWithSummary.reduce((acc, m) => acc + m.payable, 0),
        cumulativePayable: familyMembersWithSummary.reduce((acc, m) => acc + m.cumulativePayable, 0)
    }
  }, [familyMembersWithSummary])
  
  const monthlyPayouts = React.useMemo(() => {
    return payouts
        .filter(payout => isSameMonth(new Date(payout.date), selectedDate))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [payouts, selectedDate])
  
  const totalMonthlyPayouts = React.useMemo(() => {
    return monthlyPayouts.reduce((acc, p) => acc + p.amount, 0)
  }, [monthlyPayouts])
  
  const totalExpectedPayout = React.useMemo(() => {
    return familyMembers.reduce((sum, m) => sum + getEffectiveValue(m.expectedHistory, referenceDate), 0)
  }, [familyMembers, referenceDate])

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Family Payments">
        <div className="flex gap-2">
            <Button size="sm" className="gap-1" onClick={() => openMemberDialog(null)}>
                <PlusCircle className="h-4 w-4" />
                Add Family Member
            </Button>
            <Button size="sm" className="gap-1" onClick={() => openPayoutDialog(null)}>
                <PlusCircle className="h-4 w-4" />
                Add Payout
            </Button>
        </div>
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
                <TableHead className="text-right">Paid<span className="hidden md:inline"> This Month</span></TableHead>
                <TableHead className="text-right"><span className="hidden md:inline">This Month </span>Payable</TableHead>
                <TableHead className="text-right hidden md:table-cell">Total Payable (All Time)</TableHead>
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
                  <TableCell className="text-right font-semibold hidden md:table-cell">৳{member.cumulativePayable.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
                <TableRow>
                    <TableCell className="font-bold">Total</TableCell>
                    <TableCell className="text-right font-bold">৳{summaryTotals.expected.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-bold">৳{summaryTotals.paid.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-bold">৳{summaryTotals.payable.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-bold hidden md:table-cell">৳{summaryTotals.cumulativePayable.toLocaleString()}</TableCell>
                </TableRow>
            </TableFooter>
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
                                            <DropdownMenuItem onSelect={() => openPayoutDialog(payout)}>Edit</DropdownMenuItem>
                                            <DropdownMenuItem onSelect={() => setItemToDelete({ type: 'payout', id: payout.id })} className="text-red-600">Delete</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                    <TableFooter>
                        <TableRow>
                            <TableCell colSpan={2} className="font-bold">Total</TableCell>
                            <TableCell className="text-right font-bold">৳{totalMonthlyPayouts.toLocaleString()}</TableCell>
                            <TableCell></TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            ) : (
                <div className="text-center text-muted-foreground p-8">No payouts this month.</div>
            )}
        </CardContent>
      </Card>

       <Card>
        <CardHeader>
          <CardTitle>Manage Family Members</CardTitle>
          <CardDescription>Add or edit family member details.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member Name</TableHead>
                <TableHead className="text-right">Expected Payout</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {familyMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell className="text-right">৳{getEffectiveValue(member.expectedHistory, referenceDate).toLocaleString()}</TableCell>
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
                        <DropdownMenuItem onSelect={() => openMemberDialog(member)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setItemToDelete({type: 'member', id: member.id})} className="text-red-600">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
                <TableRow>
                    <TableCell className="font-bold">Total</TableCell>
                    <TableCell className="text-right font-bold">৳{totalExpectedPayout.toLocaleString()}</TableCell>
                    <TableCell></TableCell>
                </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>
      
      {/* Add/Edit Payout Dialog */}
       <Dialog open={isPayoutDialogOpen} onOpenChange={setIsPayoutDialogOpen}>
          <DialogContent>
            <form onSubmit={handlePayoutSubmit}>
              <DialogHeader>
                <DialogTitle>{editingPayout ? "Edit Payout" : "Add Payout"}</DialogTitle>
                <DialogDescription>
                  {editingPayout ? "Update the details of this payout." : "Record a new payment made to a family member."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 items-start gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
                  <Label htmlFor="name" className="sm:text-right">
                    Member
                  </Label>
                  <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                    <SelectTrigger className="sm:col-span-3">
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
                <div className="grid grid-cols-1 items-start gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
                  <Label htmlFor="amount" className="sm:text-right">
                    Amount Paid
                  </Label>
                  <Input id="amount" type="number" className="sm:col-span-3" value={payoutAmount} onChange={(e) => setPayoutAmount(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" loading={isSubmitting}>Save Payout</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        
        {/* Add/Edit Member Dialog */}
        <Dialog open={isMemberDialogOpen} onOpenChange={setIsMemberDialogOpen}>
            <DialogContent>
              <form onSubmit={handleMemberSubmit}>
                <DialogHeader>
                  <DialogTitle>{editingMember ? "Edit Member" : "Add Member"}</DialogTitle>
                  <DialogDescription>
                    {editingMember ? "Update the details for this family member." : "Add a new family member."}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-1 items-start gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
                    <Label htmlFor="member-name" className="sm:text-right">
                      Name
                    </Label>
                    <Input id="member-name" className="sm:col-span-3" value={memberName} onChange={(e) => setMemberName(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-1 items-start gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
                    <Label htmlFor="member-expected" className="sm:text-right">
                      Expected Payout
                    </Label>
                    <Input id="member-expected" type="number" className="sm:col-span-3" value={memberExpected} onChange={(e) => setMemberExpected(e.target.value)} />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" loading={isSubmitting}>Save Member</Button>
                </DialogFooter>
              </form>
            </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      {getDeleteItemDescription()}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isSubmitting}>
                    {isSubmitting ? 'Deleting...' : 'Continue'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  )
}
