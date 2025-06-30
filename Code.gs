
const storage = PropertiesService.getScriptProperties();
const DATA_KEYS = ['familyMembers', 'payouts', 'utilityBills', 'otherExpenses', 'rooms', 'renters', 'rentPayments', 'initiationDate'];

function getInitialData() {
  return {
    familyMembers: [
      { id: "1", name: "Sabbir", expectedHistory: [{ amount: 10000, effectiveDate: "2024-01-01" }], cumulativePayable: 0 },
      { id: "2", name: "Sumon", expectedHistory: [{ amount: 10000, effectiveDate: "2024-01-01" }], cumulativePayable: 0 },
      { id: "3", name: "Juel", expectedHistory: [{ amount: 12000, effectiveDate: "2024-01-01" }], cumulativePayable: 0 },
      { id: "4", name: "Suma", expectedHistory: [{ amount: 5000, effectiveDate: "2024-01-01" }], cumulativePayable: 0 },
      { id: "5", name: "Bibi Howa", expectedHistory: [{ amount: 8000, effectiveDate: "2024-01-01" }], cumulativePayable: 0 },
    ],
    payouts: [
      // July 2024
      { id: "p1", familyMemberId: "1", familyMemberName: "Sabbir", amount: 10000, date: "2024-07-01" },
      { id: "p2", familyMemberId: "2", familyMemberName: "Sumon", amount: 4000, date: "2024-07-05" },
      { id: "p3", familyMemberId: "2", familyMemberName: "Sumon", amount: 4000, date: "2024-07-15" },
      { id: "p4", familyMemberId: "3", familyMemberName: "Juel", amount: 12000, date: "2024-07-02" },
      { id: "p5", familyMemberId: "4", familyMemberName: "Suma", amount: 5000, date: "2024-07-03" },
      { id: "p6", familyMemberId: "5", familyMemberName: "Bibi Howa", amount: 8000, date: "2024-07-04" },
      // June 2024
      { id: "p7", familyMemberId: "1", familyMemberName: "Sabbir", amount: 10000, date: "2024-06-01" },
      { id: "p8", familyMemberId: "2", familyMemberName: "Sumon", amount: 10000, date: "2024-06-05" },
      // August 2024
      { id: "p9", familyMemberId: "3", familyMemberName: "Juel", amount: 6000, date: "2024-08-02" },
    ],
    utilityBills: [
      { id: "b1", type: "Electricity", date: "2024-07-15", amount: 2500, notes: "June Bill" },
      { id: "b2", type: "Water", date: "2024-07-10", amount: 800, notes: "Monthly fee" },
      { id: "b3", type: "Gas", date: "2024-07-12", amount: 1200, notes: "" },
      { id: "b4", type: "Electricity", date: "2024-07-25", amount: 1000, notes: "Service charge" },
      { id: "b5", type: "Electricity", date: "2024-06-15", amount: 2800, notes: "May Bill" },
    ],
    otherExpenses: [
      { id: "e1", date: "2024-07-05", category: "Maintenance", amount: 1500, details: "Plumbing repair in Apt 201" },
      { id: "e2", date: "2024-07-18", category: "Household", amount: 750, details: "Cleaning supplies" },
      { id: "e3", date: "2024-07-22", category: "Other", amount: 500, details: "Gardening service" },
      { id: "e4", date: "2024-06-10", category: "Maintenance", amount: 2000, details: "Elevator repair" },
    ],
    rooms: [
      { id: "r101", number: "101", rentHistory: [{ amount: 8000, effectiveDate: "2024-01-01" }] },
      { id: "r102", number: "102", rentHistory: [{ amount: 8500, effectiveDate: "2024-01-01" }] },
      { id: "r201", number: "201", rentHistory: [{ amount: 9000, effectiveDate: "2024-01-01" }] },
      { id: "r202", number: "202", rentHistory: [{ amount: 7500, effectiveDate: "2024-01-01" }] },
    ],
    renters: [
      { id: "t1", name: "Mr. Karim", occupancyHistory: [{ roomId: "r101", effectiveDate: "2024-01-01" }], cumulativePayable: 0, status: 'active' },
      { id: "t2", name: "Ms. Salma", occupancyHistory: [{ roomId: "r102", effectiveDate: "2024-01-01" }], cumulativePayable: 0, status: 'active' },
      { id: "t3", name: "Mr. Farooq", occupancyHistory: [{ roomId: "r201", effectiveDate: "2024-01-01" }], cumulativePayable: 0, status: 'active' },
      { id: "t4", name: "Mrs. Anika", occupancyHistory: [{ roomId: "r202", effectiveDate: "2024-01-01" }], cumulativePayable: 0, status: 'active' },
    ],
    rentPayments: [
        { id: "rp1", renterId: "t1", renterName: "Mr. Karim", roomNumber: "101", amount: 8000, date: "2024-07-05" },
        { id: "rp2", renterId: "t2", renterName: "Ms. Salma", roomNumber: "102", amount: 5000, date: "2024-07-08" },
        { id: "rp3", renterId: "t3", renterName: "Mr. Farooq", roomNumber: "201", amount: 9000, date: "2024-07-03" },
        { id: "rp4", renterId: "t4", renterName: "Mrs. Anika", roomNumber: "202", amount: 7500, date: "2024-07-06" },
        { id: "rp5", renterId: "t1", renterName: "Mr. Karim", roomNumber: "101", amount: 8000, date: "2024-06-05" },
        { id: "rp6", renterId: "t2", renterName: "Ms. Salma", roomNumber: "102", amount: 8500, date: "2024-06-08" },
        { id: "rp7", renterId: "t3", renterName: "Mr. Farooq", roomNumber: "201", amount: 9000, date: "2024-06-03" },
        { id: "rp8", renterId: "t4", renterName: "Mrs. Anika", roomNumber: "202", amount: 7500, date: "2024-06-06" },
    ],
    initiationDate: new Date('2024-01-01').toISOString(),
  };
}

