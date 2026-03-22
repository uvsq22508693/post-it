// Vérifier si l'utilisateur est connecté
function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        return next();
    }
    res.status(401).json({ error: 'Non authentifié' });
}

// Pour les routes HTML (redirection)
function isAuthenticatedRedirect(req, res, next) {
    if (req.session.userId) {
        return next();
    }
    res.redirect('/');
}

module.exports = { isAuthenticated, isAuthenticatedRedirect };