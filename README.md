# post-it
Projet Post-it Master 1 du module application web et sécurité

---

## 🚀 Installation et Configuration (French)

### Prérequis
- Node.js (v14+) installé sur votre machine
- SQLite3 (intégré avec `sqlite3` npm package)
- Un navigateur web moderne

### Étapes d'installation

1. **Cloner ou télécharger le projet**
   ```bash
   cd /path/to/post-it
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configurer les variables d'environnement**
   - Créer un fichier `.env` à la racine du projet (optionnel)
   - Les paramètres par défaut sont configurés dans `config/database.js`

4. **Démarrer l'application**
   ```bash
   npm start
   ```
   ou directement avec Node.js:
   ```bash
   node index.js
   ```

5. **Accéder à l'application**
   - Ouvrir votre navigateur et aller à: `http://localhost:3000`

### Résolution des problèmes
- **Port 3000 déjà utilisé**: Modifier le port dans `index.js`
- **Erreur SQLite**: Vérifier que le dossier `data/` existe et est accessible en écriture
- **Module introuvable**: Réexécuter `npm install`

---

## 📋 Ce qui a été fait et comment ça marche

### Architecture générale
L'application est bâtie sur:
- **Backend**: Express.js avec authentification par session
- **Base de données**: SQLite3 avec tables `users` et `postits`
- **Frontend**: Vanilla JavaScript avec CSS3 et SVG
- **Authenticat secure**: Hachage bcrypt (10 tours) des mots de passe

### Fonctionnalités implémentées

#### 1. **Authentification utilisateur**
- Inscription et connexion avec bcrypt
- Sessions persistantes
- Déconnexion sécurisée
- Protection des routes privées

#### 2. **Gestion des notes Post-it**
- **Créer**: Double-clic sur le canvas ou bouton "Ajouter une note"
- **Éditer**: Animation de zoom avec textarea overlay (X pour annuler, ✓ pour sauvegarder)
- **Supprimer**: Bouton × sur chaque note
- **Persistance**: Position et contenu sauvegardés en base de données

#### 3. **Interface utilisateur interactive**
- **Drag & Drop**: Les notes se déplacent librement et la position est persistée
- **Zoom sur édition**: La note se zoom à 1.6x au centre avec animation smooth
- **Panning**: Clic droit + drag pour naviguer le board
- **Système de couleurs**: 12 couleurs assignées par utilisateur (basées sur le hash du nom)

#### 4. **Connexion des notes**
- Bouton 🔗 pour connecter deux notes entre elles
- Lignes SVG dessinées dynamiquement
- Rafraîchissement automatique lors du panning

### Flux utilisateur
1. L'utilisateur se connecte/s'inscrit
2. Arrive sur le board avec ses notes existantes
3. Peut créer/éditer/supprimer/déplacer les notes
4. Les modifications sont synchronisées en temps réel avec la base de données
5. Les couleurs sont consistantes par utilisateur
6. Les connexions entre notes restent visibles lors du panning

### Technologies utilisées
- **Node.js & Express**: Serveur web et routage
- **SQLite3**: Stockage persistant
- **bcrypt**: Sécurité des mots de passe
- **EJS**: Rendu des templates HTML
- **Vanilla JavaScript**: Logique client sans framework
- **CSS3**: Animations et styling
- **SVG**: Lignes de connexion
https://post-it-b46y.onrender.com/