function initializeData() {
  const initialData = getInitialData();
  DATA_KEYS.forEach(key => {
    storage.setProperty(key, JSON.stringify(initialData[key]));
  });
}

function clearAllData() {
  storage.deleteAllProperties();
  initializeData();
}

function getData(key) {
  const data = storage.getProperty(key);
  if (data) {
    return JSON.parse(data);
  }
  const initialData = getInitialData();
  const value = initialData[key];
  storage.setProperty(key, JSON.stringify(value));
  return value;
}

function setData(key, value) {
  storage.setProperty(key, JSON.stringify(value));
}

function doGet(e) {
  try {
    if (e.parameter.action === 'sync') {
      const allData = {};
      DATA_KEYS.forEach(key => {
        allData[key] = getData(key);
      });
      return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: allData }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Invalid action' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const { action, data } = payload;
    let allData;

    switch (action) {
      // RENT & TENANTS
      case 'addRenter': {
        const renters = getData('renters');
        renters.unshift(data);
        setData('renters', renters);
        break;
      }
      case 'updateRenter': {
        const renters = getData('renters');
        const updatedRenters = renters.map(r => r.id === data.id ? { ...r, ...data } : r);
        setData('renters', updatedRenters);
        break;
      }
      case 'archiveRenter': {
        const renters = getData('renters');
        const updatedRenters = renters.map(r => r.id === data.id ? data : r);
        setData('renters', updatedRenters);
        break;
      }
      case 'addRoom': {
        const rooms = getData('rooms');
        rooms.unshift(data);
        setData('rooms', rooms);
        break;
      }
      case 'updateRoom': {
        const rooms = getData('rooms');
        const updatedRooms = rooms.map(r => r.id === data.id ? data : r);
        setData('rooms', updatedRooms);
        break;
      }
      case 'deleteRoom': {
        const rooms = getData('rooms');
        setData('rooms', rooms.filter(r => r.id !== data.id));
        break;
      }
      case 'addRentPayment': {
        const payments = getData('rentPayments');
        payments.unshift(data);
        setData('rentPayments', payments);
        break;
      }
      case 'updateRentPayment': {
        const payments = getData('rentPayments');
        const updatedPayments = payments.map(p => p.id === data.id ? data : p);
        setData('rentPayments', updatedPayments);
        break;
      }
      case 'deleteRentPayment': {
        const payments = getData('rentPayments');
        setData('rentPayments', payments.filter(p => p.id !== data.id));
        break;
      }

      // FAMILY PAYMENTS
      case 'addFamilyMember': {
        const members = getData('familyMembers');
        members.unshift(data);
        setData('familyMembers', members);
        break;
      }
      case 'updateFamilyMember': {
        const members = getData('familyMembers');
        const updatedMembers = members.map(m => m.id === data.id ? data : m);
        setData('familyMembers', updatedMembers);
        break;
      }
      case 'deleteFamilyMember': {
        const members = getData('familyMembers');
        setData('familyMembers', members.filter(m => m.id !== data.id));
        break;
      }
      case 'addPayout': {
        const payouts = getData('payouts');
        payouts.unshift(data);
        setData('payouts', payouts);
        break;
      }
      case 'updatePayout': {
        const payouts = getData('payouts');
        const updatedPayouts = payouts.map(p => p.id === data.id ? data : p);
        setData('payouts', updatedPayouts);
        break;
      }
      case 'deletePayout': {
        const payouts = getData('payouts');
        setData('payouts', payouts.filter(p => p.id !== data.id));
        break;
      }

      // UTILITY BILLS
      case 'addUtilityBill': {
        const bills = getData('utilityBills');
        bills.unshift(data);
        setData('utilityBills', bills);
        break;
      }
      case 'updateUtilityBill': {
        const bills = getData('utilityBills');
        const updatedBills = bills.map(b => b.id === data.id ? data : b);
        setData('utilityBills', updatedBills);
        break;
      }
      case 'deleteUtilityBill': {
        const bills = getData('utilityBills');
        setData('utilityBills', bills.filter(b => b.id !== data.id));
        break;
      }

      // OTHER EXPENSES
      case 'addExpense': {
        const expenses = getData('otherExpenses');
        expenses.unshift(data);
        setData('otherExpenses', expenses);
        break;
      }
      case 'updateExpense': {
        const expenses = getData('otherExpenses');
        const updatedExpenses = expenses.map(e => e.id === data.id ? data : e);
        setData('otherExpenses', updatedExpenses);
        break;
      }
      case 'deleteExpense': {
        const expenses = getData('otherExpenses');
        setData('otherExpenses', expenses.filter(e => e.id !== data.id));
        break;
      }

      // SETTINGS
      case 'updateInitiationDate': {
        setData('initiationDate', data.date);
        break;
      }
      case 'clearAllData': {
        clearAllData();
        break;
      }
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }
    
    // After action, return the fresh full dataset
    allData = {};
    DATA_KEYS.forEach(key => {
      allData[key] = getData(key);
    });
    
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: allData }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
