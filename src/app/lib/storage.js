'use client';

const KEYS = {
    MEALS: 'hm_meals',
    PROFILE: 'hm_profile',
    WEIGHTS: 'hm_weights',
};

function getItem(key, fallback = null) {
    if (typeof window === 'undefined') return fallback;
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
}

function setItem(key, value) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
}

// ---------- Profile ----------
export function getProfile() {
    return getItem(KEYS.PROFILE, {
        name: '',
        dailyCalorieTarget: 1800,
        currentWeight: 0,
        goalWeight: 0,
        height: 0,
        activityLevel: 'moderate',
        unit: 'kg',
    });
}

export function saveProfile(profile) {
    setItem(KEYS.PROFILE, profile);
}

// ---------- Meals ----------
export function getAllMeals() {
    return getItem(KEYS.MEALS, []);
}

export function saveMeal(meal) {
    const meals = getAllMeals();
    const newMeal = {
        ...meal,
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
    };
    meals.unshift(newMeal);
    setItem(KEYS.MEALS, meals);
    return newMeal;
}

export function deleteMeal(id) {
    const meals = getAllMeals().filter((m) => m.id !== id);
    setItem(KEYS.MEALS, meals);
}

export function getMealsForDate(dateStr) {
    const target = dateStr || new Date().toISOString().split('T')[0];
    return getAllMeals().filter((m) => m.timestamp.startsWith(target));
}

export function getDailyCalories(dateStr) {
    return getMealsForDate(dateStr).reduce((sum, m) => sum + (m.totalCalories || 0), 0);
}

export function getDailyMacros(dateStr) {
    const meals = getMealsForDate(dateStr);
    return {
        protein: meals.reduce((s, m) => s + (m.totalProtein || 0), 0),
        carbs: meals.reduce((s, m) => s + (m.totalCarbs || 0), 0),
        fat: meals.reduce((s, m) => s + (m.totalFat || 0), 0),
        fiber: meals.reduce((s, m) => s + (m.totalFiber || 0), 0),
    };
}

// ---------- Weight ----------
export function getWeightHistory() {
    return getItem(KEYS.WEIGHTS, []);
}

export function saveWeight(entry) {
    const weights = getWeightHistory();
    weights.push({
        ...entry,
        id: crypto.randomUUID(),
        date: entry.date || new Date().toISOString().split('T')[0],
    });
    // sort by date
    weights.sort((a, b) => a.date.localeCompare(b.date));
    setItem(KEYS.WEIGHTS, weights);
}

export function deleteWeight(id) {
    const weights = getWeightHistory().filter((w) => w.id !== id);
    setItem(KEYS.WEIGHTS, weights);
}

// ---------- Streak ----------
export function getStreak() {
    const meals = getAllMeals();
    if (meals.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i <= 365; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const hasMeal = meals.some((m) => m.timestamp.startsWith(dateStr));
        if (hasMeal) {
            streak++;
        } else if (i > 0) {
            break;
        }
    }
    return streak;
}

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

export async function savePendingUpload(imageString, mimeType = 'image/jpeg', description = '') {
    try {
        const db = await initDB();
        if (!db) return;

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            const item = {
                id: Date.now().toString(),
                image: imageString,
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
