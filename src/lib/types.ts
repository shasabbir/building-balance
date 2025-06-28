export interface FamilyMember {
  id: string
  name: string
  expected: number
  paid: number
  payable: number
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
  id: string
  date: string
  category: 'Household' | 'Maintenance' | 'Other'
  amount: number
  details: string
}

export interface Room {
  id: string
  number: string
  rentAmount: number
}

export interface Renter {
  id: string
  name: string
  roomId: string
  rentDue: number
  rentPaid: number
  payable: number
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
