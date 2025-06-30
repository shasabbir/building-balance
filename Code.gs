// In Apps Script, go to Project Settings > Script Properties and add a property:
// Key: PIN_CODE, Value: your-6-digit-pin
const PIN_KEY = 'PIN_CODE';
const SCRIPT_PROPS = PropertiesService.getScriptProperties();

// Data keys for script properties
const KEYS = {
  FAMILY_MEMBERS: 'familyMembers',
  PAYOUTS: 'payouts',
  UTILITY_BILLS: 'utilityBills',
  OTHER_EXPENSES: 'otherExpenses',
  ROOMS: 'rooms',
  RENTERS: 'renters',
  RENT_PAYMENTS: 'rentPayments',
  INITIATION_DATE: 'initiationDate'
};

// --- UTILITY FUNCTIONS ---

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function checkPin(pin) {
  const storedPin = SCRIPT_PROPS.getProperty(PIN_KEY);
  if (!storedPin) {
    throw new Error('PIN not configured on the server. Please set PIN_CODE in Script Properties.');
  }
  return pin === storedPin;
}

function getData(key, defaultValue = []) {
  const data = SCRIPT_PROPS.getProperty(key);
  try {
    return data ? JSON.parse(data) : defaultValue;
  } catch(e) {
    // If there's a parsing error, return the default value.
    return defaultValue;
  }
}

function setData(key, value) {
  SCRIPT_PROPS.setProperty(key, JSON.stringify(value));
}

function getAllData() {
  const initiationDate = SCRIPT_PROPS.getProperty(KEYS.INITIATION_DATE) || new Date('2024-01-01').toISOString();
  return {
    familyMembers: getData(KEYS.FAMILY_MEMBERS),
    payouts: getData(KEYS.PAYOUTS),
    utilityBills: getData(KEYS.UTILITY_BILLS),
    otherExpenses: getData(KEYS.OTHER_EXPENSES),
    rooms: getData(KEYS.ROOMS),
    renters: getData(KEYS.RENTERS),
    rentPayments: getData(KEYS.RENT_PAYMENTS),
    initiationDate: initiationDate
  };
}


// --- ENTRY POINTS ---

function doGet(e) {
  try {
    const { action, pin } = e.parameter;
    
    if (!checkPin(pin)) {
      return jsonResponse({ status: 'error', message: 'Authentication failed.' });
    }
    
    if (action === 'sync') {
      return jsonResponse({ status: 'success', data: getAllData() });
    }
    
    return jsonResponse({ status: 'error', message: `Invalid GET action: ${action}` });
  } catch (error) {
    return jsonResponse({ status: 'error', message: error.message, stack: error.stack });
  }
}

