const { pool, run } = require('../config/database');

async function initDB() {
    const client = await pool.connect();
    try {
        // Create users table
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'user',
                user_color VARCHAR(7) DEFAULT '#FFD700',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create postits table
        await client.query(`
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

        // ✅ MIGRATION: Ajouter les colonnes manquantes si elles n'existent pas
        await client.query(`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name='users' AND column_name='user_color') THEN
                    ALTER TABLE users ADD COLUMN user_color VARCHAR(7) DEFAULT '#FFD700';
                    RAISE NOTICE 'Column user_color added to users table';
                END IF;
            END $$;
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