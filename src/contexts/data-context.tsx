
'use client'
import * as React from 'react'
import type { FamilyMember, Payout, UtilityBill, Expense, Room, Renter, RentPayment } from '@/lib/types'
import { getEffectiveValue, findRoomForRenter } from '@/lib/utils'
import { startOfMonth, isBefore, addMonths, isSameMonth, lastDayOfMonth } from 'date-fns'
import { useDate } from './date-context'
import { api } from '@/services/api'
import { useToast } from '@/hooks/use-toast'

type DataContextType = {
  // State
  familyMembers: FamilyMember[]
  payouts: Payout[]
  utilityBills: UtilityBill[]
  otherExpenses: Expense[]
  rooms: Room[]
  renters: Renter[]
  rentPayments: RentPayment[]
  initiationDate: Date
  
  // Loading states
  isLoading: boolean
  isSyncing: boolean

  // Actions
  addRenter: (data: Omit<Renter, 'id' | 'cumulativePayable' | 'status'>) => Promise<void>
  updateRenter: (data: Renter) => Promise<void>
  archiveRenter: (data: Renter) => Promise<void>

  addRoom: (data: Omit<Room, 'id'>) => Promise<void>
  updateRoom: (data: Room) => Promise<void>
  deleteRoom: (id: string) => Promise<void>
  
  addRentPayment: (data: Omit<RentPayment, 'id'>) => Promise<void>
  updateRentPayment: (data: RentPayment) => Promise<void>
  deleteRentPayment: (id: string) => Promise<void>

  addFamilyMember: (data: Omit<FamilyMember, 'id' | 'cumulativePayable'>) => Promise<void>
  updateFamilyMember: (data: FamilyMember) => Promise<void>
  deleteFamilyMember: (id: string) => Promise<void>

  addPayout: (data: Omit<Payout, 'id'>) => Promise<void>
  updatePayout: (data: Payout) => Promise<void>
  deletePayout: (id: string) => Promise<void>

  addUtilityBill: (data: Omit<UtilityBill, 'id'>) => Promise<void>
  updateUtilityBill: (data: UtilityBill) => Promise<void>
  deleteUtilityBill: (id: string) => Promise<void>
  
  addExpense: (data: Omit<Expense, 'id'>) => Promise<void>
  updateExpense: (data: Expense) => Promise<void>
  deleteExpense: (id: string) => Promise<void>

  updateInitiationDate: (date: Date) => Promise<void>
  clearAllData: () => Promise<void>
  syncData: () => Promise<void>
}

const DataContext = React.createContext<DataContextType | undefined>(undefined)

// Helper to get all data from local storage
const getLocalData = () => {
    try {
        const familyMembers = localStorage.getItem('familyMembers')
        const payouts = localStorage.getItem('payouts')
        const utilityBills = localStorage.getItem('utilityBills')
        const otherExpenses = localStorage.getItem('otherExpenses')
        const rooms = localStorage.getItem('rooms')
        const renters = localStorage.getItem('renters')
        const rentPayments = localStorage.getItem('rentPayments')
        const initiationDate = localStorage.getItem('initiationDate')

        return {
            familyMembers: familyMembers ? JSON.parse(familyMembers) : [],
            payouts: payouts ? JSON.parse(payouts) : [],
            utilityBills: utilityBills ? JSON.parse(utilityBills) : [],
            otherExpenses: otherExpenses ? JSON.parse(otherExpenses) : [],
            rooms: rooms ? JSON.parse(rooms) : [],
            renters: renters ? JSON.parse(renters) : [],
            rentPayments: rentPayments ? JSON.parse(rentPayments) : [],
            initiationDate: initiationDate ? new Date(JSON.parse(initiationDate)) : new Date('2024-01-01'),
        }
    } catch (e) {
        return null
    }
}

