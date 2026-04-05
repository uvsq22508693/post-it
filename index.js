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
app.use('/pic', express.static(path.join(__dirname, 'pic')));

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
const connectionsRoutes = require('./routes/connections');

app.use('/', authRoutes);
app.use('/', postsRoutes);
app.use('/connections', connectionsRoutes);

// Route principale
app.get('/', (req, res) => {
    renderView(res, 'index', {
        userId: req.session.userId,
        username: req.session.username,
        role: req.session.role
    });
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