// A simple web app that acts as a JSON API for a key-value store.
// See the README.md for instructions on how to deploy and use this script.
const storage = PropertiesService.getScriptProperties();
// IMPORTANT: Set a script property named 'PIN_CODE' with your secret 6-digit PIN in Project Settings.

// --- Request Handlers ---

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    
    // The initial PIN check from the UI is the only action allowed without a valid session PIN.
    if (payload.action !== 'checkPin') {
      if (!isPinValid(payload.pin)) {
        return errorResponse('Authentication failed.');
      }
    }

    const result = handlePost(payload);
    return createJsonResponse(result);
  } catch (err) {
    return createJsonResponse(errorResponse(err.message));
  }
}

function doGet(e) {
  try {
    if (!isPinValid(e.parameter.pin)) {
      return createJsonResponse(errorResponse('Authentication failed.'));
    }
    const result = handleGet(e.parameter);
    return createJsonResponse(result);
  } catch (err) {
    return createJsonResponse(errorResponse(err.message));
  }
}

// --- Action Routing ---

function handlePost(payload) {
  if (!payload || !payload.action) {
    return errorResponse('Invalid payload. "action" is missing.');
  }

  const { action, data } = payload;
  
  switch (action) {
    case 'checkPin':
      if (!data || !data.pin) return errorResponse('PIN is required.');
      return isPinValid(data.pin) 
        ? successResponse({ authenticated: true }) 
        : errorResponse('Authentication failed.');

    case 'clearAllData': {
      const pin = storage.getProperty('PIN_CODE');
      storage.deleteAllProperties();
      if (pin) storage.setProperty('PIN_CODE', pin); // Restore PIN
      const initialData = getInitialData();
      storage.setProperties(serializeData(initialData), true);
      return successResponse(getDecodedData());
    }

    case 'updateInitiationDate':
      storage.setProperty('initiationDate', data.date);
      return successResponse(getDecodedData());

    case 'addRenter': case 'addRoom': case 'addRentPayment': case 'addFamilyMember':
    case 'addPayout': case 'addUtilityBill': case 'addExpense':
      return addGeneric(action, data);

    case 'updateRenter': case 'updateRoom': case 'updateRentPayment': case 'updateFamilyMember':
    case 'updatePayout': case 'updateUtilityBill': case 'updateExpense': case 'archiveRenter':
      return updateGeneric(action, data);

    case 'deleteRoom': case 'deleteRentPayment': case 'deleteFamilyMember':
    case 'deletePayout': case 'deleteUtilityBill': case 'deleteExpense':
      return deleteGeneric(action, data);

    default:
      return errorResponse('Invalid action specified.');
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


// --- Generic CRUD Functions ---

function addGeneric(action, itemData) {
  const key = action.replace('add', '').charAt(0).toLowerCase() + action.slice(4) + 's';
  const data = JSON.parse(storage.getProperty(key) || '[]');
  data.push(itemData);
  storage.setProperty(key, JSON.stringify(data));
  return successResponse(getDecodedData());
}

function updateGeneric(action, itemData) {
  const actionPrefix = action.startsWith('update') ? 'update' : 'archive';
  const keyName = action.replace(actionPrefix, '');
  const key = keyName.charAt(0).toLowerCase() + keyName.slice(1) + 's';
  
  const data = JSON.parse(storage.getProperty(key) || '[]');
  const index = data.findIndex(item => item.id === itemData.id);
  if (index !== -1) {
    data[index] = itemData;
    storage.setProperty(key, JSON.stringify(data));
  }
  return successResponse(getDecodedData());
}

function deleteGeneric(action, itemData) {
  const key = action.replace('delete', '').charAt(0).toLowerCase() + action.slice(7) + 's';
  const data = JSON.parse(storage.getProperty(key) || '[]');
  const filteredData = data.filter(item => item.id !== itemData.id);
  storage.setProperty(key, JSON.stringify(filteredData));
  return successResponse(getDecodedData());
}

// --- Utility Functions ---

function isPinValid(pin) {
  const storedPin = storage.getProperty('PIN_CODE');
  if (!storedPin) {
    Logger.log("CRITICAL: PIN_CODE script property is not set.");
    return false;
  }
  return pin === storedPin;
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function successResponse(data) {
  return { status: 'success', data: data };
}

function errorResponse(message) {
  return { status: 'error', message: message };
}

function getInitialData() {
  return {
    familyMembers: [], payouts: [], utilityBills: [], otherExpenses: [],
    rooms: [], renters: [], rentPayments: [],
    initiationDate: new Date('2024-01-01').toISOString(),
  };
}

function getDecodedData() {
  const keys = storage.getKeys();
  if (keys.length === 0 || !storage.getProperty('familyMembers')) {
    const pin = storage.getProperty('PIN_CODE');
    const initialData = getInitialData();
    storage.setProperties(serializeData(initialData), true);
    if (pin) storage.setProperty('PIN_CODE', pin); // Restore PIN
    return initialData;
  }
  
  const data = {};
  keys.forEach(key => {
    if (key === 'PIN_CODE') return; // Don't send PIN to client
    try {
      data[key] = JSON.parse(storage.getProperty(key));
    } catch (e) {
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