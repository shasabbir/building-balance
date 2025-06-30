
'use client'
import * as React from 'react'
import { familyMembers as initialFamilyMembers, payouts as initialPayouts, utilityBills as initialUtilityBills, otherExpenses as initialExpenses, renters as initialRenters, rooms as initialRooms, rentPayments as initialRentPayments } from "@/lib/data"
import type { FamilyMember, Payout, UtilityBill, Expense, Room, Renter, RentPayment } from '@/lib/types'
import { getEffectiveValue } from '@/lib/utils'
import { startOfMonth, isBefore, addMonths, isSameMonth } from 'date-fns'
import { useDate } from './date-context'

type DataContextType = {
  familyMembers: FamilyMember[]
  setFamilyMembers: React.Dispatch<React.SetStateAction<FamilyMember[]>>
  payouts: Payout[]
  setPayouts: React.Dispatch<React.SetStateAction<Payout[]>>
  utilityBills: UtilityBill[]
  setUtilityBills: React.Dispatch<React.SetStateAction<UtilityBill[]>>
  otherExpenses: Expense[]
  setOtherExpenses: React.Dispatch<React.SetStateAction<Expense[]>>
  rooms: Room[]
  setRooms: React.Dispatch<React.SetStateAction<Room[]>>
  renters: Renter[]
  setRenters: React.Dispatch<React.SetStateAction<Renter[]>>
  rentPayments: RentPayment[]
  setRentPayments: React.Dispatch<React.SetStateAction<RentPayment[]>>
  initiationDate: Date
  setInitiationDate: React.Dispatch<React.SetStateAction<Date>>
}

const DataContext = React.createContext<DataContextType | undefined>(undefined)

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { selectedDate } = useDate()
  const [isLoaded, setIsLoaded] = React.useState(false)

  // Initialize with default data
  const [familyMembers, setFamilyMembers] = React.useState<FamilyMember[]>(initialFamilyMembers)
  const [payouts, setPayouts] = React.useState<Payout[]>(initialPayouts)
  const [utilityBills, setUtilityBills] = React.useState<UtilityBill[]>(initialUtilityBills)
  const [otherExpenses, setOtherExpenses] = React.useState<Expense[]>(initialExpenses)
  const [rooms, setRooms] = React.useState<Room[]>(initialRooms)
  const [renters, setRenters] = React.useState<Renter[]>(initialRenters)
  const [rentPayments, setRentPayments] = React.useState<RentPayment[]>(initialRentPayments)
  const [initiationDate, setInitiationDate] = React.useState<Date>(new Date('2024-01-01'))

  // Load from localStorage on mount (client-side only)
  React.useEffect(() => {
    try {
        const storedFamilyMembers = localStorage.getItem('familyMembers');
        if (storedFamilyMembers) setFamilyMembers(JSON.parse(storedFamilyMembers));

        const storedPayouts = localStorage.getItem('payouts');
        if (storedPayouts) setPayouts(JSON.parse(storedPayouts));
        
        const storedUtilityBills = localStorage.getItem('utilityBills');
        if (storedUtilityBills) setUtilityBills(JSON.parse(storedUtilityBills));
        
        const storedOtherExpenses = localStorage.getItem('otherExpenses');
        if (storedOtherExpenses) setOtherExpenses(JSON.parse(storedOtherExpenses));
        
        const storedRooms = localStorage.getItem('rooms');
        if (storedRooms) setRooms(JSON.parse(storedRooms));
        
        const storedRenters = localStorage.getItem('renters');
        if (storedRenters) setRenters(JSON.parse(storedRenters));
        
        const storedRentPayments = localStorage.getItem('rentPayments');
        if (storedRentPayments) setRentPayments(JSON.parse(storedRentPayments));
        
        const storedInitiationDate = localStorage.getItem('initiationDate');
        if (storedInitiationDate) setInitiationDate(new Date(JSON.parse(storedInitiationDate)));

    } catch (error) {
        console.error("Failed to parse from localStorage", error);
    }
    setIsLoaded(true); // Mark as loaded after attempting to read from storage
  }, []);

  // Save to localStorage on change
  React.useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem('familyMembers', JSON.stringify(familyMembers));
        localStorage.setItem('payouts', JSON.stringify(payouts));
        localStorage.setItem('utilityBills', JSON.stringify(utilityBills));
        localStorage.setItem('otherExpenses', JSON.stringify(otherExpenses));
        localStorage.setItem('rooms', JSON.stringify(rooms));
        localStorage.setItem('renters', JSON.stringify(renters));
        localStorage.setItem('rentPayments', JSON.stringify(rentPayments));
        localStorage.setItem('initiationDate', JSON.stringify(initiationDate.toISOString()));
      } catch (error) {
        console.error("Failed to save to localStorage", error);
      }
    }
  }, [isLoaded, familyMembers, payouts, utilityBills, otherExpenses, rooms, renters, rentPayments, initiationDate]);
  
  const processedFamilyMembers = React.useMemo(() => {
    return familyMembers.map(member => {
        let cumulativePayable = 0;
        let currentDate = startOfMonth(initiationDate);

        // Loop from initiation month up to and including the selected month.
        while (isBefore(currentDate, selectedDate) || isSameMonth(currentDate, selectedDate)) {
            const expected = getEffectiveValue(member.expectedHistory, currentDate);
            const paid = payouts
                .filter(p => p.familyMemberId === member.id && isSameMonth(new Date(p.date), currentDate))
                .reduce((sum, p) => sum + p.amount, 0);
            cumulativePayable += (expected - paid);
            currentDate = addMonths(currentDate, 1);
        }
        return { ...member, cumulativePayable: cumulativePayable > 0 ? cumulativePayable : 0 };
    });
  }, [familyMembers, payouts, initiationDate, selectedDate]);

  const processedRenters = React.useMemo(() => {
    return renters.map(renter => {
        let cumulativePayable = 0;
        const room = rooms.find(r => r.id === renter.roomId);
        if (!room) return { ...renter, cumulativePayable: 0 };
        
        let currentDate = startOfMonth(initiationDate);

        // Loop from initiation month up to and including the selected month.
        while(isBefore(currentDate, selectedDate) || isSameMonth(currentDate, selectedDate)) {
            const expected = getEffectiveValue(room.rentHistory, currentDate);
            const paid = rentPayments
                .filter(p => p.renterId === renter.id && isSameMonth(new Date(p.date), currentDate))
                .reduce((sum, p) => sum + p.amount, 0);
            cumulativePayable += (expected - paid);
            currentDate = addMonths(currentDate, 1);
        }
        return { ...renter, cumulativePayable: cumulativePayable > 0 ? cumulativePayable : 0 };
    });
  }, [renters, rentPayments, rooms, initiationDate, selectedDate]);


  const value = {
    familyMembers: processedFamilyMembers, setFamilyMembers,
    payouts, setPayouts,
    utilityBills, setUtilityBills,
    otherExpenses, setOtherExpenses,
    rooms, setRooms,
    renters: processedRenters, setRenters,
    rentPayments, setRentPayments,
    initiationDate, setInitiationDate
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
