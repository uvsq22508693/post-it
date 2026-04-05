const PostModel = require('../models/postModel');
const UserModel = require('../models/userModel');

// Global variable to track last update time
let lastUpdateTime = new Date();

class AdminController {
    // Page admin (affiche le tableau)
    static async getDashboard(req, res) {
        try {
            // Utilise renderView du middleware
            res.renderView('admin', {
                username: req.session.username,
                userId: req.session.userId
            });
        } catch (error) {
            console.error(error);
            res.status(500).send('Erreur');
        }
    }

    // Get last update timestamp
    static async getLastUpdate(req, res) {
        try {
            res.json({ lastUpdate: lastUpdateTime.getTime() });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // Mettre à jour le timestamp
    static updateLastChangeTime() {
        lastUpdateTime = new Date();
    }
    // API: Récupérer les posts avec pagination
    static async getPostsWithPagination(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = 20;
            const offset = (page - 1) * limit;

            // Récupérer le total des posts
            const totalResult = await PostModel.getTotal();
            const total = parseInt(totalResult.count);
            const totalPages = Math.ceil(total / limit);

            // Récupérer les posts paginés
            const posts = await PostModel.findAllPaginated(limit, offset);

            res.json({
                success: true,
                data: posts,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            });
        } catch (error) {
            console.error('Erreur pagination:', error);
            res.status(500).json({ error: 'Erreur lors de la récupération des posts' });
        }
    }

    // Modifier un post (admin seulement)
    static async updatePost(req, res) {
        try {
            const { id } = req.params;
            const { text } = req.body;

            if (!text || text.trim() === '') {
                return res.status(400).json({ error: 'Le texte ne peut pas être vide' });
            }

            // Admin peut modifier n'importe quel post
            const updated = await PostModel.updateForce(id, text);

            if (!updated) {
                return res.status(404).json({ error: 'Post-it non trouvé' });
            }

            // Notifier les autres clients
            AdminController.updateLastChangeTime();

            res.json({ success: true, message: 'Post-it modifié' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erreur lors de la modification' });
        }
    }

    // Supprimer un post (admin seulement)
    static async deletePost(req, res) {
        try {
            const { id } = req.params;

            // Admin peut supprimer n'importe quel post
            const deleted = await PostModel.deleteForce(id);

            if (!deleted) {
                return res.status(404).json({ error: 'Post-it non trouvé' });
            }

            // Notifier les autres clients
            AdminController.updateLastChangeTime();

            res.json({ success: true, message: 'Post-it supprimé' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erreur lors de la suppression' });
        }
    }
}

module.exports = AdminController;
