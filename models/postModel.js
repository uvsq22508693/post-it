const db = require('../config/database');

class PostModel {
    // Créer un post-it
    static async create(text, x, y, userId) {
        const [result] = await db.query(
            'INSERT INTO postits (text, x, y, user_id) VALUES (?, ?, ?, ?)',
            [text, x, y, userId]
        );
        return result.insertId;
    }
    
    // Récupérer tous les post-its (avec infos utilisateur)
    static async findAll() {
        const [rows] = await db.query(`
            SELECT p.*, u.username 
            FROM postits p 
            JOIN users u ON p.user_id = u.id 
            ORDER BY p.created_at DESC
        `);
        return rows;
    }
    
    // Récupérer un post-it par son ID
    static async findById(id) {
        const [rows] = await db.query(`
            SELECT p.*, u.username 
            FROM postits p 
            JOIN users u ON p.user_id = u.id 
            WHERE p.id = ?
        `, [id]);
        return rows[0];
    }
    
    // Supprimer un post-it
    static async delete(id, userId, isAdmin = false) {
        let query = 'DELETE FROM postits WHERE id = ?';
        let params = [id];
        
        // Si pas admin, vérifier qu'on est bien le propriétaire
        if (!isAdmin) {
            query += ' AND user_id = ?';
            params.push(userId);
        }
        
        const [result] = await db.query(query, params);
        return result.affectedRows > 0;
    }
    
    // Modifier un post-it
    static async update(id, text, userId, isAdmin = false) {
        let query = 'UPDATE postits SET text = ? WHERE id = ?';
        let params = [text, id];
        
        if (!isAdmin) {
            query += ' AND user_id = ?';
            params.push(userId);
        }
        
        const [result] = await db.query(query, params);
        return result.affectedRows > 0;
    }
    
    // Mettre à jour les coordonnées (pour drag & drop)
    static async updatePosition(id, x, y, userId, isAdmin = false) {
        let query = 'UPDATE postits SET x = ?, y = ? WHERE id = ?';
        let params = [x, y, id];
        
        if (!isAdmin) {
            query += ' AND user_id = ?';
            params.push(userId);
        }
        
        const [result] = await db.query(query, params);
        return result.affectedRows > 0;
    }
}

module.exports = PostModel;