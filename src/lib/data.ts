import { FamilyMember, UtilityBill, Expense, Renter, Room } from "./types"

export const familyMembers: FamilyMember[] = [
  { id: "1", name: "Sabbir", expected: 10000, paid: 10000, payable: 0, cumulativePayable: 0 },
  { id: "2", name: "Sumon", expected: 10000, paid: 8000, payable: 2000, cumulativePayable: 5000 },
  { id: "3", name: "Juel", expected: 12000, paid: 12000, payable: 0, cumulativePayable: 0 },
  { id: "4", name: "Suma", expected: 5000, paid: 5000, payable: 0, cumulativePayable: 1000 },
  { id: "5", name: "Bibi Howa", expected: 8000, paid: 8000, payable: 0, cumulativePayable: 0 },
]

export const utilityBills: UtilityBill[] = [
  { id: "b1", type: "Electricity", date: "2024-07-15", amount: 2500, notes: "June Bill" },
  { id: "b2", type: "Water", date: "2024-07-10", amount: 800, notes: "Monthly fee" },
  { id: "b3", type: "Gas", date: "2024-07-12", amount: 1200, notes: "" },
  { id: "b4", type: "Electricity", date: "2024-07-25", amount: 1000, notes: "Service charge" },
]

export const otherExpenses: Expense[] = [
  { id: "e1", date: "2024-07-05", category: "Maintenance", amount: 1500, details: "Plumbing repair in Apt 201" },
  { id: "e2", date: "2024-07-18", category: "Household", amount: 750, details: "Cleaning supplies" },
  { id: "e3", date: "2024-07-22", category: "Other", amount: 500, details: "Gardening service" },
]

export const rooms: Room[] = [
  { id: "r101", number: "101", rentAmount: 8000 },
  { id: "r102", number: "102", rentAmount: 8500 },
  { id: "r201", number: "201", rentAmount: 9000 },
  { id: "r202", number: "202", rentAmount: 7500 },
]

export const renters: Renter[] = [
  { id: "t1", name: "Mr. Karim", roomId: "r101", rentDue: 8000, rentPaid: 8000, payable: 0, cumulativePayable: 0 },
  { id: "t2", name: "Ms. Salma", roomId: "r102", rentDue: 8500, rentPaid: 5000, payable: 3500, cumulativePayable: 3500 },
  { id: "t3", name: "Mr. Farooq", roomId: "r201", rentDue: 9000, rentPaid: 9000, payable: 0, cumulativePayable: 1000 },
  { id: "t4", name: "Mrs. Anika", roomId: "r202", rentDue: 7500, rentPaid: 7500, payable: 0, cumulativePayable: 0 },
]
