import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { startOfDay } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getEffectiveValue(history: { amount: number, effectiveDate: string }[], targetDate: Date): number {
  if (!history || history.length === 0) {
    return 0;
  }

  const sortedHistory = [...history].sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime());
  
  const targetTimestamp = startOfDay(targetDate).getTime();

  const effectiveEntry = sortedHistory.find(entry => startOfDay(new Date(entry.effectiveDate)).getTime() <= targetTimestamp);

  return effectiveEntry ? effectiveEntry.amount : 0;
}
