"use client"
import * as React from "react"
import { PlusCircle, MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { PageHeader } from "@/components/page-header"
import { renters, rooms } from "@/lib/data"
import { Badge } from "@/components/ui/badge"

const getRoomNumber = (roomId: string) => {
  return rooms.find(r => r.id === roomId)?.number || "N/A"
}

export default function RentTenantsPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Rent & Tenants">
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <PlusCircle className="h-4 w-4" />
              Add Rent Payment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Rent Payment</DialogTitle>
              <DialogDescription>
                Record a new rent payment from a tenant.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="tenant" className="text-right">
                  Tenant
                </Label>
                <Input id="tenant" value="Mr. Karim" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">
                  Amount Paid
                </Label>
                <Input id="amount" type="number" className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Save Payment</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>Rent Collection Status</CardTitle>
          <CardDescription>
            Monthly rent status for all tenants.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Room</TableHead>
                <TableHead>Renter</TableHead>
                <TableHead className="text-right">Rent Due</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">This Month Payable</TableHead>
                <TableHead className="text-right">Total Payable</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {renters.map((renter) => (
                <TableRow key={renter.id}>
                  <TableCell><Badge variant="secondary">{getRoomNumber(renter.roomId)}</Badge></TableCell>
                  <TableCell className="font-medium">{renter.name}</TableCell>
                  <TableCell className="text-right">৳{renter.rentDue.toLocaleString()}</TableCell>
                  <TableCell className="text-right">৳{renter.rentPaid.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    {renter.payable > 0 ? (
                      <Badge variant="destructive">৳{renter.payable.toLocaleString()}</Badge>
                    ) : (
                      '৳0'
                    )}
                  </TableCell>
                  <TableCell className="text-right font-semibold">৳{renter.cumulativePayable.toLocaleString()}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>Edit Renter</DropdownMenuItem>
                        <DropdownMenuItem>View Payment History</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
