
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
import { useLanguage } from "@/contexts/language-context"
import { isSameMonth, lastDayOfMonth, isAfter, isBefore, startOfMonth, subMonths, startOfDay } from "date-fns"
import { getEffectiveValue, findRoomForRenter, findOccupantForRoom } from "@/lib/utils"


export default function RentTenantsPage() {
  const { toast } = useToast()
  const { renters, rentPayments, rooms, addRenter, updateRenter, archiveRenter, addRoom, updateRoom, deleteRoom, addRentPayment, updateRentPayment, deleteRentPayment } = useData()
  const { selectedDate } = useDate()
  const { t } = useLanguage()
  
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Dialog states
  const [isRenterDialogOpen, setIsRenterDialogOpen] = React.useState(false)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = React.useState(false)
  const [isRoomDialogOpen, setIsRoomDialogOpen] = React.useState(false)
  
  const [itemToDelete, setItemToDelete] = React.useState<{type: 'payment' | 'room', id: string} | null>(null)
  const [itemToArchive, setItemToArchive] = React.useState<Renter | null>(null)
  
  // Editing states
  const [editingRenter, setEditingRenter] = React.useState<Renter | null>(null)
  const [editingPayment, setEditingPayment] = React.useState<RentPayment | null>(null)
  const [editingRoom, setEditingRoom] = React.useState<Room | null>(null)

  // Renter form state
  const [renterName, setRenterName] = React.useState("")
  const [renterRoomId, setRenterRoomId] = React.useState<string | null>(null)

  // Payment form state
  const [selectedTenantId, setSelectedTenantId] = React.useState("")
  const [paymentAmount, setPaymentAmount] = React.useState("")

  // Room form state
  const [roomNumber, setRoomNumber] = React.useState("")
  const [roomRentAmount, setRoomRentAmount] = React.useState("")

  const referenceDate = React.useMemo(() => (
    isSameMonth(selectedDate, new Date()) ? new Date() : lastDayOfMonth(selectedDate)
  ), [selectedDate]);

  const getRoomNumber = (roomId: string | null) => {
    if (!roomId) return "N/A"
    return rooms.find(r => r.id === roomId)?.number || "N/A"
  }
  
  // --- Renter Logic ---
  const openRenterDialog = (renter: Renter | null) => {
    setEditingRenter(renter)
    if (renter) {
      setRenterName(renter.name)
      const currentRoom = findRoomForRenter(renter, new Date())
      setRenterRoomId(currentRoom)
    } else {
      setRenterName("")
      setRenterRoomId(null)
    }
    setIsRenterDialogOpen(true)
  }

  const handleRenterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!renterName) return

    setIsSubmitting(true)
    try {
      const today = new Date().toISOString()
      const newRoomId = renterRoomId === '_NONE_' ? null : renterRoomId;

      if (newRoomId) {
          const occupant = findOccupantForRoom(newRoomId, new Date(), renters, true);
          if (occupant && occupant.id !== editingRenter?.id) {
              toast({
                  variant: "destructive",
                  title: t('rentAndTenants.roomOccupiedError'),
                  description: t('rentAndTenants.roomOccupiedErrorDesc', { roomNumber: getRoomNumber(newRoomId), name: occupant.name }),
              });
              setIsSubmitting(false);
              return;
          }
      }

      if (editingRenter) {
          const occupancyHistory = editingRenter.occupancyHistory || [];
          const lastEntry = occupancyHistory[occupancyHistory.length - 1];
          let updatedHistory = [...occupancyHistory];
          if (!lastEntry || lastEntry.roomId !== newRoomId) {
              updatedHistory.push({ roomId: newRoomId, effectiveDate: today });
          }
          await updateRenter({
              ...editingRenter,
              name: renterName,
              occupancyHistory: updatedHistory,
              status: 'active'
          });
      } else {
          await addRenter({
              name: renterName,
              occupancyHistory: [{ roomId: newRoomId, effectiveDate: today }],
          });
      }
      setIsRenterDialogOpen(false);
    } catch (error) {
      // Toast handled in context
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleArchiveRenter = async () => {
    if (!itemToArchive) return;
    setIsSubmitting(true)
    try {
      const archiveEffectiveDate = lastDayOfMonth(subMonths(new Date(), 1));
      await archiveRenter({
          ...itemToArchive,
          status: 'archived',
          occupancyHistory: [...itemToArchive.occupancyHistory, { roomId: null, effectiveDate: archiveEffectiveDate.toISOString() }]
      });
      setItemToArchive(null);
    } catch (error) {
       // Toast handled in context
    } finally {
      setIsSubmitting(false)
    }
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

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTenantId || !paymentAmount) return
    
    const renter = renters.find(r => r.id === selectedTenantId)
    if (!renter) return
    
    setIsSubmitting(true)
    try {
      if (editingPayment) {
          const paymentDate = new Date(editingPayment.date)
          const roomNumber = getRoomNumber(findRoomForRenter(renter, paymentDate))
          const paymentData = {
              ...editingPayment,
              renterId: selectedTenantId,
              renterName: renter.name,
              roomNumber: roomNumber,
              amount: parseFloat(paymentAmount),
          }
          await updateRentPayment(paymentData)
      } else {
          const now = new Date()
          const transactionDate = isSameMonth(selectedDate, now) ? now : lastDayOfMonth(selectedDate)
          const roomNumber = getRoomNumber(findRoomForRenter(renter, transactionDate))
          const paymentData = {
            renterId: selectedTenantId,
            renterName: renter.name,
            roomNumber: roomNumber,
            amount: parseFloat(paymentAmount),
            date: transactionDate.toISOString(),
          }
          await addRentPayment(paymentData)
      }
      setIsPaymentDialogOpen(false)
      setEditingPayment(null)
    } catch (error) {
      // toast handled in context
    } finally {
      setIsSubmitting(false)
    }
  }

  // --- Room Logic ---
  const openRoomDialog = (room: Room | null) => {
    setEditingRoom(room)
    if (room) {
        setRoomNumber(room.number)
        const currentRent = getEffectiveValue(room.rentHistory, new Date())
        setRoomRentAmount(currentRent.toString())
    } else {
        setRoomNumber("")
        setRoomRentAmount("")
    }
    setIsRoomDialogOpen(true)
  }

  const handleRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!roomNumber || !roomRentAmount) return

    setIsSubmitting(true)
    try {
      if (editingRoom) {
        const newRentAmount = parseFloat(roomRentAmount)
        const currentRentAmount = getEffectiveValue(editingRoom.rentHistory, new Date())
        
        let updatedHistory = [...editingRoom.rentHistory];

        if (newRentAmount !== currentRentAmount) {
            const today = new Date();
            const existingTodayIndex = updatedHistory.findIndex(
              (entry) => new Date(entry.effectiveDate).toDateString() === today.toDateString()
            );

            if (existingTodayIndex !== -1) {
              updatedHistory[existingTodayIndex].amount = newRentAmount;
            } else {
              updatedHistory.push({ amount: newRentAmount, effectiveDate: today.toISOString() });
            }
        }
        await updateRoom({
          ...editingRoom,
          number: roomNumber,
          rentHistory: updatedHistory,
        })
      } else {
          await addRoom({
              number: roomNumber,
              rentHistory: [{ amount: parseFloat(roomRentAmount), effectiveDate: new Date().toISOString() }],
          })
      }
      setIsRoomDialogOpen(false)
      setEditingRoom(null)
    } catch (error) {
      // toast handled in context
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // --- Delete Logic ---
  const handleDelete = async () => {
    if (!itemToDelete) return
    setIsSubmitting(true)
    try {
      if (itemToDelete.type === 'payment') {
        await deleteRentPayment(itemToDelete.id)
      } else if (itemToDelete.type === 'room') {
        const isOccupied = !!findOccupantForRoom(itemToDelete.id, new Date(), renters, true)
        if (isOccupied) {
          toast({
            variant: "destructive",
            title: t('rentAndTenants.cannotDeleteRoomError'),
            description: t('rentAndTenants.cannotDeleteRoomErrorDesc'),
          })
          setIsSubmitting(false);
          setItemToDelete(null);
          return
        }
        await deleteRoom(itemToDelete.id)
      }
    } catch (error) {
      // toast handled in context
    } finally {
      setItemToDelete(null)
      setIsSubmitting(false)
    }
  }

  const getDeleteItemDescription = () => {
    if (!itemToDelete) return ""
    switch (itemToDelete.type) {
        case 'payment':
            return t('rentAndTenants.deletePaymentDesc')
        case 'room':
            return t('rentAndTenants.deleteRoomDesc')
        default:
            return ""
    }
  }
  
  // --- Memoized Calculations ---
  const sortedRooms = React.useMemo(() => {
    return [...rooms].sort((a,b) => parseInt(a.number) - parseInt(b.number));
  }, [rooms]);
  
  const rentStatusSummary = React.useMemo(() => {
    const roomSummaries = sortedRooms.map(room => {
        const occupant = findOccupantForRoom(room.id, referenceDate, renters, false);
        
        if (occupant) {
            const rentDue = getEffectiveValue(room.rentHistory, referenceDate);
            const renterPaymentsThisMonth = rentPayments.filter(p => p.renterId === occupant.id && isSameMonth(new Date(p.date), selectedDate));
            const rentPaidThisMonth = renterPaymentsThisMonth.reduce((acc, p) => acc + p.amount, 0);
            const payableThisMonth = rentDue - rentPaidThisMonth;
            
            return {
                room,
                occupant,
                rentDue,
                rentPaidThisMonth,
                payableThisMonth: payableThisMonth,
            };
        }
        
        return { room, occupant: null, rentDue: 0, rentPaidThisMonth: 0, payableThisMonth: 0 };
    });

    const assignedRenterIds = new Set(roomSummaries.map(s => s.occupant?.id).filter(Boolean));

    const unassignedRentersInMonth = renters
      .filter(r => {
        if (assignedRenterIds.has(r.id)) return false;
        if (r.status !== 'active') return false; // Only active unassigned renters
        if (!r.occupancyHistory || r.occupancyHistory.length === 0) return false;

        const sortedHistory = [...r.occupancyHistory].sort((a, b) => new Date(a.effectiveDate).getTime() - new Date(b.effectiveDate).getTime());
        const tenancyStartDate = startOfDay(new Date(sortedHistory[0].effectiveDate));
        if (isAfter(tenancyStartDate, lastDayOfMonth(selectedDate))) return false;

        const moveOutEntry = sortedHistory.find(entry => entry.roomId === null);
        if (moveOutEntry && isBefore(startOfDay(new Date(moveOutEntry.effectiveDate)), startOfMonth(selectedDate))) return false;
        
        const roomForRenterThisMonth = findRoomForRenter(r, referenceDate);
        if (roomForRenterThisMonth) return false; // Already handled by roomSummaries

        return true;
      })
      .map(r => {
        const renterPaymentsThisMonth = rentPayments.filter(p => p.renterId === r.id && isSameMonth(new Date(p.date), selectedDate));
        const rentPaidThisMonth = renterPaymentsThisMonth.reduce((acc, p) => acc + p.amount, 0);
        return { room: null, occupant: r, rentDue: 0, rentPaidThisMonth: rentPaidThisMonth, payableThisMonth: -rentPaidThisMonth };
      });

    return [...roomSummaries, ...unassignedRentersInMonth];
  }, [sortedRooms, renters, rentPayments, selectedDate, referenceDate]);

  const rentStatusTotals = React.useMemo(() => {
    const rentDue = rentStatusSummary.reduce((acc, s) => acc + s.rentDue, 0)
    const rentPaidThisMonth = rentStatusSummary.reduce((acc, s) => acc + s.rentPaidThisMonth, 0)
    const payableThisMonth = rentStatusSummary.reduce((acc, s) => acc + s.payableThisMonth, 0)
    const cumulativePayable = rentStatusSummary.reduce((acc, s) => acc + (s.occupant?.cumulativePayable || 0), 0)
    return { rentDue, rentPaidThisMonth, payableThisMonth, cumulativePayable }
  }, [rentStatusSummary])

  const monthlyRentPayments = React.useMemo(() => {
      return rentPayments
        .filter(payment => isSameMonth(new Date(payment.date), selectedDate))
        .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [rentPayments, selectedDate]);
  
  const totalMonthlyRentPayments = React.useMemo(() => {
    return monthlyRentPayments.reduce((acc, p) => acc + p.amount, 0)
  }, [monthlyRentPayments])

  const activeRenters = React.useMemo(() => renters.filter(r => r.status === 'active'), [renters]);
  const archivedRenters = React.useMemo(() => renters.filter(r => r.status === 'archived'), [renters]);
  
  const eligibleRentersForPayment = React.useMemo(() => {
    return renters.filter(renter => {
      if (!renter.occupancyHistory || renter.occupancyHistory.length === 0) return false;
      
      const sortedHistory = [...renter.occupancyHistory].sort((a, b) => new Date(a.effectiveDate).getTime() - new Date(b.effectiveDate).getTime());
      const tenancyStartDate = startOfDay(new Date(sortedHistory[0].effectiveDate));

      if (isAfter(tenancyStartDate, lastDayOfMonth(selectedDate))) return false;
      
      const moveOutEntry = sortedHistory.find(entry => entry.roomId === null);
      if (moveOutEntry && isBefore(startOfDay(new Date(moveOutEntry.effectiveDate)), startOfMonth(selectedDate))) return false;
      
      return true;
    });
  }, [renters, selectedDate]);

  const totalApplicableRent = React.useMemo(() => {
    return sortedRooms.reduce((sum, room) => sum + getEffectiveValue(room.rentHistory, referenceDate), 0)
  }, [sortedRooms, referenceDate]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t('rentAndTenants.title')}>
        <div className="flex gap-2">
            <Button size="sm" className="gap-1" onClick={() => openRoomDialog(null)}>
              <PlusCircle className="h-4 w-4" />
              {t('rentAndTenants.addRoom')}
            </Button>
           <Button size="sm" className="gap-1" onClick={() => openRenterDialog(null)}>
              <PlusCircle className="h-4 w-4" />
              {t('rentAndTenants.addRenter')}
            </Button>
            <Button size="sm" className="gap-1" onClick={() => openPaymentDialog(null)}>
              <PlusCircle className="h-4 w-4" />
              {t('rentAndTenants.addRentPayment')}
            </Button>
        </div>
      </PageHeader>
      
      <Card>
        <CardHeader>
          <CardTitle>{t('rentAndTenants.statusByRoom')}</CardTitle>
          <CardDescription>
            {t('rentAndTenants.statusByRoomDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('common.room')}</TableHead>
                <TableHead>{t('common.renter')}</TableHead>
                <TableHead className="text-right">{t('rentAndTenants.rentDue')}</TableHead>
                <TableHead className="text-right">{t('common.paid')}</TableHead>
                <TableHead className="text-right"><span className="hidden md:inline">{t('common.thisMonth')} </span>{t('common.payable')}</TableHead>
                <TableHead className="text-right hidden md:table-cell">{t('familyPayments.totalPayableAllTime')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rentStatusSummary.map(({ room, occupant, rentDue, rentPaidThisMonth, payableThisMonth }) => (
                <TableRow key={room?.id || occupant?.id}>
                  <TableCell><Badge variant="secondary">{room ? room.number : t('rentAndTenants.unassigned')}</Badge></TableCell>
                  <TableCell className="font-medium">{occupant ? occupant.name : <span className="text-muted-foreground">{t('rentAndTenants.vacant')}</span>}</TableCell>
                  {occupant ? (
                    <>
                      <TableCell className="text-right">৳{rentDue?.toLocaleString()}</TableCell>
                      <TableCell className="text-right">৳{rentPaidThisMonth?.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        {payableThisMonth > 0 ? (
                          <Badge variant="success">৳{payableThisMonth.toLocaleString()}</Badge>
                        ) : payableThisMonth < 0 ? (
                          <Badge variant="destructive">৳{payableThisMonth.toLocaleString()}</Badge>
                        ) : (
                          <span>৳{payableThisMonth.toLocaleString()}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold hidden md:table-cell">
                        {occupant.cumulativePayable > 0 ? (
                            <Badge variant="success">৳{occupant.cumulativePayable.toLocaleString()}</Badge>
                        ) : occupant.cumulativePayable < 0 ? (
                            <Badge variant="destructive">৳{occupant.cumulativePayable.toLocaleString()}</Badge>
                        ) : (
                            <span>৳{occupant.cumulativePayable.toLocaleString()}</span>
                        )}
                      </TableCell>
                    </>
                  ) : (
                    <TableCell colSpan={4} className="text-center text-muted-foreground">{t('rentAndTenants.vacant')}</TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
                <TableRow>
                    <TableCell colSpan={2} className="font-bold">{t('common.total')}</TableCell>
                    <TableCell className="text-right font-bold">৳{rentStatusTotals.rentDue.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-bold">৳{rentStatusTotals.rentPaidThisMonth.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-bold">৳{rentStatusTotals.payableThisMonth.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-bold hidden md:table-cell">৳{rentStatusTotals.cumulativePayable.toLocaleString()}</TableCell>
                </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>{t('rentAndTenants.paymentHistory')}</CardTitle>
            <CardDescription>{t('rentAndTenants.paymentHistoryDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
            {monthlyRentPayments.length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('common.date')}</TableHead>
                            <TableHead className="hidden sm:table-cell">{t('common.room')}</TableHead>
                            <TableHead>{t('common.renter')}</TableHead>
                            <TableHead className="text-right">{t('common.amount')}</TableHead>
                            <TableHead><span className="sr-only">{t('common.actions')}</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {monthlyRentPayments.map((payment) => (
                            <TableRow key={payment.id}>
                                <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                                <TableCell className="hidden sm:table-cell"><Badge variant="outline">{payment.roomNumber}</Badge></TableCell>
                                <TableCell className="font-medium">{payment.renterName}</TableCell>
                                <TableCell className="text-right">৳{payment.amount.toLocaleString()}</TableCell>
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
                                            <DropdownMenuItem onSelect={() => openPaymentDialog(payment)}>{t('common.edit')}</DropdownMenuItem>
                                            <DropdownMenuItem onSelect={() => setItemToDelete({type: 'payment', id: payment.id})} className="text-red-600">{t('common.delete')}</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                    <TableFooter>
                        <TableRow>
                            <TableCell colSpan={3} className="font-bold">{t('common.total')}</TableCell>
                            <TableCell className="text-right font-bold">৳{totalMonthlyRentPayments.toLocaleString()}</TableCell>
                            <TableCell></TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            ) : (
                <div className="text-center text-muted-foreground p-8">{t('rentAndTenants.noRentPayments')}</div>
            )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('rentAndTenants.manageRoomsAndRenters')}</CardTitle>
          <CardDescription>
            {t('rentAndTenants.manageRoomsAndRentersDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-8">
           <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('rentAndTenants.roomNumber')}</TableHead>
                <TableHead>{t('rentAndTenants.occupant')}</TableHead>
                <TableHead className="text-right">{t('rentAndTenants.rentForMonth')}</TableHead>
                <TableHead>
                  <span className="sr-only">{t('common.actions')}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRooms.map((room) => {
                const occupant = findOccupantForRoom(room.id, referenceDate, renters, true);
                const applicableRent = getEffectiveValue(room.rentHistory, referenceDate);
                return (
                    <TableRow key={room.id}>
                        <TableCell className="font-medium">{room.number}</TableCell>
                        <TableCell>{occupant ? occupant.name : <span className="text-muted-foreground">{t('rentAndTenants.vacant')}</span>}</TableCell>
                        <TableCell className="text-right">৳{applicableRent.toLocaleString()}</TableCell>
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
                                <DropdownMenuItem onSelect={() => openRoomDialog(room)}>{t('rentAndTenants.editRoom')}</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => setItemToDelete({type: 'room', id: room.id})} className="text-red-600">{t('rentAndTenants.deleteRoom')}</DropdownMenuItem>
                            </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                )})}
            </TableBody>
            <TableFooter>
                <TableRow>
                    <TableCell colSpan={2} className="font-bold">{t('common.total')}</TableCell>
                    <TableCell className="text-right font-bold">৳{totalApplicableRent.toLocaleString()}</TableCell>
                    <TableCell></TableCell>
                </TableRow>
            </TableFooter>
          </Table>

          <div>
             <h3 className="text-lg font-semibold mb-2">{t('rentAndTenants.activeRenters')}</h3>
             <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>{t('common.renter')}</TableHead>
                        <TableHead>{t('rentAndTenants.currentRoom')}</TableHead>
                        <TableHead><span className="sr-only">{t('common.actions')}</span></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {activeRenters.map(renter => {
                        const currentRoomId = findRoomForRenter(renter, new Date());
                        return (
                            <TableRow key={renter.id}>
                                <TableCell className="font-medium">{renter.name}</TableCell>
                                <TableCell>{currentRoomId ? getRoomNumber(currentRoomId) : <span className="text-muted-foreground">{t('rentAndTenants.unassigned')}</span>}</TableCell>
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
                                            <DropdownMenuItem onSelect={() => openRenterDialog(renter)}>{t('rentAndTenants.editRenter')}</DropdownMenuItem>
                                            <DropdownMenuItem onSelect={() => setItemToArchive(renter)} className="text-red-600">{t('rentAndTenants.archiveRenter')}</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
             </Table>
          </div>

           <div>
             <h3 className="text-lg font-semibold mb-2">{t('rentAndTenants.archivedRenters')}</h3>
             <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>{t('common.renter')}</TableHead>
                        <TableHead><span className="sr-only">{t('common.actions')}</span></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {archivedRenters.length > 0 ? archivedRenters.map(renter => (
                        <TableRow key={renter.id}>
                            <TableCell className="font-medium text-muted-foreground">{renter.name}</TableCell>
                            <TableCell>
                                <Button variant="outline" size="sm" onClick={() => openRenterDialog(renter)}>{t('rentAndTenants.reactivate')}</Button>
                            </TableCell>
                        </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={2} className="text-center text-muted-foreground p-8">{t('rentAndTenants.noArchivedRenters')}</TableCell>
                        </TableRow>
                    )}
                </TableBody>
             </Table>
          </div>
        </CardContent>
      </Card>


      {/* Add/Edit Renter Dialog */}
      <Dialog open={isRenterDialogOpen} onOpenChange={setIsRenterDialogOpen}>
          <DialogContent>
            <form onSubmit={handleRenterSubmit}>
              <DialogHeader>
                <DialogTitle>{editingRenter ? t('rentAndTenants.dialogEditRenterTitle') : t('rentAndTenants.dialogAddRenterTitle')}</DialogTitle>
                <DialogDescription>
                  {editingRenter ? t('rentAndTenants.dialogEditRenterDesc') : t('rentAndTenants.dialogAddRenterDesc')}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                 <div className="grid grid-cols-1 items-start gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
                    <Label htmlFor="renter-name" className="sm:text-right">{t('common.name')}</Label>
                    <Input id="renter-name" value={renterName} onChange={(e) => setRenterName(e.target.value)} className="sm:col-span-3" />
                </div>
                 <div className="grid grid-cols-1 items-start gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
                    <Label htmlFor="room" className="sm:text-right">{t('common.room')}</Label>
                    <Select value={renterRoomId ?? '_NONE_'} onValueChange={setRenterRoomId}>
                        <SelectTrigger className="sm:col-span-3">
                            <SelectValue placeholder={t('rentAndTenants.selectRoom')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="_NONE_">{t('rentAndTenants.noneUnassigned')}</SelectItem>
                            {rooms.map((room) => {
                                const occupant = findOccupantForRoom(room.id, new Date(), renters, true);
                                const isOccupiedByOther = occupant && occupant.id !== editingRenter?.id;
                                return (
                                    <SelectItem key={room.id} value={room.id} disabled={isOccupiedByOther}>
                                        {room.number} {isOccupiedByOther ? `(${t('rentAndTenants.occupiedBy', {name: occupant.name})})` : ''}
                                    </SelectItem>
                                )
                            })}
                        </SelectContent>
                    </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" loading={isSubmitting}>{editingRenter ? t('common.save') : t('common.add')}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
      </Dialog>
      
      {/* Add/Edit Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DialogContent>
            <form onSubmit={handlePaymentSubmit}>
              <DialogHeader>
                <DialogTitle>{editingPayment ? t('rentAndTenants.dialogEditPaymentTitle') : t('rentAndTenants.dialogAddPaymentTitle')}</DialogTitle>
                <DialogDescription>
                  {t('rentAndTenants.dialogAddPaymentDesc')}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 items-start gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
                  <Label htmlFor="tenant" className="sm:text-right">
                    {t('rentAndTenants.tenant')}
                  </Label>
                  <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
                    <SelectTrigger className="sm:col-span-3">
                      <SelectValue placeholder={t('rentAndTenants.selectTenant')} />
                    </SelectTrigger>
                    <SelectContent>
                      {eligibleRentersForPayment.map((renter) => (
                        <SelectItem key={renter.id} value={renter.id}>
                          {renter.name} ({getRoomNumber(findRoomForRenter(renter, referenceDate))})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 items-start gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
                  <Label htmlFor="amount" className="sm:text-right">
                    {t('familyPayments.amountPaid')}
                  </Label>
                  <Input id="amount" type="number" className="sm:col-span-3" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" loading={isSubmitting}>{editingPayment ? t('common.save') : t('common.add')}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
      </Dialog>
      
      {/* Add/Edit Room Dialog */}
      <Dialog open={isRoomDialogOpen} onOpenChange={setIsRoomDialogOpen}>
          <DialogContent>
            <form onSubmit={handleRoomSubmit}>
              <DialogHeader>
                <DialogTitle>{editingRoom ? t('rentAndTenants.dialogEditRoomTitle') : t('rentAndTenants.dialogAddRoomTitle')}</DialogTitle>
                <DialogDescription>
                  {editingRoom ? t('rentAndTenants.dialogEditRoomDesc') : t('rentAndTenants.dialogAddRoomDesc')}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                 <div className="grid grid-cols-1 items-start gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
                    <Label htmlFor="room-number" className="sm:text-right">{t('rentAndTenants.roomNumber')}</Label>
                    <Input id="room-number" value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} className="sm:col-span-3" />
                </div>
                <div className="grid grid-cols-1 items-start gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
                    <Label htmlFor="rent-amount" className="sm:text-right">{t('common.amount')}</Label>
                    <Input id="rent-amount" type="number" value={roomRentAmount} onChange={(e) => setRoomRentAmount(e.target.value)} className="sm:col-span-3" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" loading={isSubmitting}>{editingRoom ? t('common.save') : t('common.add')}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
      </Dialog>
      
      {/* Archive Confirmation Dialog */}
       <AlertDialog open={!!itemToArchive} onOpenChange={() => setItemToArchive(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('rentAndTenants.archiveDialogTitle', { name: itemToArchive?.name })}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('rentAndTenants.archiveDialogDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchiveRenter} disabled={isSubmitting}>
              {isSubmitting ? t('rentAndTenants.archiving') : t('common.continue')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
       <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.areYouSure')}</AlertDialogTitle>
            <AlertDialogDescription>
              {getDeleteItemDescription()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting ? t('common.deleting') : t('common.continue')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