function doPost(e) {
  try {
    const request = JSON.parse(e.postData.contents);
    const { action, data, pin } = request;

    // The only action that doesn't need a pre-validated PIN is checking the PIN itself.
    if (action === 'checkPin') {
        if (checkPin(data.pin)) {
            return jsonResponse({ status: 'success', data: { authenticated: true } });
        } else {
            return jsonResponse({ status: 'error', message: 'Authentication failed.' });
        }
    }
    
    // All other actions require a valid PIN.
    if (!checkPin(pin)) {
       return jsonResponse({ status: 'error', message: 'Authentication failed.' });
    }

    switch(action) {
      // --- Renter Actions ---
      case 'addRenter': {
        const renters = getData(KEYS.RENTERS);
        renters.push(data);
        setData(KEYS.RENTERS, renters);
        break;
      }
      case 'updateRenter':
      case 'archiveRenter': {
        let renters = getData(KEYS.RENTERS);
        renters = renters.map(r => r.id === data.id ? data : r);
        setData(KEYS.RENTERS, renters);
        break;
      }

      // --- Room Actions ---
      case 'addRoom': {
        const rooms = getData(KEYS.ROOMS);
        rooms.push(data);
        setData(KEYS.ROOMS, rooms);
        break;
      }
      case 'updateRoom': {
        let rooms = getData(KEYS.ROOMS);
        rooms = rooms.map(r => r.id === data.id ? data : r);
        setData(KEYS.ROOMS, rooms);
        break;
      }
      case 'deleteRoom': {
        let rooms = getData(KEYS.ROOMS);
        rooms = rooms.filter(r => r.id !== data.id);
        setData(KEYS.ROOMS, rooms);
        break;
      }

      // --- Rent Payment Actions ---
      case 'addRentPayment': {
        const payments = getData(KEYS.RENT_PAYMENTS);
        payments.push(data);
        setData(KEYS.RENT_PAYMENTS, payments);
        break;
      }
      case 'updateRentPayment': {
        let payments = getData(KEYS.RENT_PAYMENTS);
        payments = payments.map(p => p.id === data.id ? data : p);
        setData(KEYS.RENT_PAYMENTS, payments);
        break;
      }
      case 'deleteRentPayment': {
        let payments = getData(KEYS.RENT_PAYMENTS);
        payments = payments.filter(p => p.id !== data.id);
        setData(KEYS.RENT_PAYMENTS, payments);
        break;
      }

      // --- Family Member Actions ---
      case 'addFamilyMember': {
        const members = getData(KEYS.FAMILY_MEMBERS);
        members.push(data);
        setData(KEYS.FAMILY_MEMBERS, members);
        break;
      }
      case 'updateFamilyMember': {
        let members = getData(KEYS.FAMILY_MEMBERS);
        members = members.map(m => m.id === data.id ? data : m);
        setData(KEYS.FAMILY_MEMBERS, members);
        break;
      }
      case 'deleteFamilyMember': {
        let members = getData(KEYS.FAMILY_MEMBERS);
        members = members.filter(m => m.id !== data.id);
        setData(KEYS.FAMILY_MEMBERS, members);
        break;
      }

      // --- Payout Actions ---
      case 'addPayout': {
        const payouts = getData(KEYS.PAYOUTS);
        payouts.push(data);
        setData(KEYS.PAYOUTS, payouts);
        break;
      }
      case 'updatePayout': {
        let payouts = getData(KEYS.PAYOUTS);
        payouts = payouts.map(p => p.id === data.id ? data : p);
        setData(KEYS.PAYOUTS, payouts);
        break;
      }
      case 'deletePayout': {
        let payouts = getData(KEYS.PAYOUTS);
        payouts = payouts.filter(p => p.id !== data.id);
        setData(KEYS.PAYOUTS, payouts);
        break;
      }
      
      // --- Utility Bill Actions ---
      case 'addUtilityBill': {
        const bills = getData(KEYS.UTILITY_BILLS);
        bills.push(data);
        setData(KEYS.UTILITY_BILLS, bills);
        break;
      }
      case 'updateUtilityBill': {
        let bills = getData(KEYS.UTILITY_BILLS);
        bills = bills.map(b => b.id === data.id ? data : b);
        setData(KEYS.UTILITY_BILLS, bills);
        break;
      }
      case 'deleteUtilityBill': {
        let bills = getData(KEYS.UTILITY_BILLS);
        bills = bills.filter(b => b.id !== data.id);
        setData(KEYS.UTILITY_BILLS, bills);
        break;
      }

      // --- Other Expense Actions ---
      case 'addExpense': {
        const expenses = getData(KEYS.OTHER_EXPENSES);
        expenses.push(data);
        setData(KEYS.OTHER_EXPENSES, expenses);
        break;
      }
      case 'updateExpense': {
        let expenses = getData(KEYS.OTHER_EXPENSES);
        expenses = expenses.map(e => e.id === data.id ? data : e);
        setData(KEYS.OTHER_EXPENSES, expenses);
        break;
      }
      case 'deleteExpense': {
        let expenses = getData(KEYS.OTHER_EXPENSES);
        expenses = expenses.filter(e => e.id !== data.id);
        setData(KEYS.OTHER_EXPENSES, expenses);
        break;
      }

      // --- Settings Actions ---
      case 'updateInitiationDate': {
        SCRIPT_PROPS.setProperty(KEYS.INITIATION_DATE, data.date);
        break;
      }
      case 'clearAllData': {
        Object.values(KEYS).forEach(key => SCRIPT_PROPS.deleteProperty(key));
        break;
      }

      default:
        throw new Error(`Invalid POST action: ${action}`);
    }

    // After a successful write operation, return all data so the frontend can re-sync.
    return jsonResponse({ status: 'success', data: getAllData() });

  } catch (error) {
    return jsonResponse({ status: 'error', message: error.message, stack: error.stack });
  }
}
