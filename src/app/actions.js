'use server';

import { Pool } from 'pg';
import { auth } from '@clerk/nextjs/server';

// Global Singleton Pool pattern for development & serverless reuse
let pool;
if (process.env.NODE_ENV === 'production') {
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
    });
} else {
    if (!global.__pgPool) {
        global.__pgPool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false },
            max: 5,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 5000,
        });
    }
    pool = global.__pgPool;
}

async function sql(strings, ...values) {
    const text = strings.reduce((prev, curr, i) => prev + curr + (i < values.length ? `$${i + 1}` : ''), '');
    const { rows } = await pool.query(text, values);
    return rows;
}

// Initialize Database Tables and Indexes for optimal query performance
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
        // High-performance composite indexes for O(1)/O(log N) lookup
        await sql`CREATE INDEX IF NOT EXISTS idx_meals_user_timestamp ON meals(user_id, timestamp DESC);`;
        await sql`CREATE INDEX IF NOT EXISTS idx_weights_user_date ON weights(user_id, date DESC);`;

        return { success: true };
    } catch (e) {
        console.error('DB Init Error:', e);
        return { success: false, error: e.message };
    }
}

// ---------- Combined Fast Dashboard Bundle (1 roundtrip, 1 auth check) ----------
export async function getDashboardBundle(timezoneOffset = 0, targetDate = null) {
    const now = new Date();
    now.setMinutes(now.getMinutes() - timezoneOffset);
    const todayStr = now.toISOString().split('T')[0];
    const effectiveDateStr = targetDate || todayStr;

    const { userId } = await auth();

    // Fast static fallback for demo / signed-out preview (0ms latency)
    if (!userId) {
        const profile = {
            name: 'Saransh',
            dailyCalorieTarget: 1800,
            currentWeight: 75,
            goalWeight: 70,
            height: 175,
            activityLevel: 'moderate',
            unit: 'kg',
        };

        const demoMeals = [
            {
                id: 'demo-meal-1',
                timestamp: new Date().toISOString(),
                totalCalories: 1100,
                totalProtein: 27,
                totalCarbs: 140,
                totalFat: 49,
                totalFiber: 16,
                healthScore: 6,
                foods: [
                    { name: 'Bhatura (Deep-fried puffed bread)', calories: 720, protein: 12, carbs: 86, fat: 38, fiber: 4 },
                    { name: 'Chole (Chickpea Curry)', calories: 320, protein: 15, carbs: 54, fat: 11, fiber: 12 },
                    { name: 'Onion, Green Chutney & Pickle', calories: 60, protein: 0, carbs: 0, fat: 0, fiber: 0 },
                ]
            }
        ];

        const weekly = [];
        const baseCalories = [1750, 1820, 1690, 1910, 1780, 1850, 1100];
        const baseProteins = [125, 140, 118, 138, 132, 142, 68];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setMinutes(d.getMinutes() - timezoneOffset);
            d.setDate(d.getDate() - i);
            weekly.push({
                dateStr: d.toLocaleDateString('en-US', { weekday: 'short' }),
                fullDate: d.toISOString().split('T')[0],
                calories: baseCalories[6 - i],
                protein: baseProteins[6 - i],
                carbs: Math.round((baseCalories[6 - i] * 0.42) / 4),
                fat: Math.round((baseCalories[6 - i] * 0.26) / 9),
                fiber: Math.round(baseCalories[6 - i] * 0.015),
            });
        }

        return {
            profile,
            stats: {
                streak: 1,
                dailyMacros: { calories: 1100, protein: 27, carbs: 140, fat: 49, fiber: 16 },
                recentMeals: demoMeals,
                dateStr: effectiveDateStr,
            },
            weeklyStats: weekly,
        };
    }

    try {
        // Execute profile and recent meals in parallel with 1 connection
        const [profileRows, mealRows] = await Promise.all([
            sql`SELECT * FROM profiles WHERE user_id = ${userId}`,
            sql`
                SELECT id, data, timestamp AT TIME ZONE 'UTC' as utc_time
                FROM meals 
                WHERE user_id = ${userId} 
                AND timestamp >= NOW() - INTERVAL '35 days'
                ORDER BY timestamp DESC
            `
        ]);

        const r = profileRows[0] || {};
        const profile = {
            name: r.name || 'Saransh',
            dailyCalorieTarget: r.daily_calorie_target || 1800,
            currentWeight: r.current_weight || 75,
            goalWeight: r.goal_weight || 70,
            height: r.height || 175,
            activityLevel: r.activity_level || 'moderate',
            unit: r.unit || 'kg',
        };

        const getLocalDateStr = (timestamp) => {
            if (!timestamp) return null;
            const d = new Date(timestamp);
            d.setMinutes(d.getMinutes() - timezoneOffset);
            return d.toISOString().split('T')[0];
        };

        const meals = mealRows.map(row => ({
            id: row.id,
            timestamp: row.utc_time ? row.utc_time.toISOString() : null,
            ...row.data
        }));

        const targetDayMeals = meals.filter(m => getLocalDateStr(m.timestamp) === effectiveDateStr);

        const dailyMacros = {
            calories: targetDayMeals.reduce((s, m) => s + (m.totalCalories || 0), 0),
            protein: targetDayMeals.reduce((s, m) => s + (m.totalProtein || 0), 0),
            carbs: targetDayMeals.reduce((s, m) => s + (m.totalCarbs || 0), 0),
            fat: targetDayMeals.reduce((s, m) => s + (m.totalFat || 0), 0),
            fiber: targetDayMeals.reduce((s, m) => s + (m.totalFiber || 0), 0),
        };

        // Fast streak calculation over the last 35 days
        let streak = 0;
        for (let i = 0; i <= 35; i++) {
            const d = new Date();
            d.setMinutes(d.getMinutes() - timezoneOffset);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];

            const hasMeal = meals.some((m) => getLocalDateStr(m.timestamp) === dateStr);
            if (hasMeal) {
                streak++;
            } else if (i > 0) {
                break;
            }
        }

        // Weekly stats for the last 7 days derived directly from loaded meals
        const statsMap = {};
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setMinutes(d.getMinutes() - timezoneOffset);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            statsMap[dateStr] = {
                dateStr: d.toLocaleDateString('en-US', { weekday: 'short' }),
                fullDate: dateStr,
                calories: 0,
                protein: 0,
                carbs: 0,
                fat: 0,
                fiber: 0
            };
        }

        meals.forEach(m => {
            if (!m.timestamp) return;
            const dateStr = getLocalDateStr(m.timestamp);
            if (statsMap[dateStr]) {
                statsMap[dateStr].calories += (m.totalCalories || 0);
                statsMap[dateStr].protein += (m.totalProtein || 0);
                statsMap[dateStr].carbs += (m.totalCarbs || 0);
                statsMap[dateStr].fat += (m.totalFat || 0);
                statsMap[dateStr].fiber += (m.totalFiber || 0);
            }
        });

        return {
            profile,
            stats: {
                streak,
                dailyMacros,
                recentMeals: targetDayMeals,
                dateStr: effectiveDateStr,
            },
            weeklyStats: Object.values(statsMap),
        };
    } catch (e) {
        if (e.message && e.message.includes('relation "profiles" does not exist')) {
            await initDb();
        }
        console.error('getDashboardBundle Error:', e);
        return {
            profile: { name: 'Saransh', dailyCalorieTarget: 1800, currentWeight: 75, goalWeight: 70, unit: 'kg' },
            stats: { streak: 0, dailyMacros: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }, recentMeals: [], dateStr: effectiveDateStr },
            weeklyStats: [],
        };
    }
}

