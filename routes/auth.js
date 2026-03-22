const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');

// Routes HTML (si tu utilises des vues)
router.get('/login', AuthController.showLoginPage);

// Routes API
router.post('/signup', AuthController.signup);
router.post('/login', AuthController.login);
router.post('/logout', AuthController.logout);

module.exports = router;