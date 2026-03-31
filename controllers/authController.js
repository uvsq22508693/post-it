const UserModel = require('../models/userModel');

class AuthController {
    // Afficher page login/signup (Nunjucks)
    static showLoginPage(req, res) {
        res.render('login.njk');
    }
    
    // Traitement inscription
    static async signup(req, res) {
        try {
            const { username, password } = req.body;
            
            // Vérifier si l'utilisateur existe déjà
            const existingUser = await UserModel.findByUsername(username);
            if (existingUser) {
                return res.status(400).json({ error: 'Utilisateur déjà existant' });
            }
            
            // Créer l'utilisateur
            const userId = await UserModel.create(username, password);
            
            // Connecter automatiquement
            req.session.userId = userId;
            req.session.username = username;
            req.session.role = 'user';
            
            res.status(201).json({ success: true });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erreur lors de l\'inscription' });
        }
    }
    
    // Traitement connexion
    static async login(req, res) {
        try {
            const { username, password } = req.body;
            
            const user = await UserModel.verifyPassword(username, password);
            if (!user) {
                return res.status(401).json({ error: 'Identifiants incorrects' });
            }
            
            req.session.userId = user.id;
            req.session.username = user.username;
            req.session.role = user.role;
            
            res.json({ success: true });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erreur lors de la connexion' });
        }
    }
    
    // Déconnexion
    static logout(req, res) {
        req.session.destroy();
        res.json({ success: true });
    }
}

module.exports = AuthController;