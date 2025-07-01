
"use client"
import * as React from "react"
import { DollarSign, Users, Home, Receipt, Wallet, TrendingUp, TrendingDown, Repeat } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from '@/components/page-header'
import { Badge } from "@/components/ui/badge"
import { useData } from "@/contexts/data-context"
import { useDate } from "@/contexts/date-context"
import { useLanguage } from "@/contexts/language-context"
import { isSameMonth, subMonths, lastDayOfMonth, isBefore, startOfMonth, addMonths, format } from 'date-fns'
import { bn as bnLocale } from 'date-fns/locale/bn'
import type { Renter, RentPayment, FamilyMember, Payout, UtilityBill, Expense, Room } from "@/lib/types"
import { getEffectiveValue, findRoomForRenter, findOccupantForRoom } from "@/lib/utils"

const calculateMonthlySummary = (
  targetDate: Date,
  allRenters: Renter[],
  allRentPayments: RentPayment[],
  allFamilyMembers: FamilyMember[],
  allPayouts: Payout[],
  allBills: UtilityBill[],
  allExpenses: Expense[],
  allRooms: Room[]
) => {
  // Determine the reference date for "expected" calculations
  const referenceDate = isSameMonth(targetDate, new Date()) ? new Date() : lastDayOfMonth(targetDate);
  
  // Filter transactions for the target month
  const monthlyRentPayments = allRentPayments.filter(p => isSameMonth(new Date(p.date), targetDate));
  const monthlyPayouts = allPayouts.filter(p => isSameMonth(new Date(p.date), targetDate));
  const monthlyBills = allBills.filter(b => isSameMonth(new Date(b.date), targetDate));
  const monthlyExpenses = allExpenses.filter(e => isSameMonth(new Date(e.date), targetDate));
  
  // Calculate totals for the month
  const rentCollected = monthlyRentPayments.reduce((sum, p) => sum + p.amount, 0);
  const payoutsPaid = monthlyPayouts.reduce((sum, p) => sum + p.amount, 0);
  const billsPaid = monthlyBills.reduce((sum, b) => sum + b.amount, 0);
  const expensesPaid = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Calculate expected totals for the target month using historical data
  const rentExpected = allRooms.reduce((sum, room) => {
    const occupant = findOccupantForRoom(room.id, referenceDate, allRenters, true);
    if (occupant) {
        const rentDue = getEffectiveValue(room.rentHistory, referenceDate);
        return sum + rentDue;
    }
    return sum;
  }, 0);
  const rentPayable = rentExpected - rentCollected;
  
  const payoutsExpected = allFamilyMembers.reduce((sum, m) => sum + getEffectiveValue(m.expectedHistory, referenceDate), 0);
  const payoutsPayable = payoutsExpected - payoutsPaid;
  
  const totalIncome = rentCollected;
  const totalOutgoing = payoutsPaid + billsPaid + expensesPaid;
  const balance = totalIncome - totalOutgoing;

  return {
    rent: { collected: rentCollected, expected: rentExpected, payable: rentPayable > 0 ? rentPayable : 0 },
    payouts: { paid: payoutsPaid, expected: payoutsExpected, payable: payoutsPayable > 0 ? payoutsPayable : 0 },
    bills: billsPaid,
    expenses: expensesPaid,
    totalIncome,
    totalOutgoing,
    balance,
  };
};

const calculateAllTimeSummary = (
  selectedDate: Date,
  initiationDate: Date,
  allRenters: Renter[],
  allRooms: Room[],
  allFamilyMembers: FamilyMember[],
  allRentPayments: RentPayment[],
  allPayouts: Payout[],
  allBills: UtilityBill[],
  allExpenses: Expense[]
) => {
  let rentCollected = 0;
  let rentExpected = 0;
  let payoutsPaid = 0;
  let payoutsExpected = 0;
  let billsPaid = 0;
  let expensesPaid = 0;

  let currentDate = startOfMonth(initiationDate);

  while (isBefore(currentDate, selectedDate) || isSameMonth(currentDate, selectedDate)) {
    const referenceDate = lastDayOfMonth(currentDate);

    // Rent
    rentCollected += allRentPayments
      .filter(p => isSameMonth(new Date(p.date), currentDate))
      .reduce((sum, p) => sum + p.amount, 0);
    
    rentExpected += allRooms.reduce((sum, room) => {
        const occupant = findOccupantForRoom(room.id, referenceDate, allRenters, true);
        if (occupant) {
            const rentDue = getEffectiveValue(room.rentHistory, referenceDate);
            return sum + rentDue;
        }
        return sum;
    }, 0);

    // Payouts
    payoutsPaid += allPayouts
      .filter(p => isSameMonth(new Date(p.date), currentDate))
      .reduce((sum, p) => sum + p.amount, 0);

    payoutsExpected += allFamilyMembers.reduce((sum, m) => sum + getEffectiveValue(m.expectedHistory, referenceDate), 0);
    
    // Bills & Expenses
    billsPaid += allBills
      .filter(b => isSameMonth(new Date(b.date), currentDate))
      .reduce((sum, b) => sum + b.amount, 0);
    expensesPaid += allExpenses
      .filter(e => isSameMonth(new Date(e.date), currentDate))
      .reduce((sum, e) => sum + e.amount, 0);
    
    currentDate = addMonths(currentDate, 1);
  }

  const totalIncome = rentCollected;
  const totalOutgoing = payoutsPaid + billsPaid + expensesPaid;
  const balance = totalIncome - totalOutgoing;
  const rentPayable = rentExpected - rentCollected > 0 ? rentExpected - rentCollected : 0;
  const payoutsPayable = payoutsExpected - payoutsPaid > 0 ? payoutsExpected - payoutsPaid : 0;

  return {
    rent: { collected: rentCollected, expected: rentExpected, payable: rentPayable },
    payouts: { paid: payoutsPaid, expected: payoutsExpected, payable: payoutsPayable },
    billsPaid,
    expensesPaid,
    totalIncome,
    totalOutgoing,
    balance,
  };
};

