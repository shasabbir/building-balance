"use client"
import * as React from "react"
import { DollarSign, Users, Home, Receipt, Wallet, TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PageHeader } from '@/components/page-header'
import { Badge } from "@/components/ui/badge"

const summaryData = {
  rent: { expected: 25000, collected: 22000, payable: 3000 },
  payouts: { expected: 15000, paid: 13000, payable: 2000 },
  bills: 5500,
  expenses: 1200,
}

const finalBalance = summaryData.rent.collected - (summaryData.payouts.paid + summaryData.bills + summaryData.expenses);

const recentActivities = [
  { type: "Rent", description: "Room 101 Paid", amount: 5000, status: "collected" },
  { type: "Payout", description: "Paid to Sumon", amount: 4000, status: "paid" },
  { type: "Bill", description: "Electricity Bill", amount: 2500, status: "paid" },
  { type: "Expense", description: "Maintenance work", amount: 800, status: "paid" },
  { type: "Rent", description: "Room 102 Pending", amount: 6000, status: "pending" },
];


export default function Dashboard() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Monthly Summary" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rent Collected</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">৳{summaryData.rent.collected.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Expected: ৳{summaryData.rent.expected.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payouts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">৳{summaryData.payouts.paid.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Expected: ৳{summaryData.payouts.expected.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bills & Expenses</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">৳{(summaryData.bills + summaryData.expenses).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Bills: ৳{summaryData.bills.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className={finalBalance > 0 ? "border-green-500/50" : "border-red-500/50"}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Final Balance</CardTitle>
            <Wallet className={`h-4 w-4 ${finalBalance > 0 ? "text-green-600" : "text-red-600"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${finalBalance > 0 ? "text-green-600" : "text-red-600"}`}>
              ৳{finalBalance.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">This month's net cash flow</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentActivities.map((activity, index) => (
                   <TableRow key={index}>
                    <TableCell>
                      <Badge variant={activity.status === 'pending' ? 'destructive' : 'secondary'} className="capitalize">{activity.type}</Badge>
                    </TableCell>
                    <TableCell>{activity.description}</TableCell>
                    <TableCell className="text-right font-medium">৳{activity.amount.toLocaleString()}</TableCell>
                   </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Financial Summary</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6">
             <div className="flex items-center gap-4">
               <div className="bg-green-100 p-3 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600" />
               </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Income</p>
                <p className="text-lg font-bold">৳{summaryData.rent.collected.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-red-100 p-3 rounded-full">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Outgoing</p>
                <p className="text-lg font-bold">৳{(summaryData.payouts.paid + summaryData.bills + summaryData.expenses).toLocaleString()}</p>
              </div>
            </div>
             <div className="flex items-center gap-4">
                <div className="bg-yellow-100 p-3 rounded-full">
                 <Home className="h-6 w-6 text-yellow-600" />
                </div>
               <div>
                 <p className="text-sm text-muted-foreground">Rent Payable</p>
                 <p className="text-lg font-bold">৳{summaryData.rent.payable.toLocaleString()}</p>
               </div>
             </div>
             <div className="flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-full">
                 <Users className="h-6 w-6 text-blue-600" />
                </div>
               <div>
                 <p className="text-sm text-muted-foreground">Family Payouts Payable</p>
                 <p className="text-lg font-bold">৳{summaryData.payouts.payable.toLocaleString()}</p>
               </div>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
