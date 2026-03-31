// ⏱️ Rate Limiting - Blocage après 3 tentatives échouées pendant 30 secondes

const loginAttempts = new Map();

// Configuration
const MAX_ATTEMPTS = 3;
const BLOCK_DURATION = 30000; // 30 secondes en millisecondes

/**
 * Middleware pour vérifier les tentatives de login
 */
function checkLoginAttempts(req, res, next) {
    const identifier = req.body.username || req.ip;
    const now = Date.now();
    
    // Initialiser si première tentative
    if (!loginAttempts.has(identifier)) {
        loginAttempts.set(identifier, { count: 0, blockedUntil: null });
    }
    
    const attempts = loginAttempts.get(identifier);
    
    // ❌ Vérifier si l'utilisateur est actuellement bloqué
    if (attempts.blockedUntil && now < attempts.blockedUntil) {
        const remainingSeconds = Math.ceil((attempts.blockedUntil - now) / 1000);
        console.warn(`⛔ Tentative de connexion pour ${identifier} - Bloqué pour ${remainingSeconds}s`);
        return res.status(429).json({
            error: `Trop de tentatives échouées. Réessayez dans ${remainingSeconds} secondes`,
            retryAfter: remainingSeconds
        });
    }
    
    // ✅ Réinitialiser si le délai de blocage est passé
    if (attempts.blockedUntil && now >= attempts.blockedUntil) {
        attempts.count = 0;
        attempts.blockedUntil = null;
    }
    
    next();
}

/**
 * Enregistrer une tentative échouée
 * Bloquer après MAX_ATTEMPTS
 */
function recordFailedAttempt(username) {
    const attempts = loginAttempts.get(username);
    if (attempts) {
        attempts.count++;
        console.warn(`⚠️ Tentative échouée pour ${username} (${attempts.count}/${MAX_ATTEMPTS})`);
        
        // Bloquer si dépassement du nombre max
        if (attempts.count >= MAX_ATTEMPTS) {
            attempts.blockedUntil = Date.now() + BLOCK_DURATION;
            console.warn(`🔒 ${username} est maintenant bloqué pour ${BLOCK_DURATION / 1000}s`);
        }
    }
}

/**
 * Réinitialiser les tentatives après une connexion réussie
 */
function clearAttempts(username) {
    if (loginAttempts.has(username)) {
        const attempts = loginAttempts.get(username);
        attempts.count = 0;
        attempts.blockedUntil = null;
        console.log(`✅ Tentatives réinitialisées pour ${username}`);
    }
}

module.exports = {
    checkLoginAttempts,
    recordFailedAttempt,
    clearAttempts
};
