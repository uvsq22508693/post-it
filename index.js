const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const path = require('path');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const { initDB } = require('./models/db');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
const PORT = process.env.PORT || 3000;

// 🔒 Headers de sécurité avec Helmet
app.use(helmet());

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session
const isProduction = process.env.NODE_ENV === 'production';

app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-this', // À changer en production!
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: isProduction,  // ✅ true en production, false en local
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60 * 24 // 24h
    }
}));

// Set view engine (Nunjucks)
const nunjucks = require('nunjucks');
const viewsPath = path.join(__dirname, 'views');

// Configure Nunjucks environment
const env = nunjucks.configure(viewsPath, {
    autoescape: true,
    noCache: true,
    watch: false
});

// Helper function to render templates directly
function renderView(res, viewName, data = {}) {
    const filePath = path.join(viewsPath, viewName + '.njk');
    env.render(filePath, data, (err, html) => {
        if (err) {
            console.error('Template error:', err);
            return res.status(500).send('Error: ' + err.message);
        }
        res.send(html);
    });
}

// Middleware to add renderView to response object
app.use((req, res, next) => {
    res.renderView = renderView.bind(null, res);
    next();
});

// Routes
const authRoutes = require('./routes/auth');
const postsRoutes = require('./routes/posts');
const adminRoutes = require('./routes/admin');

app.use('/', authRoutes);
app.use('/', postsRoutes);
app.use('/', adminRoutes);

// Route principale
app.get('/', (req, res) => {
    renderView(res, 'index', {
        userId: req.session.userId,
        username: req.session.username,
        role: req.session.role
    });
});

// 🔧 ENDPOINT DE DEBUG: Voir tous les users (temporaire - à supprimer après)
app.get('/test-users', async (req, res) => {
    try {
        const { pool } = require('./config/database');
        const result = await pool.query('SELECT id, username, role FROM users');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 🔧 ENDPOINT DE DEBUG: Mettre un user en admin (temporaire)
app.post('/test-make-admin/:username', async (req, res) => {
    try {
        const { pool } = require('./config/database');
        const username = req.params.username;
        await pool.query("UPDATE users SET role = 'admin' WHERE username = $1", [username]);
        const result = await pool.query('SELECT id, username, role FROM users WHERE username = $1', [username]);
        res.json({ success: true, user: result.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Initialiser la BDD et démarrer le serveur
initDB().then(() => {
    server.listen(PORT, () => {
        console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
    });
    
    // Socket.io connection handling
    io.on('connection', (socket) => {
        console.log(`📱 User connected: ${socket.id}`);
        
        socket.on('disconnect', () => {
            console.log(`📱 User disconnected: ${socket.id}`);
        });
    });
    
    // Make io available to routes
    app.locals.io = io;
}).catch(err => {
    console.error('Erreur au démarrage:', err);
});