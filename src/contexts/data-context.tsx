
'use client'
import * as React from 'react'
import type { FamilyMember, Payout, UtilityBill, Expense, Room, Renter, RentPayment } from '@/lib/types'
import { getEffectiveValue, findRoomForRenter } from '@/lib/utils'
import { startOfMonth, isBefore, addMonths, isSameMonth, lastDayOfMonth } from 'date-fns'
import { useDate } from './date-context'
import { api } from '@/services/api'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from './language-context'

type AccessLevel = 'admin' | 'readonly';

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
  accessLevel: AccessLevel | null
  
  // Loading states
  isLoading: boolean
  isSyncing: boolean

  // Actions
  setAccessLevel: (level: AccessLevel) => void
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
        const accessLevel = localStorage.getItem('accessLevel')

        return {
            familyMembers: familyMembers ? JSON.parse(familyMembers) : [],
            payouts: payouts ? JSON.parse(payouts) : [],
            utilityBills: utilityBills ? JSON.parse(utilityBills) : [],
            otherExpenses: otherExpenses ? JSON.parse(otherExpenses) : [],
            rooms: rooms ? JSON.parse(rooms) : [],
            renters: renters ? JSON.parse(renters) : [],
            rentPayments: rentPayments ? JSON.parse(rentPayments) : [],
            initiationDate: initiationDate ? new Date(JSON.parse(initiationDate)) : new Date('2024-01-01'),
            accessLevel: accessLevel as AccessLevel | null,
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
  const { t } = useLanguage()
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSyncing, setIsSyncing] = React.useState(true)
  const [accessLevel, setAccessLevel] = React.useState<AccessLevel | null>(null)

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
        if (typeof window !== 'undefined' && !window.navigator.onLine) {
            toast({
                variant: "destructive",
                title: t('pinAuth.noInternetTitle'),
                description: t('pinAuth.noInternetDescription'),
            });
        } else {
            console.error("Sync failed:", error);
            localStorage.removeItem('pin');
            localStorage.removeItem('isPinAuthenticated');
            window.location.reload();
        }
    } finally {
        setIsSyncing(false);
    }
  }, [toast, t]);

  // Load from localStorage on mount, then sync with API
  React.useEffect(() => {
    const localData = getLocalData();
    if (localData) {
        setData({ ...localData, initiationDate: localData.initiationDate });
        if (localData.accessLevel) {
          setAccessLevel(localData.accessLevel);
        }
    }
    setIsLoading(false);
    
    if (localStorage.getItem('isPinAuthenticated') === 'true') {
        syncData();
    }
  }, [syncData]);

  const performApiAction = async (action: () => Promise<any>, successMessage: string) => {
      try {
          const freshData = await action();
          handleApiResponse(freshData);
          toast({ title: 'Success', description: successMessage });
      } catch (error: any) {
          if (error.message.includes('Read-only')) {
               toast({
                  variant: "destructive",
                  title: 'Permission Denied',
                  description: 'You are in read-only mode.',
              });
          } else if (typeof window !== 'undefined' && !window.navigator.onLine) {
              toast({
                  variant: "destructive",
                  title: t('pinAuth.noInternetTitle'),
                  description: t('pinAuth.noInternetDescriptionAction'),
              });
          } else {
              console.error("API Action Failed:", error);
              localStorage.removeItem('pin');
              localStorage.removeItem('isPinAuthenticated');
              window.location.reload();
          }
          throw error;
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
        return { ...member, cumulativePayable };
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
        return { ...renter, cumulativePayable };
    });

    return { ...data, familyMembers: processedFamilyMembers, renters: processedRenters };
  }, [data, selectedDate]);


  const value: DataContextType = {
    ...processedData,
    isLoading,
    isSyncing,
    accessLevel,
    setAccessLevel,
    syncData,

    // --- Actions ---
    addRenter: (newRenter) => performApiAction(() => api.addRenter({ id: `t${Date.now()}`, status: 'active', cumulativePayable: 0, ...newRenter }), t('toasts.renterAdded')),
    updateRenter: (renter) => performApiAction(() => api.updateRenter(renter), t('toasts.renterUpdated')),
    archiveRenter: (renter) => performApiAction(() => api.archiveRenter(renter), t('toasts.renterArchived')),

    addRoom: (newRoom) => performApiAction(() => api.addRoom({ id: `r${Date.now()}`, ...newRoom }), t('toasts.roomAdded')),
    updateRoom: (room) => performApiAction(() => api.updateRoom(room), t('toasts.roomUpdated')),
    deleteRoom: (id) => performApiAction(() => api.deleteRoom(id), t('toasts.roomDeleted')),

    addRentPayment: (newPayment) => performApiAction(() => api.addRentPayment({ id: `rp${Date.now()}`, ...newPayment }), t('toasts.rentPaymentAdded')),
    updateRentPayment: (payment) => performApiAction(() => api.updateRentPayment(payment), t('toasts.rentPaymentUpdated')),
    deleteRentPayment: (id) => performApiAction(() => api.deleteRentPayment(id), t('toasts.rentPaymentDeleted')),

    addFamilyMember: (newMember) => performApiAction(() => api.addFamilyMember({ id: `fm${Date.now()}`, cumulativePayable: 0, ...newMember }), t('toasts.familyMemberAdded')),
    updateFamilyMember: (member) => performApiAction(() => api.updateFamilyMember(member), t('toasts.familyMemberUpdated')),
    deleteFamilyMember: (id) => performApiAction(() => api.deleteFamilyMember(id), t('toasts.familyMemberDeleted')),

    addPayout: (newPayout) => performApiAction(() => api.addPayout({ id: `p${Date.now()}`, ...newPayout }), t('toasts.payoutAdded')),
    updatePayout: (payout) => performApiAction(() => api.updatePayout(payout), t('toasts.payoutUpdated')),
    deletePayout: (id) => performApiAction(() => api.deletePayout(id), t('toasts.payoutDeleted')),

    addUtilityBill: (newBill) => performApiAction(() => api.addUtilityBill({ id: `b${Date.now()}`, ...newBill }), t('toasts.utilityBillAdded')),
    updateUtilityBill: (bill) => performApiAction(() => api.updateUtilityBill(bill), t('toasts.utilityBillUpdated')),
    deleteUtilityBill: (id) => performApiAction(() => api.deleteUtilityBill(id), t('toasts.utilityBillDeleted')),

    addExpense: (newExpense) => performApiAction(() => api.addExpense({ id: `e${Date.now()}`, ...newExpense }), t('toasts.expenseAdded')),
    updateExpense: (expense) => performApiAction(() => api.updateExpense(expense), t('toasts.expenseUpdated')),
    deleteExpense: (id) => performApiAction(() => api.deleteExpense(id), t('toasts.expenseDeleted')),
    
    updateInitiationDate: (date: Date) => performApiAction(() => api.updateInitiationDate(date.toISOString()), t('toasts.initiationDateUpdated')),
    clearAllData: () => performApiAction(api.clearAllData, t('toasts.allDataCleared')),
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
