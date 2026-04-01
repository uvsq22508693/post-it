const { db, run } = require('../config/database');

async function initDB() {
    try {
        // Create users table
        await run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                user_color TEXT DEFAULT NULL,
                role TEXT DEFAULT 'user',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Add user_color column if it doesn't exist (migration for existing users)
        try {
            await run(`ALTER TABLE users ADD COLUMN user_color TEXT DEFAULT NULL`);
        } catch (err) {
            // Column already exists, ignore error
        }

        // Create postits table
        await run(`
            CREATE TABLE IF NOT EXISTS postits (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                text TEXT NOT NULL,
                x INTEGER NOT NULL,
                y INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Create connections table
        await run(`
            CREATE TABLE IF NOT EXISTS connections (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                from_post_id INTEGER NOT NULL,
                to_post_id INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (from_post_id) REFERENCES postits(id) ON DELETE CASCADE,
                FOREIGN KEY (to_post_id) REFERENCES postits(id) ON DELETE CASCADE,
                UNIQUE(from_post_id, to_post_id)
            )
        `);

        console.log('✅ Database initialized');
    } catch (error) {
        console.error('❌ Database initialization error:', error);
    }
}

module.exports = { initDB };