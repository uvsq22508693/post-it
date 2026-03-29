const ConnectionModel = require('../models/connectionModel');

class ConnectionsController {
    // Get all connections
    static async getConnections(req, res) {
        try {
            const connections = await ConnectionModel.findAll();
            res.json(connections);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error fetching connections' });
        }
    }

    // Create a connection
    static async createConnection(req, res) {
        try {
            const { fromPostId, toPostId } = req.body;

            if (!fromPostId || !toPostId) {
                return res.status(400).json({ error: 'Missing post IDs' });
            }

            if (fromPostId === toPostId) {
                return res.status(400).json({ error: 'Cannot connect a post to itself' });
            }

            const connectionExists = await ConnectionModel.exists(fromPostId, toPostId);
            if (connectionExists) {
                return res.status(400).json({ error: 'Connection already exists' });
            }

            const id = await ConnectionModel.create(fromPostId, toPostId);
            res.status(201).json({ id, fromPostId, toPostId });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error creating connection' });
        }
    }

    // Delete a connection
    static async deleteConnection(req, res) {
        try {
            const { fromPostId, toPostId } = req.body;

            if (!fromPostId || !toPostId) {
                return res.status(400).json({ error: 'Missing post IDs' });
            }

            await ConnectionModel.delete(fromPostId, toPostId);
            res.json({ success: true });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error deleting connection' });
        }
    }
}

module.exports = ConnectionsController;
