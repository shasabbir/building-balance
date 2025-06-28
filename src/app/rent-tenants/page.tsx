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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageHeader } from "@/components/page-header"
import { renters as initialRenters, rooms, rentPayments as initialRentPayments } from "@/lib/data"
import type { RentPayment } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const getRoomNumber = (roomId: string) => {
  return rooms.find(r => r.id === roomId)?.number || "N/A"
}

export default function RentTenantsPage() {
  const [rentPayments, setRentPayments] = React.useState<RentPayment[]>(initialRentPayments)
  const [selectedTenantId, setSelectedTenantId] = React.useState("")
  const [amount, setAmount] = React.useState("")
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTenantId || !amount) return
    
    const renter = initialRenters.find(r => r.id === selectedTenantId)
    if (!renter) return

    const newPayment: RentPayment = {
      id: `rp${Date.now()}`,
      renterId: selectedTenantId,
      renterName: renter.name,
      roomNumber: getRoomNumber(renter.roomId),
      amount: parseFloat(amount),
      date: new Date().toISOString(),
    }
    setRentPayments(prev => [newPayment, ...prev])
    setSelectedTenantId("")
    setAmount("")
    setIsDialogOpen(false)
  }
  
  const rentersWithSummary = React.useMemo(() => {
    return initialRenters.map(renter => {
      const renterPayments = rentPayments.filter(p => p.renterId === renter.id)
      const rentPaid = renterPayments.reduce((acc, p) => acc + p.amount, 0)
      const payable = renter.rentDue - rentPaid
      return {
        ...renter,
        rentPaid,
        payable: payable > 0 ? payable : 0,
        // NOTE: Cumulative payable is not calculated dynamically from history in this implementation
      }
    })
  }, [rentPayments])
  
  const sortedRentPayments = React.useMemo(() => {
      return [...rentPayments].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [rentPayments])

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Rent & Tenants">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <PlusCircle className="h-4 w-4" />
              Add Rent Payment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Add Rent Payment</DialogTitle>
                <DialogDescription>
                  Record a new rent payment from a tenant.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="tenant" className="text-right">
                    Tenant
                  </Label>
                  <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a tenant" />
                    </SelectTrigger>
                    <SelectContent>
                      {initialRenters.map((renter) => (
                        <SelectItem key={renter.id} value={renter.id}>
                          {renter.name}
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
                <Button type="submit">Save Payment</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>Rent Collection Status</CardTitle>
          <CardDescription>
            Monthly rent status for all tenants.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Room</TableHead>
                <TableHead>Renter</TableHead>
                <TableHead className="text-right">Rent Due</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">This Month Payable</TableHead>
                <TableHead className="text-right">Total Payable</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rentersWithSummary.map((renter) => (
                <TableRow key={renter.id}>
                  <TableCell><Badge variant="secondary">{getRoomNumber(renter.roomId)}</Badge></TableCell>
                  <TableCell className="font-medium">{renter.name}</TableCell>
                  <TableCell className="text-right">৳{renter.rentDue.toLocaleString()}</TableCell>
                  <TableCell className="text-right">৳{renter.rentPaid.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    {renter.payable > 0 ? (
                      <Badge variant="destructive">৳{renter.payable.toLocaleString()}</Badge>
                    ) : (
                      '৳0'
                    )}
                  </TableCell>
                  <TableCell className="text-right font-semibold">৳{renter.cumulativePayable.toLocaleString()}</TableCell>
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
                        <DropdownMenuItem>Edit Renter</DropdownMenuItem>
                        <DropdownMenuItem>View Payment History</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>Rent Payment History</CardTitle>
            <CardDescription>Full list of all rent payments received.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Room</TableHead>
                        <TableHead>Renter</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedRentPayments.map((payment) => (
                        <TableRow key={payment.id}>
                            <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                            <TableCell><Badge variant="outline">{payment.roomNumber}</Badge></TableCell>
                            <TableCell className="font-medium">{payment.renterName}</TableCell>
                            <TableCell className="text-right">৳{payment.amount.toLocaleString()}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  )
}
