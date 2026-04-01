const { run, get, all } = require('../config/database');
const bcrypt = require('bcrypt');

// Available user colors (expanded list)
const AVAILABLE_COLORS = [
    'user-color-0', 'user-color-1', 'user-color-2', 'user-color-3', 
    'user-color-4', 'user-color-5', 'user-color-6', 'user-color-7', 
    'user-color-8', 'user-color-9', 'user-color-10', 'user-color-11',
    'user-color-12', 'user-color-13', 'user-color-14', 'user-color-15',
    'user-color-16', 'user-color-17', 'user-color-18', 'user-color-19'
];

class UserModel {
    // Create user with unique color
    static async create(username, password, role = 'user') {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Find an available color
        const availableColor = await this.getAvailableColor();
        
        const result = await run(
            'INSERT INTO users (username, password, user_color, role) VALUES (?, ?, ?, ?)',
            [username, hashedPassword, availableColor, role]
        );
        return result.lastID;
    }

    // Get list of used colors
    static async getUsedColors() {
        const users = await all(
            'SELECT user_color FROM users WHERE user_color IS NOT NULL',
            []
        );
        return users.map(u => u.user_color);
    }

    // Get next available color
    static async getAvailableColor() {
        const usedColors = await this.getUsedColors();
        
        for (const color of AVAILABLE_COLORS) {
            if (!usedColors.includes(color)) {
                return color;
            }
        }
        
        // If all colors used, return a random one (shouldn't happen with 20 colors)
        return AVAILABLE_COLORS[Math.floor(Math.random() * AVAILABLE_COLORS.length)];
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
            'SELECT id, username, role, user_color FROM users WHERE id = ?',
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