// Helper to set all data to local storage
const setLocalData = (data: Omit<AllData, 'initiationDate'> & {initiationDate: string | Date}) => {
    localStorage.setItem('familyMembers', JSON.stringify(data.familyMembers || []));
    localStorage.setItem('payouts', JSON.stringify(data.payouts || []));
    localStorage.setItem('utilityBills', JSON.stringify(data.utilityBills || []));
    localStorage.setItem('otherExpenses', JSON.stringify(data.otherExpenses || []));
    localStorage.setItem('rooms', JSON.stringify(data.rooms || []));
    localStorage.setItem('renters', JSON.stringify(data.renters || []));
    localStorage.setItem('rentPayments', JSON.stringify(data.rentPayments || []));
    localStorage.setItem('initiationDate', JSON.stringify(data.initiationDate instanceof Date ? data.initiationDate.toISOString() : data.initiationDate));
}

type AllData = {
    familyMembers: FamilyMember[],
    payouts: Payout[],
    utilityBills: UtilityBill[],
    otherExpenses: Expense[],
    rooms: Room[],
    renters: Renter[],
    rentPayments: RentPayment[],
    initiationDate: Date
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast()
  const { selectedDate } = useDate()
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSyncing, setIsSyncing] = React.useState(true)

  const [data, setData] = React.useState<AllData>({
    familyMembers: [],
    payouts: [],
    utilityBills: [],
    otherExpenses: [],
    rooms: [],
    renters: [],
    rentPayments: [],
    initiationDate: new Date('2024-01-01'),
  })

  const handleApiResponse = (apiData: any) => {
    const newData = {
        ...apiData,
        initiationDate: new Date(apiData.initiationDate),
    };
    setData(newData);
    setLocalData(newData);
  }

  const syncData = React.useCallback(async () => {
    setIsSyncing(true);
    try {
        const freshData = await api.sync();
        handleApiResponse(freshData);
    } catch (error) {
        console.error("Sync failed:", error);
        toast({ variant: 'destructive', title: 'Sync Failed', description: "Could not connect to the server. Displaying local data." })
    } finally {
        setIsSyncing(false);
    }
  }, [toast]);

  // Load from localStorage on mount, then sync with API
  React.useEffect(() => {
    const localData = getLocalData();
    if (localData) {
        setData(localData);
    }
    setIsLoading(false);
    syncData();
  }, [syncData]);

  const performApiAction = async (action: () => Promise<any>, successMessage: string) => {
      try {
          const freshData = await action();
          handleApiResponse(freshData);
          toast({ title: 'Success', description: successMessage });
      } catch (error) {
          console.error("API Action Failed:", error);
          
          // The API service itself handles the specific "Authentication failed" error by reloading the page.
          // This catch block handles all other errors (e.g., network issues, other server errors).
          // As requested, any failure during a data modification action will prompt for the PIN again
          // to ensure the session is valid.
          localStorage.removeItem('pin');
          localStorage.removeItem('isPinAuthenticated');
          window.location.reload();
      }
  };

  // Memoized processed data
  const processedData = React.useMemo(() => {
    const { renters, familyMembers, payouts, rentPayments, rooms, initiationDate } = data;

    const processedFamilyMembers = familyMembers.map(member => {
        let cumulativePayable = 0;
        let currentDate = startOfMonth(initiationDate);
        while (isBefore(currentDate, selectedDate) || isSameMonth(currentDate, selectedDate)) {
            const referenceDate = lastDayOfMonth(currentDate);
            const expected = getEffectiveValue(member.expectedHistory, referenceDate);
            const paid = payouts.filter(p => p.familyMemberId === member.id && isSameMonth(new Date(p.date), currentDate)).reduce((sum, p) => sum + p.amount, 0);
            cumulativePayable += (expected - paid);
            currentDate = addMonths(currentDate, 1);
        }
        return { ...member, cumulativePayable: cumulativePayable > 0 ? cumulativePayable : 0 };
    });

    const processedRenters = renters.map(renter => {
        let cumulativePayable = 0;
        let currentDate = startOfMonth(initiationDate);
        while (isBefore(currentDate, selectedDate) || isSameMonth(currentDate, selectedDate)) {
            const referenceDate = lastDayOfMonth(currentDate);
            const roomId = findRoomForRenter(renter, referenceDate);
            const room = rooms.find(r => r.id === roomId);
            const expected = room ? getEffectiveValue(room.rentHistory, referenceDate) : 0;
            const paid = rentPayments.filter(p => p.renterId === renter.id && isSameMonth(new Date(p.date), currentDate)).reduce((sum, p) => sum + p.amount, 0);
            cumulativePayable += (expected - paid);
            currentDate = addMonths(currentDate, 1);
        }
        return { ...renter, cumulativePayable: cumulativePayable > 0 ? cumulativePayable : 0 };
    });

    return { ...data, familyMembers: processedFamilyMembers, renters: processedRenters };
  }, [data, selectedDate]);


  const value: DataContextType = {
    ...processedData,
    isLoading,
    isSyncing,
    syncData,

    // --- Actions ---
    addRenter: (newRenter) => performApiAction(() => api.addRenter({ id: `t${Date.now()}`, status: 'active', cumulativePayable: 0, ...newRenter }), "Renter added successfully."),
    updateRenter: (renter) => performApiAction(() => api.updateRenter(renter), "Renter updated successfully."),
    archiveRenter: (renter) => performApiAction(() => api.archiveRenter(renter), "Renter archived successfully."),

    addRoom: (newRoom) => performApiAction(() => api.addRoom({ id: `r${Date.now()}`, ...newRoom }), "Room added successfully."),
    updateRoom: (room) => performApiAction(() => api.updateRoom(room), "Room updated successfully."),
    deleteRoom: (id) => performApiAction(() => api.deleteRoom(id), "Room deleted successfully."),

    addRentPayment: (newPayment) => performApiAction(() => api.addRentPayment({ id: `rp${Date.now()}`, ...newPayment }), "Rent payment added successfully."),
    updateRentPayment: (payment) => performApiAction(() => api.updateRentPayment(payment), "Rent payment updated successfully."),
    deleteRentPayment: (id) => performApiAction(() => api.deleteRentPayment(id), "Rent payment deleted successfully."),

    addFamilyMember: (newMember) => performApiAction(() => api.addFamilyMember({ id: `fm${Date.now()}`, cumulativePayable: 0, ...newMember }), "Family member added successfully."),
    updateFamilyMember: (member) => performApiAction(() => api.updateFamilyMember(member), "Family member updated successfully."),
    deleteFamilyMember: (id) => performApiAction(() => api.deleteFamilyMember(id), "Family member deleted successfully."),

    addPayout: (newPayout) => performApiAction(() => api.addPayout({ id: `p${Date.now()}`, ...newPayout }), "Payout added successfully."),
    updatePayout: (payout) => performApiAction(() => api.updatePayout(payout), "Payout updated successfully."),
    deletePayout: (id) => performApiAction(() => api.deletePayout(id), "Payout deleted successfully."),

    addUtilityBill: (newBill) => performApiAction(() => api.addUtilityBill({ id: `b${Date.now()}`, ...newBill }), "Utility bill added successfully."),
    updateUtilityBill: (bill) => performApiAction(() => api.updateUtilityBill(bill), "Utility bill updated successfully."),
    deleteUtilityBill: (id) => performApiAction(() => api.deleteUtilityBill(id), "Utility bill deleted successfully."),

    addExpense: (newExpense) => performApiAction(() => api.addExpense({ id: `e${Date.now()}`, ...newExpense }), "Expense added successfully."),
    updateExpense: (expense) => performApiAction(() => api.updateExpense(expense), "Expense updated successfully."),
    deleteExpense: (id) => performApiAction(() => api.deleteExpense(id), "Expense deleted successfully."),
    
    updateInitiationDate: (date: Date) => performApiAction(() => api.updateInitiationDate(date.toISOString()), "Initiation date updated."),
    clearAllData: () => performApiAction(api.clearAllData, "All application data has been reset."),
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const context = React.useContext(DataContext)
  if (!context) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}
