const db = require('../config/database');
const bcrypt = require('bcrypt');

class UserModel {
    // Créer un utilisateur
    static async create(username, password, role = 'user') {
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await db.query(
            'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
            [username, hashedPassword, role]
        );
        return result.insertId;
    }
    
    // Trouver un utilisateur par username
    static async findByUsername(username) {
        const [rows] = await db.query(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );
        return rows[0];
    }
    
    // Trouver par ID
    static async findById(id) {
        const [rows] = await db.query(
            'SELECT id, username, role FROM users WHERE id = ?',
            [id]
        );
        return rows[0];
    }
    
    // Vérifier mot de passe
    static async verifyPassword(username, password) {
        const user = await this.findByUsername(username);
        if (!user) return null;
        
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return null;
        
        return user;
    }
    
    // Bonus : mettre à jour le rôle
    static async updateRole(userId, newRole) {
        await db.query(
            'UPDATE users SET role = ? WHERE id = ?',
            [newRole, userId]
        );
    }
}

module.exports = UserModel;