// Validation stricte des mots de passe
class PasswordValidator {
    static validate(password) {
        const errors = [];
        
        // Longueur minimum
        if (!password || password.length < 8) {
            errors.push('Le mot de passe doit contenir au moins 8 caractères');
        }
        
        // Majuscule
        if (!/[A-Z]/.test(password)) {
            errors.push('Le mot de passe doit contenir au moins une majuscule (A-Z)');
        }
        
        // Minuscule
        if (!/[a-z]/.test(password)) {
            errors.push('Le mot de passe doit contenir au moins une minuscule (a-z)');
        }
        
        // Chiffre
        if (!/[0-9]/.test(password)) {
            errors.push('Le mot de passe doit contenir au moins un chiffre (0-9)');
        }
        
        // Caractère spécial
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            errors.push('Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&* etc.)');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
}

module.exports = PasswordValidator;
