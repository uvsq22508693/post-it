const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const path = require('path');
const dotenv = require('dotenv');
const { initDB } = require('./models/db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 🔒 Headers de sécurité avec Helmet
app.use(helmet());

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/pic', express.static(path.join(__dirname, 'pic')));

// Session
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-this', // À changer en production!
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false,  // Mettre à true si HTTPS
        httpOnly: true,
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
    app.listen(PORT, () => {
        console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error('Erreur au démarrage:', err);
});