export default function Dashboard() {
  const { selectedDate } = useDate()
  const { renters, rentPayments, familyMembers, payouts, utilityBills, otherExpenses, rooms, initiationDate } = useData()
  const { language, t } = useLanguage()

  const previousMonth = subMonths(selectedDate, 1)

  const previousMonthSummary = calculateMonthlySummary(previousMonth, renters, rentPayments, familyMembers, payouts, utilityBills, otherExpenses, rooms)
  const currentMonthSummary = calculateMonthlySummary(selectedDate, renters, rentPayments, familyMembers, payouts, utilityBills, otherExpenses, rooms)
  const allTimeSummary = calculateAllTimeSummary(selectedDate, initiationDate, renters, rooms, familyMembers, rentPayments, payouts, utilityBills, otherExpenses)


  const carryOver = previousMonthSummary.balance
  const finalBalance = carryOver + currentMonthSummary.balance

  const recentActivities = React.useMemo(() => {
    const activities = [
        ...rentPayments.filter(p => isSameMonth(new Date(p.date), selectedDate)).map(p => ({ type: 'Rent', description: t('dashboard.rentPaid', { name: p.renterName }), amount: p.amount, date: p.date, status: 'collected' as const })),
        ...payouts.filter(p => isSameMonth(new Date(p.date), selectedDate)).map(p => ({ type: 'Payout', description: t('dashboard.payoutPaid', { name: p.familyMemberName }), amount: p.amount, date: p.date, status: 'paid' as const })),
        ...utilityBills.filter(b => isSameMonth(new Date(b.date), selectedDate)).map(b => ({ type: 'Bill', description: t('dashboard.billPaid', { type: b.type }), amount: b.amount, date: b.date, status: 'paid' as const })),
        ...otherExpenses.filter(e => isSameMonth(new Date(e.date), selectedDate)).map(e => ({ type: 'Expense', description: e.details, amount: e.amount, date: e.date, status: 'paid' as const }))
    ];
    return activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);
  }, [rentPayments, payouts, utilityBills, otherExpenses, selectedDate, t]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t('nav.dashboard')} />
      
      <Tabs defaultValue="monthly" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-auto md:max-w-xs">
          <TabsTrigger value="monthly">{t('dashboard.thisMonth')}</TabsTrigger>
          <TabsTrigger value="all-time">{t('dashboard.allTime')}</TabsTrigger>
        </TabsList>
        <TabsContent value="monthly" className="space-y-4 pt-4">
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('dashboard.carryOver')}</CardTitle>
                  <Repeat className={`h-4 w-4 ${carryOver >= 0 ? "text-muted-foreground" : "text-red-500"}`} />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${carryOver < 0 && "text-red-600 dark:text-red-400"}`}>৳{carryOver.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">{t('dashboard.fromLastMonth')}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('dashboard.rentCollected')}</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">৳{currentMonthSummary.rent.collected.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">{t('dashboard.expected', { amount: currentMonthSummary.rent.expected.toLocaleString() })}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('dashboard.totalPayouts')}</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">৳{currentMonthSummary.payouts.paid.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">{t('dashboard.expected', { amount: currentMonthSummary.payouts.expected.toLocaleString() })}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('dashboard.billsAndExpenses')}</CardTitle>
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">৳{(currentMonthSummary.bills + currentMonthSummary.expenses).toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">{t('dashboard.bills', { amount: currentMonthSummary.bills.toLocaleString() })}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('dashboard.thisMonthsBalance')}</CardTitle>
                  <Wallet className={`h-4 w-4 ${currentMonthSummary.balance >= 0 ? "text-muted-foreground" : "text-red-500"}`} />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${currentMonthSummary.balance < 0 && "text-red-600 dark:text-red-400"}`}>
                      ৳{currentMonthSummary.balance.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">{t('dashboard.withoutCarryOver')}</p>
                </CardContent>
              </Card>
              <Card className={finalBalance >= 0 ? "border-green-500/50 dark:border-green-500/40" : "border-red-500/50 dark:border-red-500/40"}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('dashboard.finalBalance')}</CardTitle>
                  <Wallet className={`h-4 w-4 ${finalBalance >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`} />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${finalBalance >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                    ৳{finalBalance.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">{t('dashboard.inclCarryOver')}</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="lg:col-span-4">
                <CardHeader>
                  <CardTitle>{t('dashboard.recentActivity')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {recentActivities.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="hidden sm:table-cell">{t('common.type')}</TableHead>
                          <TableHead>{t('dashboard.description')}</TableHead>
                          <TableHead className="text-right">{t('dashboard.amount')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentActivities.map((activity, index) => (
                          <TableRow key={index}>
                            <TableCell className="hidden sm:table-cell">
                              <Badge variant={'secondary'} className="capitalize">{activity.type}</Badge>
                            </TableCell>
                            <TableCell>{activity.description}</TableCell>
                            <TableCell className="text-right font-medium">৳{activity.amount.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center text-muted-foreground p-8">{t('dashboard.noActivity')}</div>
                  )}
                </CardContent>
              </Card>
              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle>{t('dashboard.financialSummary')}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6">
                  <div className="flex items-center gap-4">
                    <div className="bg-green-500/10 dark:bg-green-500/20 p-3 rounded-full">
                      <TrendingUp className="h-6 w-6 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('dashboard.totalIncome')}</p>
                      <p className="text-lg font-bold">৳{currentMonthSummary.totalIncome.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="bg-red-500/10 dark:bg-red-500/20 p-3 rounded-full">
                      <TrendingDown className="h-6 w-6 text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('dashboard.totalOutgoing')}</p>
                      <p className="text-lg font-bold">৳{currentMonthSummary.totalOutgoing.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                      <div className="bg-yellow-500/10 dark:bg-yellow-500/20 p-3 rounded-full">
                      <Home className="h-6 w-6 text-yellow-500" />
                      </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('dashboard.rentPayable')}</p>
                      <p className="text-lg font-bold">৳{currentMonthSummary.rent.payable.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                      <div className="bg-blue-500/10 dark:bg-blue-500/20 p-3 rounded-full">
                      <Users className="h-6 w-6 text-blue-500" />
                      </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('dashboard.familyPayoutsPayable')}</p>
                      <p className="text-lg font-bold">৳{currentMonthSummary.payouts.payable.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
        </TabsContent>
        <TabsContent value="all-time" className="space-y-4 pt-4">
           <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('dashboard.totalRentCollected')}</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">৳{allTimeSummary.rent.collected.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">{t('dashboard.expected', { amount: allTimeSummary.rent.expected.toLocaleString() })}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('dashboard.totalPayoutsPaid')}</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">৳{allTimeSummary.payouts.paid.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">{t('dashboard.expected', { amount: allTimeSummary.payouts.expected.toLocaleString() })}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('dashboard.totalBillsAndExpenses')}</CardTitle>
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">৳{(allTimeSummary.billsPaid + allTimeSummary.expensesPaid).toLocaleString()}</div>

                  <p className="text-xs text-muted-foreground">{t('dashboard.utilitiesAndOther')}</p>
                </CardContent>
              </Card>
              <Card className={allTimeSummary.balance >= 0 ? "border-green-500/50 dark:border-green-500/40" : "border-red-500/50 dark:border-red-500/40"}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('dashboard.overallFinalBalance')}</CardTitle>
                  <Wallet className={`h-4 w-4 ${allTimeSummary.balance >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`} />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${allTimeSummary.balance >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                    ৳{allTimeSummary.balance.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">{t('dashboard.totalIncomeMinusOutgoing')}</p>
                </CardContent>
              </Card>
           </div>
           <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="lg:col-span-7">
                    <CardHeader>
                        <CardTitle>{t('dashboard.allTimeFinancialSummary')}</CardTitle>
                        <CardDescription>{t('dashboard.fromTo', { start: format(initiationDate, "MMM yyyy", { locale: language === 'bn' ? bnLocale : undefined})})}</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                      <div className="flex items-center gap-4">
                        <div className="bg-green-500/10 dark:bg-green-500/20 p-3 rounded-full">
                          <TrendingUp className="h-6 w-6 text-green-500" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{t('dashboard.totalIncome')}</p>
                          <p className="text-lg font-bold">৳{allTimeSummary.totalIncome.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="bg-red-500/10 dark:bg-red-500/20 p-3 rounded-full">
                          <TrendingDown className="h-6 w-6 text-red-500" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{t('dashboard.totalOutgoing')}</p>
                          <p className="text-lg font-bold">৳{allTimeSummary.totalOutgoing.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                          <div className="bg-yellow-500/10 dark:bg-yellow-500/20 p-3 rounded-full">
                          <Home className="h-6 w-6 text-yellow-500" />
                          </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{t('dashboard.totalRentPayable')}</p>
                          <p className="text-lg font-bold">৳{allTimeSummary.rent.payable.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                          <div className="bg-blue-500/10 dark:bg-blue-500/20 p-3 rounded-full">
                          <Users className="h-6 w-6 text-blue-500" />
                          </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{t('dashboard.totalFamilyPayoutsPayable')}</p>
                          <p className="text-lg font-bold">৳{allTimeSummary.payouts.payable.toLocaleString()}</p>
                        </div>
                      </div>
                    </CardContent>
                </Card>
            </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
