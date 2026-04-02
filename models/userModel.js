const { run, get, all } = require('../config/database');
const bcrypt = require('bcrypt');

// Color palette for users
const USER_COLORS = [
    '#FFD700', '#FF6B6B', '#4ECDC4', '#95E1D3', '#FFB6C1',
    '#FFE5B4', '#A9D5FF', '#D4A9FF', '#FFD4A9', '#A9FFD4',
    '#FFF4A9', '#FFB3D9', '#C5B3FF', '#FFCCA3', '#A3E4D7',
    '#F7DC6F', '#F8BBD0', '#B2DFDB', '#E1BEE7', '#C8E6C9'
];

class UserModel {
    // Helper: Get color based on username hash
    static getColorForUser(username) {
        let hash = 0;
        for (let i = 0; i < username.length; i++) {
            const char = username.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        const colorIndex = Math.abs(hash) % USER_COLORS.length;
        return USER_COLORS[colorIndex];
    }

    // Create user
    static async create(username, password, role = 'user') {
        const hashedPassword = await bcrypt.hash(password, 10);
        const userColor = this.getColorForUser(username);
        const result = await run(
            'INSERT INTO users (username, password, role, user_color) VALUES ($1, $2, $3, $4) RETURNING id',
            [username, hashedPassword, role, userColor]
        );
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
            'SELECT id, username, role, user_color FROM users WHERE id = $1',
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