const { run, get, all } = require('../config/database');
const bcrypt = require('bcrypt');

class UserModel {
    // Create user
    static async create(username, password, role = 'user') {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await run(
            'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
            [username, hashedPassword, role]
        );
        return result.lastID;
    }

    // Find user by username
    static async findByUsername(username) {
        return await get(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );
    }

    // Find by ID
    static async findById(id) {
        return await get(
            'SELECT id, username, role FROM users WHERE id = ?',
            [id]
        );
    }

    // Verify password
    static async verifyPassword(username, password) {
        const user = await this.findByUsername(username);
        if (!user) return null;

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return null;

        return user;
    }

    // Update role
    static async updateRole(userId, newRole) {
        await run(
            'UPDATE users SET role = ? WHERE id = ?',
            [newRole, userId]
        );
    }
}

module.exports = UserModel;