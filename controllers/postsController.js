const PostModel = require('../models/postModel');

class PostsController {
    // Récupérer tous les post-its (format JSON)
    static async getList(req, res) {
        try {
            const posts = await PostModel.findAll();
            res.json(posts);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erreur lors de la récupération' });
        }
    }
    
    // Ajouter un post-it
    static async addPost(req, res) {
        try {
            const { text, x, y } = req.body;
            const userId = req.session.userId;
            
            if (!text || x === undefined || y === undefined) {
                return res.status(400).json({ error: 'Données manquantes' });
            }
            
            const postId = await PostModel.create(text, x, y, userId);
            const newPost = await PostModel.findById(postId);
            
            // Emit socket event to all connected clients
            const io = req.app.locals.io;
            if (io) {
                io.emit('postit-created', newPost);
                console.log('📡 Socket event sent: postit-created');
            }
            
            res.status(201).json(newPost);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erreur lors de l\'ajout' });
        }
    }
    
    // Supprimer un post-it
    static async deletePost(req, res) {
        try {
            const { id } = req.params;
            const userId = req.session.userId;
            const isAdmin = req.session.role === 'admin';
            
            const deleted = await PostModel.delete(id, userId, isAdmin);
            
            if (!deleted) {
                return res.status(404).json({ error: 'Post-it non trouvé ou non autorisé' });
            }
            
            // Emit socket event to all connected clients
            const io = req.app.locals.io;
            if (io) {
                io.emit('postit-deleted', { id });
                console.log('📡 Socket event sent: postit-deleted');
            }
            
            res.json({ success: true });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erreur lors de la suppression' });
        }
    }
    
    // Modifier un post-it
    static async updatePost(req, res) {
        try {
            const { id } = req.params;
            const { text } = req.body;
            const userId = req.session.userId;
            const isAdmin = req.session.role === 'admin';
            
            const updated = await PostModel.update(id, text, userId, isAdmin);
            
            if (!updated) {
                return res.status(404).json({ error: 'Post-it non trouvé ou non autorisé' });
            }
            
            // Get updated post and emit socket event
            const updatedPost = await PostModel.findById(id);
            const io = req.app.locals.io;
            if (io) {
                io.emit('postit-updated', updatedPost);
                console.log('📡 Socket event sent: postit-updated');
            }
            
            res.json({ success: true });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erreur lors de la modification' });
        }
    }
    
    // Déplacer un post-it (drag & drop)
    static async movePost(req, res) {
        try {
            const { id } = req.params;
            const { x, y } = req.body;
            const userId = req.session.userId;
            const isAdmin = req.session.role === 'admin';
            
            const moved = await PostModel.updatePosition(id, x, y, userId, isAdmin);
            
            if (!moved) {
                return res.status(404).json({ error: 'Post-it non trouvé ou non autorisé' });
            }
            
            // Emit socket event for position change
            const io = req.app.locals.io;
            if (io) {
                io.emit('postit-moved', { id, x, y });
                console.log('📡 Socket event sent: postit-moved');
            }
            
            res.json({ success: true });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erreur lors du déplacement' });
        }
    }
}

module.exports = PostsController;