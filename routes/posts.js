const express = require('express');
const router = express.Router();
const PostsController = require('../controllers/postsController');
const { isAuthenticated } = require('../middleware/authMiddleware');

// Routes publiques
router.get('/liste', PostsController.getList);

// Routes protégées (nécessitent authentification)
router.post('/ajouter', isAuthenticated, PostsController.addPost);
router.delete('/effacer/:id', isAuthenticated, PostsController.deletePost);
router.put('/modifier/:id', isAuthenticated, PostsController.updatePost);
router.patch('/deplacer/:id', isAuthenticated, PostsController.movePost);

module.exports = router;