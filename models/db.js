const { pool, run } = require('../config/database');

async function initDB() {
    const client = await pool.connect();
    try {
        // Create users table
        await run(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create postits table
        await run(`
            CREATE TABLE IF NOT EXISTS postits (
                id SERIAL PRIMARY KEY,
                text TEXT NOT NULL,
                x INTEGER NOT NULL,
                y INTEGER NOT NULL,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create connections table
        await run(`
            CREATE TABLE IF NOT EXISTS connections (
                id SERIAL PRIMARY KEY,
                from_post_id INTEGER NOT NULL REFERENCES postits(id) ON DELETE CASCADE,
                to_post_id INTEGER NOT NULL REFERENCES postits(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(from_post_id, to_post_id)
            )
        `);

        console.log('✅ Database initialized (PostgreSQL)');
    } catch (error) {
        console.error('❌ Database initialization error:', error);
        throw error;
    } finally {
        client.release();
    }
}

module.exports = { initDB };