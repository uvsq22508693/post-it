const express = require('express');
const session = require('express-session');
const path = require('path');
const dotenv = require('dotenv');
const { initDB } = require('./models/db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false,  // Mettre à true si HTTPS
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 // 24h
    }
}));

// Set view engine (si tu utilises EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
const authRoutes = require('./routes/auth');
const postsRoutes = require('./routes/posts');

app.use('/', authRoutes);
app.use('/', postsRoutes);

// Route principale
app.get('/', (req, res) => {
    // Si tu utilises EJS, passe les infos de session
    res.render('index', {
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