const { run, get, all } = require('../config/database');

class PostModel {
    // Create post
    static async create(text, x, y, userId) {
        const result = await run(
            'INSERT INTO postits (text, x, y, user_id) VALUES ($1, $2, $3, $4) RETURNING id',
            [text, x, y, userId]
        );
        return result.lastID;
    }

    // Get all posts
    static async findAll() {
        return await all(`
            SELECT p.*, u.username 
            FROM postits p 
            JOIN users u ON p.user_id = u.id 
            ORDER BY p.created_at DESC
        `);
    }

    // Get post by ID
    static async findById(id) {
        return await get(`
            SELECT p.*, u.username 
            FROM postits p 
            JOIN users u ON p.user_id = u.id 
            WHERE p.id = $1
        `, [id]);
    }

    // Delete post
    static async delete(id, userId, isAdmin = false) {
        let query = 'DELETE FROM postits WHERE id = $1';
        let params = [id];

        if (!isAdmin) {
            query += ' AND user_id = $2';
            params.push(userId);
        }

        const result = await run(query, params);
        return result.changes > 0;
    }

    // Update post
    static async update(id, text, userId, isAdmin = false) {
        let query = 'UPDATE postits SET text = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2';
        let params = [text, id];

        if (!isAdmin) {
            query += ' AND user_id = $3';
            params.push(userId);
        }

        const result = await run(query, params);
        return result.changes > 0;
    }

    // Update position
    static async updatePosition(id, x, y, userId, isAdmin = false) {
        let query = 'UPDATE postits SET x = $1, y = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3';
        let params = [x, y, id];

        if (!isAdmin) {
            query += ' AND user_id = $4';
            params.push(userId);
        }

        const result = await run(query, params);
        return result.changes > 0;
    }
}

module.exports = PostModel;