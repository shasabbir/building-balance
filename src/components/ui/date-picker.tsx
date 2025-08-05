
"use client"
import * as React from "react"
import { format } from "date-fns"
import { bn as bnLocale } from "date-fns/locale/bn"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useLanguage } from "@/contexts/language-context"

export function DatePicker({ date, setDate, className, disabled }: { date?: Date, setDate: (date?: Date) => void, className?: string, disabled?: boolean }) {
  const { language, t } = useLanguage()
  const [isOpen, setIsOpen] = React.useState(false);

  const handleSelect = (selectedDate?: Date) => {
    setDate(selectedDate);
    setIsOpen(false);
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          disabled={disabled}
          className={cn(
            "w-[280px] justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "MMMM yyyy", { locale: language === 'bn' ? bnLocale : undefined }) : <span>{t('datePicker.pickMonth')}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          initialFocus
          captionLayout="dropdown-buttons"
          fromYear={2020}
          toYear={new Date().getFullYear() + 5}
          defaultMonth={date}
          locale={language === 'bn' ? bnLocale : undefined}
          disabled={disabled}
        />
      </PopoverContent>
    </Popover>
  )
}
