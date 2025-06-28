"use client"
import * as React from "react"
import { PlusCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/page-header"
import { utilityBills } from "@/lib/data"
import type { UtilityBill } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const BillTable = ({ bills }: { bills: UtilityBill[] }) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Date</TableHead>
        <TableHead>Notes</TableHead>
        <TableHead className="text-right">Amount</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {bills.map((bill) => (
        <TableRow key={bill.id}>
          <TableCell>{new Date(bill.date).toLocaleDateString()}</TableCell>
          <TableCell className="font-medium">{bill.notes || "-"}</TableCell>
          <TableCell className="text-right">৳{bill.amount.toLocaleString()}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
)

export default function UtilityBillsPage() {
  const electricityBills = utilityBills.filter(b => b.type === "Electricity")
  const waterBills = utilityBills.filter(b => b.type === "Water")
  const gasBills = utilityBills.filter(b => b.type === "Gas")

  const getTotal = (bills: UtilityBill[]) => bills.reduce((acc, bill) => acc + bill.amount, 0)

  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [billType, setBillType] = React.useState("")
  const [amount, setAmount] = React.useState("")
  const [notes, setNotes] = React.useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Bill payment saved:", { billType, amount, notes })
    setBillType("")
    setAmount("")
    setNotes("")
    setIsDialogOpen(false)
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Utility Bills">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <PlusCircle className="h-4 w-4" />
              Add Bill Payment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Add Bill Payment</DialogTitle>
                <DialogDescription>
                  Record a new utility bill payment.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right">
                    Type
                  </Label>
                  <Select value={billType} onValueChange={setBillType}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select bill type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Electricity">Electricity</SelectItem>
                      <SelectItem value="Water">Water</SelectItem>
                      <SelectItem value="Gas">Gas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="amount" className="text-right">
                    Amount
                  </Label>
                  <Input id="amount" type="number" className="col-span-3" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="notes" className="text-right">
                    Notes
                  </Label>
                  <Input id="notes" className="col-span-3" value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Save Payment</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>
      <Tabs defaultValue="electricity">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="electricity">Electricity</TabsTrigger>
          <TabsTrigger value="water">Water</TabsTrigger>
          <TabsTrigger value="gas">Gas</TabsTrigger>
        </TabsList>
        <TabsContent value="electricity">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Electricity Bills</CardTitle>
              <div className="text-2xl font-bold">Total: ৳{getTotal(electricityBills).toLocaleString()}</div>
            </CardHeader>
            <CardContent>
              <BillTable bills={electricityBills} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="water">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Water Bills</CardTitle>
              <div className="text-2xl font-bold">Total: ৳{getTotal(waterBills).toLocaleString()}</div>
            </CardHeader>
            <CardContent>
              <BillTable bills={waterBills} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="gas">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Gas Bills</CardTitle>
              <div className="text-2xl font-bold">Total: ৳{getTotal(gasBills).toLocaleString()}</div>
            </CardHeader>
            <CardContent>
              <BillTable bills={gasBills} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
