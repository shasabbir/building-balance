
"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Users, Receipt, ShoppingCart, Settings, PanelLeft, LayoutDashboard, ChevronLeft, ChevronRight } from "lucide-react"
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { BuildingIcon } from "./icons"
import { useDate } from "@/contexts/date-context"
import { format, subMonths, addMonths, startOfMonth, isBefore, isSameMonth } from "date-fns"
import { useData } from "@/contexts/data-context"

const menuItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/family-payments", label: "Family Payments", icon: Users },
  { path: "/utility-bills", label: "Utility Bills", icon: Receipt },
  { path: "/other-expenses", label: "Other Expenses", icon: ShoppingCart },
  { path: "/rent-tenants", label: "Rent & Tenants", icon: Home },
  { path: "/settings", label: "Settings", icon: Settings },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { selectedDate, setSelectedDate } = useDate()
  const { initiationDate } = useData()

  const handlePrevMonth = () => {
    setSelectedDate(subMonths(selectedDate, 1))
  }

  const handleNextMonth = () => {
    setSelectedDate(addMonths(selectedDate, 1))
  }
  
  const isPrevDisabled = isBefore(startOfMonth(selectedDate), startOfMonth(initiationDate)) || isSameMonth(startOfMonth(selectedDate), startOfMonth(initiationDate));

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <BuildingIcon className="w-6 h-6 text-primary" />
            </Button>
            <span className="text-lg font-semibold text-foreground">Building Balance</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.path}
                  className="justify-start"
                >
                  <Link href={item.path}>
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
            <SidebarTrigger className="md:hidden" />
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={handlePrevMonth} disabled={isPrevDisabled}>
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Previous Month</span>
              </Button>
              <span className="font-semibold text-lg w-32 text-center">
                {format(selectedDate, "MMMM yyyy")}
              </span>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Next Month</span>
              </Button>
            </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
