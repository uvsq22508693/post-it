const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { checkLoginAttempts } = require('../middleware/rateLimiter');

// Routes HTML (si tu utilises des vues)
router.get('/login', AuthController.showLoginPage);

// Routes API
router.get('/me', AuthController.getCurrentUser);
router.post('/signup', AuthController.signup);
router.post('/login', checkLoginAttempts, AuthController.login);  // ← Rate limiting ici!
router.post('/logout', AuthController.logout);

module.exports = router;