// ---------- Profile ----------
export async function getProfile() {
    const { userId } = await auth();
    if (!userId) {
        return {
            name: 'Saransh',
            dailyCalorieTarget: 1800,
            currentWeight: 75,
            goalWeight: 70,
            height: 175,
            activityLevel: 'moderate',
            unit: 'kg',
        };
    }

    try {
        const rows = await sql`SELECT * FROM profiles WHERE user_id = ${userId}`;
        if (rows.length === 0) {
            return {
                name: 'Saransh',
                dailyCalorieTarget: 1800,
                currentWeight: 75,
                goalWeight: 70,
                height: 175,
                activityLevel: 'moderate',
                unit: 'kg',
            };
        }
        const r = rows[0];
        return {
            name: r.name || 'Saransh',
            dailyCalorieTarget: r.daily_calorie_target || 1800,
            currentWeight: r.current_weight || 75,
            goalWeight: r.goal_weight || 70,
            height: r.height || 175,
            activityLevel: r.activity_level || 'moderate',
            unit: r.unit || 'kg',
        };
    } catch (e) {
        if (e.message && e.message.includes('relation "profiles" does not exist')) {
            await initDb();
        } else {
            console.error('getProfile Error:', e);
        }
        return {
            name: 'Saransh',
            dailyCalorieTarget: 1800,
            currentWeight: 75,
            goalWeight: 70,
            height: 175,
            activityLevel: 'moderate',
            unit: 'kg',
        };
    }
}

