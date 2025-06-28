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
  const [familyMembers, setFamilyMembers] = React.useState(initialFamilyMembers)
  const [payouts, setPayouts] = React.useState(initialPayouts)
  const [utilityBills, setUtilityBills] = React.useState(initialUtilityBills)
  const [otherExpenses, setOtherExpenses] = React.useState(initialExpenses)
  const [rooms, setRooms] = React.useState(initialRooms)
  const [renters, setRenters] = React.useState(initialRenters)
  const [rentPayments, setRentPayments] = React.useState(initialRentPayments)

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
