'use server';

import { Pool } from 'pg';
import { auth } from '@clerk/nextjs/server';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

async function sql(strings, ...values) {
    const text = strings.reduce((prev, curr, i) => prev + curr + (i < values.length ? `$${i + 1}` : ''), '');
    const { rows } = await pool.query(text, values);
    return rows;
}

// Initialize Database Tables if they don't exist
export async function initDb() {
    try {
        await sql`
            CREATE TABLE IF NOT EXISTS profiles (
                user_id VARCHAR(255) PRIMARY KEY,
                name VARCHAR(255),
                daily_calorie_target INT,
                current_weight FLOAT,
                goal_weight FLOAT,
                height FLOAT,
                activity_level VARCHAR(50),
                unit VARCHAR(10)
            );
        `;
        await sql`
            CREATE TABLE IF NOT EXISTS meals (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id VARCHAR(255) NOT NULL,
                data JSONB NOT NULL,
                timestamp TIMESTAMP DEFAULT NOW()
            );
        `;
        await sql`
            CREATE TABLE IF NOT EXISTS weights (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id VARCHAR(255) NOT NULL,
                weight FLOAT NOT NULL,
                date DATE NOT NULL
            );
        `;
        return { success: true };
    } catch (e) {
        console.error('DB Init Error:', e);
        return { success: false, error: e.message };
    }
}

// ---------- Profile ----------
export async function getProfile() {
    const { userId } = await auth();
    if (!userId) return null;

    try {
        const rows = await sql`SELECT * FROM profiles WHERE user_id = ${userId}`;
        if (rows.length === 0) {
            return {
                name: '',
                dailyCalorieTarget: 1800,
                currentWeight: 0,
                goalWeight: 0,
                height: 0,
                activityLevel: 'moderate',
                unit: 'kg',
            };
        }
        const r = rows[0];
        return {
            name: r.name,
            dailyCalorieTarget: r.daily_calorie_target,
            currentWeight: r.current_weight,
            goalWeight: r.goal_weight,
            height: r.height,
            activityLevel: r.activity_level,
            unit: r.unit,
        };
    } catch (e) {
        if (e.message && e.message.includes('relation "profiles" does not exist')) {
            console.log('Tables do not exist. Initializing...');
            await initDb();
        } else {
            console.error('getProfile Error:', e);
        }
        return null;
    }
}

export async function saveProfile(profile) {
    const { userId } = await auth();
    if (!userId) return { success: false, error: 'Unauthorized' };

    try {
        await sql`
            INSERT INTO profiles (user_id, name, daily_calorie_target, current_weight, goal_weight, height, activity_level, unit)
            VALUES (
                ${userId}, ${profile.name || ''}, ${profile.dailyCalorieTarget || 1800}, 
                ${profile.currentWeight || 0}, ${profile.goalWeight || 0}, ${profile.height || 0}, 
                ${profile.activityLevel || 'moderate'}, ${profile.unit || 'kg'}
            )
            ON CONFLICT (user_id) DO UPDATE SET
                name = EXCLUDED.name,
                daily_calorie_target = EXCLUDED.daily_calorie_target,
                current_weight = EXCLUDED.current_weight,
                goal_weight = EXCLUDED.goal_weight,
                height = EXCLUDED.height,
                activity_level = EXCLUDED.activity_level,
                unit = EXCLUDED.unit;
        `;
        return { success: true };
    } catch (e) {
        console.error('saveProfile Error:', e);
        return { success: false, error: e.message };
    }
}

// ---------- Meals ----------
export async function getAllMeals() {
    const { userId } = await auth();
    if (!userId) return [];

    try {
        const rows = await sql`
            SELECT id, data, timestamp AT TIME ZONE 'UTC' as utc_time
            FROM meals 
            WHERE user_id = ${userId} 
            ORDER BY timestamp DESC
        `;
        return rows.map(r => ({
            id: r.id,
            timestamp: r.utc_time ? r.utc_time.toISOString() : null,
            ...r.data
        }));
    } catch (e) {
        console.error('getAllMeals Error:', e);
        return [];
    }
}

export async function saveMeal(meal, clientTimestamp) {
    const { userId } = await auth();
    if (!userId) return { success: false, error: 'Unauthorized' };

    try {
        const timestamp = clientTimestamp || new Date().toISOString();
        const rows = await sql`
            INSERT INTO meals (user_id, data, timestamp)
            VALUES (${userId}, ${JSON.stringify(meal)}, ${timestamp})
            RETURNING id
        `;
        return { success: true, id: rows[0].id, timestamp };
    } catch (e) {
        console.error('saveMeal Error:', e);
        return { success: false, error: e.message };
    }
}

export async function deleteMeal(id) {
    const { userId } = await auth();
    if (!userId) return { success: false, error: 'Unauthorized' };

    try {
        await sql`DELETE FROM meals WHERE id = ${id} AND user_id = ${userId}`;
        return { success: true };
    } catch (e) {
        console.error('deleteMeal Error:', e);
        return { success: false, error: e.message };
    }
}

