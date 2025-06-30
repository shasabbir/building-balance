import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { startOfDay } from "date-fns"
import type { Renter } from "./types"

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


export function findRoomForRenter(renter: Renter, targetDate: Date): string | null {
    if (!renter || !renter.occupancyHistory || renter.occupancyHistory.length === 0) {
        return null;
    }

    const sortedHistory = [...renter.occupancyHistory].sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime());
    const targetTimestamp = startOfDay(targetDate).getTime();

    const effectiveOccupancy = sortedHistory.find(entry => startOfDay(new Date(entry.effectiveDate)).getTime() <= targetTimestamp);

    return effectiveOccupancy ? effectiveOccupancy.roomId : null;
}

export function findOccupantForRoom(roomId: string, targetDate: Date, renters: Renter[]): Renter | undefined {
  return renters.find(renter => {
    if (renter.status !== 'active') return false;
    const currentRoomId = findRoomForRenter(renter, targetDate);
    return currentRoomId === roomId;
  });
}
