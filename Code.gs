// A simple web app that acts as a JSON API for a key-value store.
// See the README.md for instructions on how to deploy and use this script.
const storage = PropertiesService.getScriptProperties();

// --- Core Handlers ---

function doGet(e) {
  try {
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
    const payload = JSON.parse(e.postData.contents);
    if (!payload || !payload.action) {
        return errorResponse('Invalid payload. "action" is missing.');
    }
    
    // Authenticate request
    if (payload.action !== 'checkPin' && !checkPin(payload.pin)) {
        return errorResponse('Authentication failed.');
    }

    let result;
    switch (payload.action) {
        case 'checkPin':
            result = checkPin(payload.data.pin) 
                ? successResponse({ authenticated: true })
                : errorResponse('Invalid PIN.');
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
    storage.deleteAllProperties();
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
    const storedPin = storage.getProperty('PIN_CODE');
    if (!storedPin) {
        // Set a default PIN if not present for first-time setup
        const defaultPin = '123456';
        storage.setProperty('PIN_CODE', defaultPin);
        console.log(`PIN_CODE not found. A default PIN "${defaultPin}" has been set. Please change it in Project Settings > Script Properties for security.`);
        return pinFromRequest === defaultPin;
    }
    return pinFromRequest === storedPin;
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
