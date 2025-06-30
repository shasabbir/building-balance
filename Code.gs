// A simple web app that acts as a JSON API for a key-value store.
// See the README.md for instructions on how to deploy and use this script.
const storage = PropertiesService.getScriptProperties();
const PIN_CODE = "123456"; // IMPORTANT: Change this to your secret PIN

function handlePost(payload) {
    if (!payload || !payload.action) {
        return errorResponse('Invalid payload. "action" is missing.');
    }
    
    switch (payload.action) {
        case 'clearAllData':
            storage.deleteAllProperties();
            const initialData = getInitialData();
            storage.setProperties(serializeData(initialData), true);
            return successResponse(initialData);

        case 'updateInitiationDate':
            storage.setProperty('initiationDate', payload.data.date);
            return successResponse(getDecodedData());

        case 'checkPin':
            if (!payload.data || !payload.data.pin) {
                return errorResponse('PIN is required.');
            }
            if (payload.data.pin === PIN_CODE) {
                return successResponse({ authenticated: true });
            } else {
                return errorResponse('Invalid PIN.');
            }

        // Generic handlers
        case 'addRenter':
        case 'addRoom':
        case 'addRentPayment':
        case 'addFamilyMember':
        case 'addPayout':
        case 'addUtilityBill':
        case 'addExpense': {
            const key = payload.action.replace('add', '').charAt(0).toLowerCase() + payload.action.slice(4) + 's';
            const data = JSON.parse(storage.getProperty(key) || '[]');
            data.push(payload.data);
            storage.setProperty(key, JSON.stringify(data));
            return successResponse(getDecodedData());
        }

        case 'updateRenter':
        case 'updateRoom':
        case 'updateRentPayment':
        case 'updateFamilyMember':
        case 'updatePayout':
        case 'updateUtilityBill':
        case 'updateExpense':
        case 'archiveRenter': {
            const key = (payload.action.replace('update', '').replace('archive', '').charAt(0).toLowerCase() + payload.action.slice(7)) + 's';
            const data = JSON.parse(storage.getProperty(key) || '[]');
            const index = data.findIndex(item => item.id === payload.data.id);
            if (index !== -1) {
                data[index] = payload.data;
                storage.setProperty(key, JSON.stringify(data));
            }
            return successResponse(getDecodedData());
        }

        case 'deleteRoom':
        case 'deleteRentPayment':
        case 'deleteFamilyMember':
        case 'deletePayout':
        case 'deleteUtilityBill':
        case 'deleteExpense': {
            const key = payload.action.replace('delete', '').charAt(0).toLowerCase() + payload.action.slice(7) + 's';
            const data = JSON.parse(storage.getProperty(key) || '[]');
            const filteredData = data.filter(item => item.id !== payload.data.id);
            storage.setProperty(key, JSON.stringify(filteredData));
            return successResponse(getDecodedData());
        }

        default:
            return errorResponse('Invalid action specified.');
    }
}


function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const result = handlePost(payload);
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify(errorResponse(err.message)))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function handleGet(params) {
    if (!params || !params.action) {
        return errorResponse('Invalid parameters. "action" is missing.');
    }
    switch (params.action) {
        case 'sync':
            return successResponse(getDecodedData());
        default:
            return errorResponse('Invalid action specified.');
    }
}

function doGet(e) {
  try {
    const result = handleGet(e.parameter);
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify(errorResponse(err.message)))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function successResponse(data) {
  return {
    status: 'success',
    data: data,
  };
}

function errorResponse(message) {
  return {
    status: 'error',
    message: message,
  };
}


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
            { id: "p1", familyMemberId: "1", familyMemberName: "Sabbir", amount: 10000, date: "2024-07-01", details: "Monthly allowance" },
            { id: "p2", familyMemberId: "2", familyMemberName: "Sumon", amount: 4000, date: "2024-07-05", details: "" },
            { id: "p3", familyMemberId: "2", familyMemberName: "Sumon", amount: 4000, date: "2024-07-15", details: "Partial payment" },
            { id: "p4", familyMemberId: "3", familyMemberName: "Juel", amount: 12000, date: "2024-07-02", details: "" },
            { id: "p5", familyMemberId: "4", familyMemberName: "Suma", amount: 5000, date: "2024-07-03", details: "" },
            { id: "p6", familyMemberId: "5", familyMemberName: "Bibi Howa", amount: 8000, date: "2024-07-04", details: "" },
            { id: "p7", familyMemberId: "1", familyMemberName: "Sabbir", amount: 10000, date: "2024-06-01", details: "" },
            { id: "p8", familyMemberId: "2", familyMemberName: "Sumon", amount: 10000, date: "2024-06-05", details: "" },
            { id: "p9", familyMemberId: "3", familyMemberName: "Juel", amount: 6000, date: "2024-08-02", details: "Advance" },
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


function getDecodedData() {
    const keys = storage.getKeys();
    if (keys.length === 0) {
        // If no properties are set, initialize with default data
        const initialData = getInitialData();
        storage.setProperties(serializeData(initialData), true);
        return initialData;
    }
    
    const data = {};
    keys.forEach(key => {
        try {
            data[key] = JSON.parse(storage.getProperty(key));
        } catch(e) {
            data[key] = storage.getProperty(key);
        }
    });
    return data;
}

function serializeData(data) {
    const serialized = {};
    for (const key in data) {
        serialized[key] = JSON.stringify(data[key]);
    }
    return serialized;
}
