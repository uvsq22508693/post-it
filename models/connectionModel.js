const { db, run, get, all } = require('../config/database');

class ConnectionModel {
    // Get all connections
    static async findAll() {
        try {
            const connections = await all(`SELECT * FROM connections`);
            return connections || [];
        } catch (error) {
            console.error('Error fetching connections:', error);
            throw error;
        }
    }

    // Create a connection
    static async create(fromPostId, toPostId) {
        try {
            const result = await run(
                `INSERT INTO connections (from_post_id, to_post_id) VALUES (?, ?)`,
                [fromPostId, toPostId]
            );
            return result.lastID;
        } catch (error) {
            console.error('Error creating connection:', error);
            throw error;
        }
    }

    // Delete a connection (bidirectional)
    static async delete(fromPostId, toPostId) {
        try {
            // Delete in both directions
            await run(
                `DELETE FROM connections WHERE (from_post_id = ? AND to_post_id = ?) OR (from_post_id = ? AND to_post_id = ?)`,
                [fromPostId, toPostId, toPostId, fromPostId]
            );
            return true;
        } catch (error) {
            console.error('Error deleting connection:', error);
            throw error;
        }
    }

    // Check if connection exists (bidirectional)
    static async exists(postId1, postId2) {
        try {
            const connection = await get(
                `SELECT id FROM connections WHERE (from_post_id = ? AND to_post_id = ?) OR (from_post_id = ? AND to_post_id = ?)`,
                [postId1, postId2, postId2, postId1]
            );
            return !!connection;
        } catch (error) {
            console.error('Error checking connection:', error);
            throw error;
        }
    }
}

module.exports = ConnectionModel;
