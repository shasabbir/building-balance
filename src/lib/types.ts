export interface FamilyMember {
  id: string
  name: string
  expectedHistory: { amount: number, effectiveDate: string }[]
  cumulativePayable: number
}

export interface Payout {
  id: string
  familyMemberId: string
  familyMemberName: string
  amount: number
  date: string
}

export interface UtilityBill {
  id: string
  type: 'Electricity' | 'Water' | 'Gas'
  date: string
  amount: number
  notes: string
}

export interface Expense {
  id:string
  date: string
  category: 'Household' | 'Maintenance' | 'Other'
  amount: number
  details: string
}

export interface Room {
  id: string
  number: string
  rentHistory: { amount: number, effectiveDate: string }[]
}

export interface Renter {
  id: string
  name: string
  occupancyHistory: { roomId: string | null; effectiveDate: string }[]
  status: 'active' | 'archived'
  cumulativePayable: number
}

export interface RentPayment {
  id: string
  renterId: string
  renterName: string
  roomNumber: string
  amount: number
  date: string
}