export async function saveProfile(profile) {
    const { userId } = await auth();
    if (!userId) return { success: true, localOnly: true };

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
    if (!userId) {
        const now = new Date();
        const lunchTime = new Date(now.getTime() - 2 * 3600000).toISOString();
        const snackTime = new Date(now.getTime() - 4 * 3600000).toISOString();
        const bfastTime = new Date(now.getTime() - 6 * 3600000).toISOString();

        return [
            {
                id: 'demo-meal-1',
                timestamp: lunchTime,
                totalCalories: 450,
                totalProtein: 32,
                totalCarbs: 48,
                totalFat: 14,
                totalFiber: 6,
                healthScore: 9,
                weightLossTip: 'Balanced protein-fiber ratio sustains stable afternoon glucose levels.',
                healthierAlternative: 'Swap processed dressings for lemon juice and extra virgin olive oil.',
                foods: [
                    { name: 'Mediterranean Chicken & Quinoa Bowl', portion: '1 bowl (320g)', calories: 450, protein: 32, carbs: 48, fat: 14, fiber: 6 }
                ]
            },
            {
                id: 'demo-meal-2',
                timestamp: snackTime,
                totalCalories: 270,
                totalProtein: 14,
                totalCarbs: 35,
                totalFat: 8,
                totalFiber: 5,
                healthScore: 8,
                weightLossTip: 'Natural dietary fiber from mixed berries moderates energy absorption.',
                healthierAlternative: 'Add raw chia seeds for essential Omega-3 fatty acids.',
                foods: [
                    { name: 'Greek Yogurt with Blueberries & Almonds', portion: '1 cup (200g)', calories: 270, protein: 14, carbs: 35, fat: 8, fiber: 5 }
                ]
            },
            {
                id: 'demo-meal-3',
                timestamp: bfastTime,
                totalCalories: 380,
                totalProtein: 22,
                totalCarbs: 38,
                totalFat: 15,
                totalFiber: 5,
                healthScore: 9,
                weightLossTip: 'Solid morning protein base prevents insulin spikes and mid-morning fatigue.',
                healthierAlternative: 'Opt for sprouted whole-grain sourdough for easier digestion.',
                foods: [
                    { name: 'Poached Eggs on Sourdough with Avocado', portion: '2 eggs + 1 slice', calories: 380, protein: 22, carbs: 38, fat: 15, fiber: 5 }
                ]
            }
        ];
    }

    try {
        const rows = await sql`
            SELECT id, data, timestamp AT TIME ZONE 'UTC' as utc_time
            FROM meals 
            WHERE user_id = ${userId} 
            ORDER BY timestamp DESC
            LIMIT 100
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
            LIMIT 100
        `;
        return rows.map(r => ({
            id: r.id,
            weight: r.weight,
            date: r.date ? r.date.toISOString().split('T')[0] : null
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

export async function getDashboardStats(timezoneOffset = 0, targetDate = null) {
    const bundle = await getDashboardBundle(timezoneOffset, targetDate);
    return bundle.stats;
}

// ---------- Analytics ----------
export async function getWeeklyStats(timezoneOffset = 0, days = 7) {
    const { userId } = await auth();
    const safeDays = Math.min(Math.max(parseInt(days, 10) || 7, 7), 90);

    if (!userId) {
        const sampleDays = [];
        const baseCalories = [1750, 1820, 1690, 1910, 1780, 1850, 1720, 1800];
        const baseProteins = [125, 140, 118, 138, 132, 142, 128, 135];
        for (let i = safeDays - 1; i >= 0; i--) {
            const d = new Date();
            d.setMinutes(d.getMinutes() - timezoneOffset);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const shortDateStr = safeDays <= 14 
                ? d.toLocaleDateString('en-US', { weekday: 'short' })
                : d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
            const cal = i === 0 ? 1100 : baseCalories[i % baseCalories.length];
            const pro = i === 0 ? 68 : baseProteins[i % baseProteins.length];
            sampleDays.push({
                dateStr: shortDateStr,
                fullDate: dateStr,
                calories: cal,
                protein: pro,
                carbs: Math.round((cal * 0.42) / 4),
                fat: Math.round((cal * 0.26) / 9),
                fiber: Math.round(cal * 0.015),
            });
        }
        return sampleDays;
    }

    try {
        const rows = await sql`
            SELECT data, timestamp AT TIME ZONE 'UTC' as utc_time
            FROM meals 
            WHERE user_id = ${userId} 
            AND timestamp >= NOW() - (${safeDays} || ' days')::INTERVAL
            ORDER BY timestamp ASC
        `;

        const statsMap = {};
        for (let i = safeDays - 1; i >= 0; i--) {
            const d = new Date();
            d.setMinutes(d.getMinutes() - timezoneOffset);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const shortDateStr = safeDays <= 14 
                ? d.toLocaleDateString('en-US', { weekday: 'short' })
                : d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });

            statsMap[dateStr] = {
                dateStr: shortDateStr,
                fullDate: dateStr,
                calories: 0,
                protein: 0,
                carbs: 0,
                fat: 0,
                fiber: 0
            };
        }

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
                statsMap[dateStr].fiber += (r.data.totalFiber || 0);
            }
        });

        return Object.values(statsMap);
    } catch (e) {
        console.error('getWeeklyStats Error:', e);
        return [];
    }
}
