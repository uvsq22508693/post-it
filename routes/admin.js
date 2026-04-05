const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');

// Custom middleware pour vérifier si admin (inclus localement)
function isAdmin(req, res, next) {
    if (req.session.role === 'admin') {
        return next();
    }
    // Si c'est une route HTML, rediriger
    if (req.path === '/admin') {
        return res.redirect('/');
    }
    res.status(403).json({ error: 'Accès refusé - Admin seulement' });
}

// Page admin dashboard
router.get('/admin', isAdmin, AdminController.getDashboard);

// API: Récupérer le timestamp du dernier changement
router.get('/api/last-update', AdminController.getLastUpdate);

// API: Récupérer les posts avec pagination
router.get('/api/admin/posts', isAdmin, AdminController.getPostsWithPagination);

// API: Modifier un post
router.put('/api/admin/posts/:id', isAdmin, AdminController.updatePost);

// API: Supprimer un post
router.delete('/api/admin/posts/:id', isAdmin, AdminController.deletePost);

module.exports = router;
