const { run, get, all } = require('../config/database');
const bcrypt = require('bcrypt');

class UserModel {
    // Create user
    static async create(username, password, role = 'user') {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await run(
            'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id',
            [username, hashedPassword, role]
        );
        if (!result.lastID) {
            throw new Error('Erreur lors de la création de l\'utilisateur');
        }
        return result.lastID;
    }

    // Find user by username
    static async findByUsername(username) {
        return await get(
            'SELECT * FROM users WHERE username = $1',
            [username]
        );
    }

    // Find by ID
    static async findById(id) {
        return await get(
            'SELECT id, username, role FROM users WHERE id = $1',
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
            'UPDATE users SET role = $1 WHERE id = $2',
            [newRole, userId]
        );
    }
}

module.exports = UserModel;