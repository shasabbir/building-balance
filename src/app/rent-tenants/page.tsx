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
import type { Renter, RentPayment, Room } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useData } from "@/contexts/data-context"
import { useDate } from "@/contexts/date-context"
import { isSameMonth } from "date-fns"


export default function RentTenantsPage() {
  const { toast } = useToast()
  const { renters, setRenters, rentPayments, setRentPayments, rooms, setRooms } = useData()
  const { selectedDate } = useDate()
  
  // Dialog states
  const [isRenterDialogOpen, setIsRenterDialogOpen] = React.useState(false)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = React.useState(false)
  const [isRoomDialogOpen, setIsRoomDialogOpen] = React.useState(false)
  const [itemToDelete, setItemToDelete] = React.useState<{type: 'renter' | 'payment' | 'room', id: string} | null>(null)
  
  // Editing states
  const [editingRenter, setEditingRenter] = React.useState<Renter | null>(null)
  const [editingPayment, setEditingPayment] = React.useState<RentPayment | null>(null)
  const [editingRoom, setEditingRoom] = React.useState<Room | null>(null)

  // Renter form state
  const [renterName, setRenterName] = React.useState("")
  const [renterRoomId, setRenterRoomId] = React.useState("")
  const [renterRentDue, setRenterRentDue] = React.useState("")

  // Payment form state
  const [selectedTenantId, setSelectedTenantId] = React.useState("")
  const [paymentAmount, setPaymentAmount] = React.useState("")

  // Room form state
  const [roomNumber, setRoomNumber] = React.useState("")
  const [roomRentAmount, setRoomRentAmount] = React.useState("")

  const getRoomNumber = (roomId: string) => {
    return rooms.find(r => r.id === roomId)?.number || "N/A"
  }
  
  // --- Renter Logic ---
  const openRenterDialog = (renter: Renter | null) => {
    setEditingRenter(renter)
    if (renter) {
      setRenterName(renter.name)
      setRenterRoomId(renter.roomId)
      setRenterRentDue(renter.rentDue.toString())
    } else {
      setRenterName("")
      setRenterRoomId("")
      setRenterRentDue("")
    }
    setIsRenterDialogOpen(true)
  }

  const handleRenterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!renterName || !renterRoomId || !renterRentDue) return

    const renterData = {
      name: renterName,
      roomId: renterRoomId,
      rentDue: parseFloat(renterRentDue),
      cumulativePayable: editingRenter ? editingRenter.cumulativePayable : 0, // This could be recalculated
    }

    if (editingRenter) {
      setRenters(renters => renters.map(r => r.id === editingRenter.id ? { ...r, ...renterData } : r))
    } else {
      setRenters(prev => [{ id: `t${Date.now()}`, ...renterData }, ...prev])
    }
    setIsRenterDialogOpen(false)
  }

  // --- Payment Logic ---
  const openPaymentDialog = (payment: RentPayment | null) => {
    setEditingPayment(payment)
    if (payment) {
        setSelectedTenantId(payment.renterId)
        setPaymentAmount(payment.amount.toString())
    } else {
        setSelectedTenantId("")
        setPaymentAmount("")
    }
    setIsPaymentDialogOpen(true)
  }

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTenantId || !paymentAmount) return
    
    const renter = renters.find(r => r.id === selectedTenantId)
    if (!renter) return

    const paymentData = {
      renterId: selectedTenantId,
      renterName: renter.name,
      roomNumber: getRoomNumber(renter.roomId),
      amount: parseFloat(paymentAmount),
      date: new Date().toISOString(),
    }

    if (editingPayment) {
        setRentPayments(payments => payments.map(p => p.id === editingPayment.id ? { ...p, ...paymentData } : p))
    } else {
        setRentPayments(prev => [{ id: `rp${Date.now()}`, ...paymentData }, ...prev])
    }
    setIsPaymentDialogOpen(false)
  }

  // --- Room Logic ---
  const openRoomDialog = (room: Room | null) => {
    setEditingRoom(room)
    if (room) {
        setRoomNumber(room.number)
        setRoomRentAmount(room.rentAmount.toString())
    } else {
        setRoomNumber("")
        setRoomRentAmount("")
    }
    setIsRoomDialogOpen(true)
  }

  const handleRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!roomNumber || !roomRentAmount) return

    const roomData = {
        number: roomNumber,
        rentAmount: parseFloat(roomRentAmount),
    }

    if (editingRoom) {
        setRooms(rooms => rooms.map(r => r.id === editingRoom.id ? { ...r, ...roomData } : r))
    } else {
        setRooms(prev => [{ id: `r${Date.now()}`, ...roomData }, ...prev])
    }
    setIsRoomDialogOpen(false)
  }
  
  // --- Delete Logic ---
  const handleDelete = () => {
    if (!itemToDelete) return
    if (itemToDelete.type === 'renter') {
      // Also delete associated payments
      setRentPayments(payments => payments.filter(p => p.renterId !== itemToDelete.id))
      setRenters(renters => renters.filter(r => r.id !== itemToDelete.id))
    } else if (itemToDelete.type === 'payment') {
      setRentPayments(payments => payments.filter(p => p.id !== itemToDelete.id))
    } else if (itemToDelete.type === 'room') {
      const isOccupied = renters.some(r => r.roomId === itemToDelete.id)
      if (isOccupied) {
        toast({
          variant: "destructive",
          title: "Cannot Delete Room",
          description: "This room is currently occupied by a renter.",
        })
        setItemToDelete(null)
        return
      }
      setRooms(rooms => rooms.filter(r => r.id !== itemToDelete.id))
    }
    setItemToDelete(null)
  }

  const getDeleteItemDescription = () => {
    if (!itemToDelete) return ""
    switch (itemToDelete.type) {
        case 'renter':
            return "This will permanently delete the renter and all their associated payments. This action cannot be undone."
        case 'payment':
            return "This will permanently delete the rent payment record. This action cannot be undone."
        case 'room':
            return "This will permanently delete the room. This action cannot be undone."
        default:
            return "This action cannot be undone."
    }
}
  
  // --- Memoized Calculations ---
  const rentersWithSummary = React.useMemo(() => {
    return renters.map(renter => {
      const renterPaymentsThisMonth = rentPayments.filter(p => p.renterId === renter.id && isSameMonth(new Date(p.date), selectedDate))
      const rentPaidThisMonth = renterPaymentsThisMonth.reduce((acc, p) => acc + p.amount, 0)
      const payableThisMonth = renter.rentDue - rentPaidThisMonth
      return {
        ...renter,
        rentPaidThisMonth,
        payableThisMonth: payableThisMonth > 0 ? payableThisMonth : 0,
        // NOTE: Cumulative payable is not calculated dynamically from history
      }
    }).sort((a,b) => parseInt(getRoomNumber(a.roomId)) - parseInt(getRoomNumber(b.roomId)));
  }, [renters, rentPayments, rooms, selectedDate])
  
  const monthlyRentPayments = React.useMemo(() => {
      return rentPayments
        .filter(payment => isSameMonth(new Date(payment.date), selectedDate))
        .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [rentPayments, selectedDate])

  const sortedRooms = React.useMemo(() => {
    return [...rooms].sort((a,b) => parseInt(a.number) - parseInt(b.number));
  }, [rooms])

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Rent & Tenants">
        <div className="flex gap-2">
            <Button size="sm" className="gap-1" onClick={() => openRoomDialog(null)}>
              <PlusCircle className="h-4 w-4" />
              Add Room
            </Button>
           <Button size="sm" className="gap-1" onClick={() => openRenterDialog(null)}>
              <PlusCircle className="h-4 w-4" />
              Add Renter
            </Button>
            <Button size="sm" className="gap-1" onClick={() => openPaymentDialog(null)}>
              <PlusCircle className="h-4 w-4" />
              Add Rent Payment
            </Button>
        </div>
      </PageHeader>
      
      {/* Renters Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle>Rent Collection Status</CardTitle>
          <CardDescription>
            Monthly rent status for all tenants for the selected month.
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
                <TableHead className="text-right">Total Payable (All Time)</TableHead>
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
                  <TableCell className="text-right">৳{renter.rentPaidThisMonth.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    {renter.payableThisMonth > 0 ? (
                      <Badge variant="destructive">৳{renter.payableThisMonth.toLocaleString()}</Badge>
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
                        <DropdownMenuItem onSelect={() => openRenterDialog(renter)}>Edit Renter</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setItemToDelete({type: 'renter', id: renter.id})} className="text-red-600">Delete Renter</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Rent Payment History Table */}
      <Card>
        <CardHeader>
            <CardTitle>Rent Payment History for this Month</CardTitle>
            <CardDescription>Full list of all rent payments received this month.</CardDescription>
        </CardHeader>
        <CardContent>
            {monthlyRentPayments.length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Room</TableHead>
                            <TableHead>Renter</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead><span className="sr-only">Actions</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {monthlyRentPayments.map((payment) => (
                            <TableRow key={payment.id}>
                                <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                                <TableCell><Badge variant="outline">{payment.roomNumber}</Badge></TableCell>
                                <TableCell className="font-medium">{payment.renterName}</TableCell>
                                <TableCell className="text-right">৳{payment.amount.toLocaleString()}</TableCell>
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
                                            <DropdownMenuItem onSelect={() => openPaymentDialog(payment)}>Edit</DropdownMenuItem>
                                            <DropdownMenuItem onSelect={() => setItemToDelete({type: 'payment', id: payment.id})} className="text-red-600">Delete</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            ) : (
                <div className="text-center text-muted-foreground p-8">No rent payments this month.</div>
            )}
        </CardContent>
      </Card>

      {/* Rooms Table */}
      <Card>
        <CardHeader>
          <CardTitle>Manage Rooms</CardTitle>
          <CardDescription>
            Add, edit, or remove rooms in the building.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Room Number</TableHead>
                <TableHead>Occupant</TableHead>
                <TableHead className="text-right">Rent Amount</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRooms.map((room) => {
                const occupant = renters.find(r => r.roomId === room.id);
                return (
                    <TableRow key={room.id}>
                        <TableCell className="font-medium">{room.number}</TableCell>
                        <TableCell>{occupant ? occupant.name : <span className="text-muted-foreground">Vacant</span>}</TableCell>
                        <TableCell className="text-right">৳{room.rentAmount.toLocaleString()}</TableCell>
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
                                <DropdownMenuItem onSelect={() => openRoomDialog(room)}>Edit Room</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => setItemToDelete({type: 'room', id: room.id})} className="text-red-600">Delete Room</DropdownMenuItem>
                            </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                )})}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Renter Dialog */}
      <Dialog open={isRenterDialogOpen} onOpenChange={setIsRenterDialogOpen}>
          <DialogContent>
            <form onSubmit={handleRenterSubmit}>
              <DialogHeader>
                <DialogTitle>{editingRenter ? 'Edit Renter' : 'Add New Renter'}</DialogTitle>
                <DialogDescription>
                  {editingRenter ? 'Update the details for this renter.' : 'Add a new renter to a room.'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="renter-name" className="text-right">Name</Label>
                    <Input id="renter-name" value={renterName} onChange={(e) => setRenterName(e.target.value)} className="col-span-3" />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="room" className="text-right">Room</Label>
                    <Select value={renterRoomId} onValueChange={setRenterRoomId}>
                        <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select a room" />
                        </SelectTrigger>
                        <SelectContent>
                        {rooms.map((room) => {
                            const occupant = renters.find(r => r.roomId === room.id);
                            const isOccupiedByOther = occupant && occupant.id !== editingRenter?.id;
                            return (
                                <SelectItem key={room.id} value={room.id} disabled={isOccupiedByOther}>
                                    {room.number} {isOccupiedByOther ? `(Occupied by ${occupant.name})` : ''}
                                </SelectItem>
                            )
                        })}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="rent-due" className="text-right">Rent Due</Label>
                    <Input id="rent-due" type="number" value={renterRentDue} onChange={(e) => setRenterRentDue(e.target.value)} className="col-span-3" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Save Renter</Button>
              </DialogFooter>
            </form>
          </DialogContent>
      </Dialog>
      
      {/* Add/Edit Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DialogContent>
            <form onSubmit={handlePaymentSubmit}>
              <DialogHeader>
                <DialogTitle>{editingPayment ? 'Edit Rent Payment' : 'Add Rent Payment'}</DialogTitle>
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
                      {renters.map((renter) => (
                        <SelectItem key={renter.id} value={renter.id}>
                          {renter.name} ({getRoomNumber(renter.roomId)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="amount" className="text-right">
                    Amount Paid
                  </Label>
                  <Input id="amount" type="number" className="col-span-3" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Save Payment</Button>
              </DialogFooter>
            </form>
          </DialogContent>
      </Dialog>
      
      {/* Add/Edit Room Dialog */}
      <Dialog open={isRoomDialogOpen} onOpenChange={setIsRoomDialogOpen}>
          <DialogContent>
            <form onSubmit={handleRoomSubmit}>
              <DialogHeader>
                <DialogTitle>{editingRoom ? 'Edit Room' : 'Add New Room'}</DialogTitle>
                <DialogDescription>
                  {editingRoom ? 'Update the details for this room.' : 'Add a new room to the building.'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="room-number" className="text-right">Room No.</Label>
                    <Input id="room-number" value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="rent-amount" className="text-right">Rent Amount</Label>
                    <Input id="rent-amount" type="number" value={roomRentAmount} onChange={(e) => setRoomRentAmount(e.target.value)} className="col-span-3" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Save Room</Button>
              </DialogFooter>
            </form>
          </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
       <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {getDeleteItemDescription()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
