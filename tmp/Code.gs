// A simple web app that acts as a JSON API for a key-value store.
// See the README.md for instructions on how to deploy and use this script.
const storage = PropertiesService.getScriptProperties();

// --- Initialization ---
function initialize() {
    if (!storage.getProperty('ADMIN_PIN')) {
        storage.setProperty('ADMIN_PIN', '');
        storage.setProperty('READ_ONLY_PIN', '');
        console.log("Default PINs have been set.");
    }
    if (storage.getKeys().length < 3) { // Check if data is uninitialized
        const initialData = getInitialData();
        storage.setProperties(serializeData(initialData), true);
        console.log("Initial data has been loaded.");
    }
}

// --- Core Handlers ---

function doGet(e) {
  try {
    initialize(); // Ensure PINs and data are set
    const params = e.parameter;
    
    // Authenticate request
    if (!checkPin(params.pin)) {
        return errorResponse('Authentication failed.');
    }

    if (!params || !params.action) {
        return errorResponse('Invalid parameters. "action" is missing.');
    }

    let result;
    switch (params.action) {
        case 'sync':
            result = successResponse(getDecodedData());
            break;
        default:
            result = errorResponse('Invalid action specified.');
            break;
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return errorResponse(err.message, true);
  }
}


function doPost(e) {
  try {
    initialize(); // Ensure PINs and data are set
    const payload = JSON.parse(e.postData.contents);
    if (!payload || !payload.action) {
        return errorResponse('Invalid payload. "action" is missing.');
    }
    
    const accessLevel = checkPin(payload.pin);

    // Authenticate request
    if (payload.action !== 'checkPin' && !accessLevel) {
        return errorResponse('Authentication failed.');
    }

    // Enforce read-only access for write operations
    const isWriteAction = !['checkPin', 'sync'].includes(payload.action);
    if (isWriteAction && accessLevel !== 'admin') {
        return errorResponse('Permission denied. Read-only access.');
    }

    let result;
    switch (payload.action) {
        case 'checkPin':
            const loginPin = payload.data.pin;
            const level = checkPin(loginPin);
            if (level) {
                result = successResponse({ authenticated: true, accessLevel: level });
            } else {
                result = errorResponse('Invalid PIN.');
            }
            break;
            
        case 'clearAllData':
            result = handleClearAllData();
            break;

        case 'updateInitiationDate':
            result = handleUpdateInitiationDate(payload.data);
            break;

        // Generic Handlers
        default:
            if (payload.action.startsWith('add')) {
                result = handleAddItem(payload.action, payload.data);
            } else if (payload.action.startsWith('update') || payload.action.startsWith('archive')) {
                result = handleUpdateItem(payload.action, payload.data);
            } else if (payload.action.startsWith('delete')) {
                result = handleDeleteItem(payload.action, payload.data);
            } else {
                result = errorResponse('Invalid action specified.');
            }
            break;
    }
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return errorResponse(err.message, true);
  }
}

// --- Action Logic ---

function handleAddItem(action, itemData) {
    const key = getKeyFromAction(action, 'add');
    const data = JSON.parse(storage.getProperty(key) || '[]');
    data.push(itemData);
    storage.setProperty(key, JSON.stringify(data));
    return successResponse(getDecodedData());
}

function handleUpdateItem(action, itemData) {
    const key = getKeyFromAction(action, ['update', 'archive']);
    const data = JSON.parse(storage.getProperty(key) || '[]');
    const index = data.findIndex(item => item.id === itemData.id);
    if (index !== -1) {
        data[index] = itemData;
        storage.setProperty(key, JSON.stringify(data));
    }
    return successResponse(getDecodedData());
}

function handleDeleteItem(action, itemData) {
    const key = getKeyFromAction(action, 'delete');
    const data = JSON.parse(storage.getProperty(key) || '[]');
    const filteredData = data.filter(item => item.id !== itemData.id);
    storage.setProperty(key, JSON.stringify(filteredData));
    return successResponse(getDecodedData());
}

function handleClearAllData() {
    const adminPin = storage.getProperty('ADMIN_PIN');
    const readOnlyPin = storage.getProperty('READ_ONLY_PIN');
    storage.deleteAllProperties();
    storage.setProperty('ADMIN_PIN', adminPin);
    storage.setProperty('READ_ONLY_PIN', readOnlyPin);
    const initialData = getInitialData();
    storage.setProperties(serializeData(initialData), true);
    return successResponse(initialData);
}

function handleUpdateInitiationDate(data) {
    storage.setProperty('initiationDate', data.date);
    return successResponse(getDecodedData());
}

// --- Helpers ---

function getKeyFromAction(action, prefix) {
    let modelName;
    if (Array.isArray(prefix)) {
        const foundPrefix = prefix.find(p => action.startsWith(p));
        modelName = action.substring(foundPrefix.length);
    } else {
        modelName = action.substring(prefix.length);
    }

    if (modelName === 'Expense') {
        return 'otherExpenses';
    }
    
    return modelName.charAt(0).toLowerCase() + modelName.slice(1) + 's';
}


function checkPin(pinFromRequest) {
    if (!pinFromRequest) return false;
    const adminPin = storage.getProperty('ADMIN_PIN');
    const readOnlyPin = storage.getProperty('READ_ONLY_PIN');
    
    if (pinFromRequest === adminPin) {
        return 'admin';
    }
    if (pinFromRequest === readOnlyPin) {
        return 'readonly';
    }
    return false;
}

function successResponse(data) {
  return { status: 'success', data: data };
}

function errorResponse(message, asTextOutput = false) {
  const response = { status: 'error', message: message };
  if (asTextOutput) {
     return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
  }
  return response;
}

function getDecodedData() {
    const keys = storage.getKeys();
    if (keys.length === 0 || !storage.getProperty('initiationDate')) {
        // If no properties are set, initialize with default data
        const initialData = getInitialData();
        storage.setProperties(serializeData(initialData), true);
        return initialData;
    }
    
    const data = {};
    keys.forEach(key => {
        try {
            // Don't include PINs in the data sync
            if (key !== 'ADMIN_PIN' && key !== 'READ_ONLY_PIN' && key !== 'PIN_CODE') {
                data[key] = JSON.parse(storage.getProperty(key));
            }
        } catch(e) {
            if (key !== 'ADMIN_PIN' && key !== 'READ_ONLY_PIN' && key !== 'PIN_CODE') {
               data[key] = storage.getProperty(key);
            }
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

function getInitialData() {
  return {
    familyMembers: [],
    payouts: [],
    utilityBills: [],
    otherExpenses: [],
    rooms: [],
    renters: [],
    rentPayments: [],
    initiationDate: new Date(new Date().getFullYear(), 0, 1).toISOString(), // Default to Jan 1st of current year
  };
}
