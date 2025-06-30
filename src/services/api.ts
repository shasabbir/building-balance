
import { API_URL } from '@/config';
import type { Renter, Room, RentPayment, FamilyMember, Payout, UtilityBill, Expense } from '@/lib/types';

async function handleAuthError(result: any) {
    if (result.status !== 'success' && result.message === 'Authentication failed.') {
        console.error("Authentication failed. Clearing session.");
        localStorage.removeItem('pin');
        localStorage.removeItem('isPinAuthenticated');
        window.location.reload();
    }
}

async function postRequest(payload: { action: string; data?: any }) {
    if (API_URL.includes("YOUR_GOOGLE_APPS_SCRIPT_URL_HERE")) {
        console.error("API_URL is not set in src/config.ts. Please deploy your Google Apps Script and update the URL.");
        throw new Error("API URL not configured.");
    }
    
    const pin = localStorage.getItem('pin');
    if (payload.action !== 'checkPin' && !pin) {
        throw new Error("User not authenticated.");
    }

    const body = JSON.stringify({ ...payload, pin });
    
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain;charset=utf-8',
        },
        body: body,
        redirect: 'follow',
    });

    if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
    }

    const result = await response.json();
    handleAuthError(result);

    if (result.status !== 'success') {
        throw new Error(result.message || 'An unknown API error occurred');
    }

    return result.data;
}

async function getRequest(params: Record<string, string>) {
     if (API_URL.includes("YOUR_GOOGLE_APPS_SCRIPT_URL_HERE")) {
        console.error("API_URL is not set in src/config.ts. Please deploy your Google Apps Script and update the URL.");
        throw new Error("API URL not configured.");
    }

    const pin = localStorage.getItem('pin');
    if (!pin) {
        throw new Error("User not authenticated.");
    }

    const url = new URL(API_URL);
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    url.searchParams.append('pin', pin);


    const response = await fetch(url.toString(), {
        method: 'GET',
        redirect: 'follow',
    });

    if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
    }

    const result = await response.json();
    handleAuthError(result);

    if (result.status !== 'success') {
        throw new Error(result.message || 'An unknown API error occurred');
    }

    return result.data;
}

export const api = {
    sync: () => getRequest({ action: 'sync' }),
    checkPin: (pin: string) => postRequest({ action: 'checkPin', data: { pin } }),
    
    // Renter
    addRenter: (data: Renter) => postRequest({ action: 'addRenter', data }),
    updateRenter: (data: Renter) => postRequest({ action: 'updateRenter', data }),
    archiveRenter: (data: Renter) => postRequest({ action: 'archiveRenter', data }),
    
    // Room
    addRoom: (data: Room) => postRequest({ action: 'addRoom', data }),
    updateRoom: (data: Room) => postRequest({ action: 'updateRoom', data }),
    deleteRoom: (id: string) => postRequest({ action: 'deleteRoom', data: { id } }),

    // Rent Payment
    addRentPayment: (data: RentPayment) => postRequest({ action: 'addRentPayment', data }),
    updateRentPayment: (data: RentPayment) => postRequest({ action: 'updateRentPayment', data }),
    deleteRentPayment: (id: string) => postRequest({ action: 'deleteRentPayment', data: { id } }),

    // Family Member
    addFamilyMember: (data: FamilyMember) => postRequest({ action: 'addFamilyMember', data }),
    updateFamilyMember: (data: FamilyMember) => postRequest({ action: 'updateFamilyMember', data }),
    deleteFamilyMember: (id: string) => postRequest({ action: 'deleteFamilyMember', data: { id } }),

    // Payout
    addPayout: (data: Payout) => postRequest({ action: 'addPayout', data }),
    updatePayout: (data: Payout) => postRequest({ action: 'updatePayout', data }),
    deletePayout: (id: string) => postRequest({ action: 'deletePayout', data: { id } }),
    
    // Utility Bill
    addUtilityBill: (data: UtilityBill) => postRequest({ action: 'addUtilityBill', data }),
    updateUtilityBill: (data: UtilityBill) => postRequest({ action: 'updateUtilityBill', data }),
    deleteUtilityBill: (id: string) => postRequest({ action: 'deleteUtilityBill', data: { id } }),
    
    // Expense
    addExpense: (data: Expense) => postRequest({ action: 'addExpense', data }),
    updateExpense: (data: Expense) => postRequest({ action: 'updateExpense', data }),
    deleteExpense: (id: string) => postRequest({ action: 'deleteExpense', data: { id } }),

    // Settings
    updateInitiationDate: (date: string) => postRequest({ action: 'updateInitiationDate', data: { date } }),
    clearAllData: () => postRequest({ action: 'clearAllData' }),
};
