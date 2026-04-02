const UserModel = require('../models/userModel');
const PasswordValidator = require('./passwordValidator');
const { recordFailedAttempt, clearAttempts } = require('../middleware/rateLimiter');

class AuthController {
    // Afficher page login/signup (Nunjucks)
    static showLoginPage(req, res) {
        res.renderView('login');
    }
    
    // Traitement inscription
    static async signup(req, res) {
        try {
            const { username, password } = req.body;
            
            // Vérifier longueur du username
            if (!username || username.length < 3) {
                return res.status(400).json({ error: 'Le nom d\'utilisateur doit contenir au moins 3 caractères' });
            }
            
            // ✅ Valider le mot de passe
            const passwordValidation = PasswordValidator.validate(password);
            if (!passwordValidation.isValid) {
                return res.status(400).json({ error: 'Mot de passe faible', details: passwordValidation.errors });
            }
            
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
            
            res.status(201).json({ success: true, message: 'Inscription réussie' });
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
                // ❌ Enregistrer la tentative échouée
                recordFailedAttempt(username);
                return res.status(401).json({ error: 'Identifiants incorrects' });
            }
            
            // ✅ Connexion réussie - réinitialiser les tentatives
            clearAttempts(username);
            
            req.session.userId = user.id;
            req.session.username = user.username;
            req.session.role = user.role;
            
            res.json({ success: true, message: 'Connecté avec succès' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erreur lors de la connexion' });
        }
    }
    
    // Get current user info
    static async getCurrentUser(req, res) {
        if (!req.session.userId) {
            return res.status(401).json({ error: 'Non authentifié' });
        }
        
        try {
            const user = await UserModel.findById(req.session.userId);
            res.json({
                id: user.id,
                username: user.username,
                role: user.role,
                user_color: user.user_color
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erreur' });
        }
    }
    
    // Déconnexion
    static logout(req, res) {
        req.session.destroy();
        res.json({ success: true });
    }
}

module.exports = AuthController;