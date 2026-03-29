const express = require('express');
const router = express.Router();
const ConnectionsController = require('../controllers/connectionsController');

// Get all connections
router.get('/liste', ConnectionsController.getConnections);

// Create a connection
router.post('/ajouter', ConnectionsController.createConnection);

// Delete a connection
router.delete('/effacer', ConnectionsController.deleteConnection);

module.exports = router;