// ---------- Weight ----------
export async function getWeightHistory() {
    const { userId } = await auth();
    if (!userId) return [];

    try {
        const rows = await sql`
            SELECT id, weight, date AT TIME ZONE 'UTC' as date 
            FROM weights 
            WHERE user_id = ${userId} 
            ORDER BY date ASC
        `;
        return rows.map(r => ({
            id: r.id,
            weight: r.weight,
            date: r.date ? r.date.toISOString().split('T')[0] : null // We will handle offset in the client
        }));
    } catch (e) {
        console.error('getWeightHistory Error:', e);
        return [];
    }
}

export async function saveWeight(entry) {
    const { userId } = await auth();
    if (!userId) return { success: false, error: 'Unauthorized' };

    try {
        let dateToSave = entry.date;
        if (!dateToSave) {
            const d = new Date();
            if (entry.timezoneOffset !== undefined) {
                d.setMinutes(d.getMinutes() - entry.timezoneOffset);
            }
            dateToSave = d.toISOString().split('T')[0];
        }

        const rows = await sql`
            INSERT INTO weights (user_id, weight, date)
            VALUES (${userId}, ${entry.weight}, ${dateToSave})
            RETURNING id
        `;
        return { success: true, id: rows[0].id, date: dateToSave };
    } catch (e) {
        console.error('saveWeight Error:', e);
        return { success: false, error: e.message };
    }
}

export async function deleteWeight(id) {
    const { userId } = await auth();
    if (!userId) return { success: false, error: 'Unauthorized' };

    try {
        await sql`DELETE FROM weights WHERE id = ${id} AND user_id = ${userId}`;
        return { success: true };
    } catch (e) {
        console.error('deleteWeight Error:', e);
        return { success: false, error: e.message };
    }
}

// ---------- Dashboard ----------
export async function getDashboardStats(timezoneOffset = 0) {
    const meals = await getAllMeals();

    // Daily macros based on client's local "today"
    const now = new Date();
    now.setMinutes(now.getMinutes() - timezoneOffset);
    const todayStr = now.toISOString().split('T')[0];

    // Helper to get local date string of a meal
    const getLocalDateStr = (timestamp) => {
        if (!timestamp) return null;
        const d = new Date(timestamp);
        d.setMinutes(d.getMinutes() - timezoneOffset);
        return d.toISOString().split('T')[0];
    };

    const todayMeals = meals.filter(m => getLocalDateStr(m.timestamp) === todayStr);

    const dailyMacros = {
        calories: todayMeals.reduce((s, m) => s + (m.totalCalories || 0), 0),
        protein: todayMeals.reduce((s, m) => s + (m.totalProtein || 0), 0),
        carbs: todayMeals.reduce((s, m) => s + (m.totalCarbs || 0), 0),
        fat: todayMeals.reduce((s, m) => s + (m.totalFat || 0), 0),
        fiber: todayMeals.reduce((s, m) => s + (m.totalFiber || 0), 0),
    };

    // Streak Calculation
    let streak = 0;

    for (let i = 0; i <= 365; i++) {
        const d = new Date();
        d.setMinutes(d.getMinutes() - timezoneOffset);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];

        const hasMeal = meals.some((m) => getLocalDateStr(m.timestamp) === dateStr);
        if (hasMeal) {
            streak++;
        } else if (i > 0) {
            break; // If a past day has no meals, streak breaks
        }
    }

    return { streak, dailyMacros, recentMeals: todayMeals.slice(0, 3) };
}

// ---------- Analytics ----------
export async function getWeeklyStats(timezoneOffset = 0) {
    const { userId } = await auth();
    if (!userId) return [];

    try {
        // Get meals from the last 7 days
        const rows = await sql`
            SELECT data, timestamp AT TIME ZONE 'UTC' as utc_time
            FROM meals 
            WHERE user_id = ${userId} 
            AND timestamp >= NOW() - INTERVAL '7 days'
            ORDER BY timestamp ASC
        `;

        // Create an array of the last 7 days targeting the client's local timezone
        const statsMap = {};
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setMinutes(d.getMinutes() - timezoneOffset);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const shortDateStr = d.toLocaleDateString('en-US', { weekday: 'short' });

            statsMap[dateStr] = {
                dateStr: shortDateStr, // "Mon", "Tue"
                fullDate: dateStr,
                calories: 0,
                protein: 0,
                carbs: 0,
                fat: 0
            };
        }

        // Aggregate macros per day using client timezone
        rows.forEach(r => {
            if (!r.utc_time) return;
            const mealDate = new Date(r.utc_time);
            mealDate.setMinutes(mealDate.getMinutes() - timezoneOffset);
            const dateStr = mealDate.toISOString().split('T')[0];

            if (statsMap[dateStr]) {
                statsMap[dateStr].calories += (r.data.totalCalories || 0);
                statsMap[dateStr].protein += (r.data.totalProtein || 0);
                statsMap[dateStr].carbs += (r.data.totalCarbs || 0);
                statsMap[dateStr].fat += (r.data.totalFat || 0);
            }
        });

        return Object.values(statsMap);
    } catch (e) {
        console.error('getWeeklyStats Error:', e);
        return [];
    }
}
