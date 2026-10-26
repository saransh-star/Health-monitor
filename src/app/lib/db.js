import { Pool } from 'pg';

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

export { pool };

export async function sql(strings, ...values) {
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
