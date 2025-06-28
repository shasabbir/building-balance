'use client'
import * as React from 'react'
import { familyMembers as initialFamilyMembers, payouts as initialPayouts, utilityBills as initialUtilityBills, otherExpenses as initialExpenses, renters as initialRenters, rooms as initialRooms, rentPayments as initialRentPayments } from "@/lib/data"
import type { FamilyMember, Payout, UtilityBill, Expense, Room, Renter, RentPayment } from '@/lib/types'

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
}

const DataContext = React.createContext<DataContextType | undefined>(undefined)

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = React.useState(false)

  // Initialize with default data
  const [familyMembers, setFamilyMembers] = React.useState(initialFamilyMembers)
  const [payouts, setPayouts] = React.useState(initialPayouts)
  const [utilityBills, setUtilityBills] = React.useState(initialUtilityBills)
  const [otherExpenses, setOtherExpenses] = React.useState(initialExpenses)
  const [rooms, setRooms] = React.useState(initialRooms)
  const [renters, setRenters] = React.useState(initialRenters)
  const [rentPayments, setRentPayments] = React.useState(initialRentPayments)

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

    } catch (error) {
        console.error("Failed to parse from localStorage", error);
    }
    setIsLoaded(true); // Mark as loaded after attempting to read from storage
  }, []);

  // Save to localStorage on change
  React.useEffect(() => {
    // We only save to localStorage if the data has been loaded from it first
    // This prevents wiping localStorage with initial data on the first render.
    if (isLoaded) {
      try {
        localStorage.setItem('familyMembers', JSON.stringify(familyMembers));
        localStorage.setItem('payouts', JSON.stringify(payouts));
        localStorage.setItem('utilityBills', JSON.stringify(utilityBills));
        localStorage.setItem('otherExpenses', JSON.stringify(otherExpenses));
        localStorage.setItem('rooms', JSON.stringify(rooms));
        localStorage.setItem('renters', JSON.stringify(renters));
        localStorage.setItem('rentPayments', JSON.stringify(rentPayments));
      } catch (error) {
        console.error("Failed to save to localStorage", error);
      }
    }
  }, [isLoaded, familyMembers, payouts, utilityBills, otherExpenses, rooms, renters, rentPayments]);


  const value = {
    familyMembers, setFamilyMembers,
    payouts, setPayouts,
    utilityBills, setUtilityBills,
    otherExpenses, setOtherExpenses,
    rooms, setRooms,
    renters, setRenters,
    rentPayments, setRentPayments
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
