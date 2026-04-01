const { Pool } = require('pg');
require('dotenv').config();

// Create PostgreSQL connection pool
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'postit',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

pool.on('error', (err) => {
    console.error('❌ Unexpected error on idle client', err);
});

pool.on('connect', () => {
    console.log('✅ PostgreSQL database connected');
});

// Promisify query methods
const run = async (sql, params = []) => {
    try {
        const result = await pool.query(sql, params);
        return {
            lastID: result.rows[0]?.id,
            changes: result.rowCount
        };
    } catch (error) {
        throw error;
    }
};

const get = async (sql, params = []) => {
    try {
        const result = await pool.query(sql, params);
        return result.rows[0] || null;
    } catch (error) {
        throw error;
    }
};

const all = async (sql, params = []) => {
    try {
        const result = await pool.query(sql, params);
        return result.rows || [];
    } catch (error) {
        throw error;
    }
};

module.exports = { pool, run, get, all };