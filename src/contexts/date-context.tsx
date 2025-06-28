'use client'

import * as React from 'react'

type DateContextType = {
  selectedDate: Date
  setSelectedDate: React.Dispatch<React.SetStateAction<Date>>
}

const DateContext = React.createContext<DateContextType | undefined>(undefined)

export function DateProvider({ children }: { children: React.ReactNode }) {
  const [selectedDate, setSelectedDate] = React.useState(new Date())

  return (
    <DateContext.Provider value={{ selectedDate, setSelectedDate }}>
      {children}
    </DateContext.Provider>
  )
}

export function useDate() {
  const context = React.useContext(DateContext)
  if (context === undefined) {
    throw new Error('useDate must be used within a DateProvider')
  }
  return context
}
