'use client';

// ---------- Offline Queue (IndexedDB) ----------
const DB_NAME = 'NutriSnapDB';
const DB_VERSION = 1;
const STORE_NAME = 'pendingUploads';

function initDB() {
    return new Promise((resolve, reject) => {
        if (typeof window === 'undefined') return resolve(null);

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
    });
}

export async function savePendingUpload(imagesArray, mimeType = 'image/jpeg', description = '') {
    try {
        const db = await initDB();
        if (!db) return;

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            const item = {
                id: Date.now().toString(),
                images: imagesArray,
                mimeType,
                description,
                timestamp: new Date().toISOString()
            };

            const request = store.add(item);
            request.onsuccess = () => resolve(item.id);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('Failed to save pending upload:', error);
    }
}

export async function getPendingUploads() {
    try {
        const db = await initDB();
        if (!db) return [];

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('Failed to get pending uploads:', error);
        return [];
    }
}

export async function removePendingUpload(id) {
    try {
        const db = await initDB();
        if (!db) return;

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('Failed to remove pending upload:', error);
    }
}
