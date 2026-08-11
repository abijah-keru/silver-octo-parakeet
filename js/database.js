// js/database.js

const DB_NAME = 'phr_database';
const DB_VERSION = 5; // Bumped to 5 for Current Health table

let dbInstance = null;

export function initDatabase() {
    return new Promise((resolve, reject) => {
        if (dbInstance) return resolve(dbInstance);

        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = (event) => reject(event.target.error);
        request.onsuccess = (event) => {
            dbInstance = event.target.result;
            resolve(dbInstance);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            if (!db.objectStoreNames.contains('profile')) {
                db.createObjectStore('profile', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('records')) {
                const recordStore = db.createObjectStore('records', { keyPath: 'id' });
                recordStore.createIndex('date', 'date', { unique: false });
                recordStore.createIndex('type', 'type', { unique: false });
            }
            // Create the Documents Store
            if (!db.objectStoreNames.contains('documents')) {
                const docStore = db.createObjectStore('documents', { keyPath: 'id' });
                docStore.createIndex('createdAt', 'createdAt', { unique: false });
            }
            // Create the Current Health Store
            if (!db.objectStoreNames.contains('current_health')) {
                db.createObjectStore('current_health', { keyPath: 'id' });
            }
        };
    });
}

function runTransaction(storeName, mode, callback) {
    return new Promise((resolve, reject) => {
        const transaction = dbInstance.transaction([storeName], mode);
        const store = transaction.objectStore(storeName);
        const request = callback(store);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// --- Common ---
export function generateId(prefix = 'id') {
    return prefix + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// --- Profile Methods ---
export function getProfile() {
    return runTransaction('profile', 'readonly', (store) => store.get(1));
}
export function saveProfile(profileData) {
    const dataToSave = { ...profileData, id: 1, updatedAt: new Date().toISOString() };
    return runTransaction('profile', 'readwrite', (store) => store.put(dataToSave));
}

// --- Records Methods ---
export async function getRecords() {
    const records = await runTransaction('records', 'readonly', (store) => store.getAll());
    return records.filter(r => !r.isDeleted).sort((a, b) => new Date(b.date) - new Date(a.date));
}
export async function getRecordById(id) {
    return runTransaction('records', 'readonly', (store) => store.get(id));
}
export async function saveRecord(recordData) {
    const isNew = !recordData.id;
    const dataToSave = { 
        ...recordData, 
        id: isNew ? generateId('rec') : recordData.id,
        createdAt: isNew ? new Date().toISOString() : recordData.createdAt,
        updatedAt: new Date().toISOString(),
        isDeleted: false,
        version: isNew ? 1 : (recordData.version || 1) + 1,
        linkedDocumentIds: recordData.linkedDocumentIds || [] // <-- M:N Array Added
    };
    return runTransaction('records', 'readwrite', (store) => store.put(dataToSave));
}

// --- Documents Methods ---
export async function getDocuments() {
    const docs = await runTransaction('documents', 'readonly', (store) => store.getAll());
    return docs.filter(d => !d.isDeleted).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}
export async function getDocumentById(id) {
    return runTransaction('documents', 'readonly', (store) => store.get(id));
}
export async function saveDocument(docData) {
    const isNew = !docData.id;
    const dataToSave = {
        ...docData,
        id: isNew ? generateId('doc') : docData.id,
        createdAt: isNew ? new Date().toISOString() : docData.createdAt,
        isDeleted: false,
        linkedRecordIds: docData.linkedRecordIds || [] // <-- M:N Array Added
    };
    return runTransaction('documents', 'readwrite', (store) => store.put(dataToSave));
}

// --- Relationship Linking Methods ---
// Bidirectionally ties a Document and a Record together
export async function linkDocumentAndRecord(docId, recordId) {
    const doc = await getDocumentById(docId);
    const rec = await getRecordById(recordId);
    
    if (doc && rec) {
        if (!doc.linkedRecordIds) doc.linkedRecordIds = [];
        if (!rec.linkedDocumentIds) rec.linkedDocumentIds = [];
        
        let needsUpdateDoc = false;
        let needsUpdateRec = false;

        // Add IDs if they don't already exist
        if (!doc.linkedRecordIds.includes(recordId)) {
            doc.linkedRecordIds.push(recordId);
            needsUpdateDoc = true;
        }
        if (!rec.linkedDocumentIds.includes(docId)) {
            rec.linkedDocumentIds.push(docId);
            needsUpdateRec = true;
        }

        // Save them back to the database
        if (needsUpdateDoc) await saveDocument(doc);
        if (needsUpdateRec) await saveRecord(rec);
    }
}

// --- Current Health Methods ---
export async function getCurrentHealth() {
    let data = await runTransaction('current_health', 'readonly', (store) => store.get(1));
    // Return a default structure if it's a new user or hasn't been created yet
    if (!data) {
        data = { id: 1, allergies: [], conditions: [], medications: [], lifestyle: {} };
    }
    return data;
}

export function saveCurrentHealth(healthData) {
    const dataToSave = { ...healthData, id: 1, updatedAt: new Date().toISOString() };
    return runTransaction('current_health', 'readwrite', (store) => store.put(dataToSave));
}