const db = require('../config/database');

async function initDB() {
    try {
        // Table utilisateurs
        await db.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT PRIMARY KEY AUTO_INCREMENT,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role ENUM('user', 'admin') DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Table postits
        await db.query(`
            CREATE TABLE IF NOT EXISTS postits (
                id INT PRIMARY KEY AUTO_INCREMENT,
                text TEXT NOT NULL,
                x INT NOT NULL,
                y INT NOT NULL,
                user_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        
        console.log('✅ Base de données initialisée');
    } catch (error) {
        console.error('❌ Erreur initialisation BDD:', error);
    }
}

module.exports = { initDB };