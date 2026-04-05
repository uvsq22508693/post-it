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

#### 5. **Panneau d'Administration**
- **Accès sécurisé**: Route `/admin` réservée aux admins
- **Tableau complet**: Vue de tous les posts de tous les utilisateurs
- **Pagination**: 20 posts par page, navigation sans rechargement (fetch dynamique)
- **Gestion des posts**:
  - 📝 **Modifier**: Bouton Edit ouvre une modal pour éditer le contenu du post
  - 🗑️ **Supprimer**: Confirmation avant suppression
  - 📊 **Informations**: Auteur (avec couleur), date de création visible pour chaque post
- **Synchronisation en temps réel**: 
  - Polling toutes les 2 secondes pour détecter les changements
  - Tous les navigateurs affichant le panel voient les mises à jour automatiquement
  - Système basé sur fetch API sans rechargement de page

### Flux utilisateur
1. L'utilisateur se connecte/s'inscrit
2. Arrive sur le board avec ses notes existantes
3. Peut créer/éditer/supprimer/déplacer les notes
4. Les modifications sont synchronisées en temps réel avec la base de données
5. Les couleurs sont consistantes par utilisateur
6. **Admin**: Peut accéder à `/admin` pour g gérer tous les posts globalement
7. **Synchronisation admin**: Le tableau admin se met à jour automatiquement quand des changements sont détectés

### Technologies utilisées
- **Node.js & Express**: Serveur web et routage
- **PostgreSQL**: Base de données relationnelle
- **pg-pool**: Pool de connexions PostgreSQL
- **bcrypt**: Sécurité des mots de passe (10 tours)
- **express-session**: Gestion des sessions utilisateur
- **Nunjucks**: Rendu des templates HTML
- **Helmet**: Sécurité (Content Security Policy)
- **Vanilla JavaScript**: Logique client sans framework
- **CSS3**: Animations et styling responsive
- **SVG**: Lignes de connexion (fonctionnalité supprimée)
- **Fetch API**: Communication client-serveur asynchrone

---

## 📝 Changelog

### 📅 Mise à jour - Admin Panel - Avril 2026

#### ✅ Panneau d'Administration

1. **Route Admin sécurisée (`/admin`)**
   - Accessible uniquement aux utilisateurs avec le rôle `admin`
   - Middleware de vérification des droits d'accès
   - Redirection automatique des non-admins

2. **API de Pagination**
   - Endpoint `/api/admin/posts?page=X` - Retourne 20 posts par page
   - Pagination dynamique sans rechargement de page
   - Informations complètes: ID, contenu, auteur, date, couleur utilisateur

3. **Tableau Interactif**
   - Affichage de tous les posts de tous les utilisateurs
   - Colonne d'actions (Modifier/Supprimer) pour chaque post
   - Auteur affiché avec sa couleur personnalisée
   - Date de création formatée lisiblement

4. **Gestion des posts par l'admin**
   - 📝 **Modifier**: Modal d'édition du contenu avec validation
   - 🗑️ **Supprimer**: Confirmation avant suppression, avec gestion d'erreur
   - Endpoints API: `PUT /api/admin/posts/:id`, `DELETE /api/admin/posts/:id`

5. **Synchronisation en Temps Réel**
   - Polling toutes les 2 secondes via `/api/last-update`
   - Détection automatique des changements
   - Mise à jour du tableau sur tous les navigateurs connectés
   - Système basé sur timestamp sans rechargement complet

6. **Interface Utilisateur**
   - Design responsive et professionnel
   - Modal d'édition avec confirmation
   - Messages de succès/erreur
   - Pagination avec boutons Précédent/Suivant
   - Indicateur de page et nombre total de posts
   - Optimisation CSS pour éviter les conflits de scrolling

#### 🔧 Détails techniques
- Fichier `routes/admin.js` - Gestion des routes admin
- Fichier `controllers/adminController.js` - Logique métier admin
- Fichier `public/admin.js` - JavaScript client pour le polling et interactions
- Fichier `views/admin.njk` - Template du dashboard admin
- Extensions à `postModel.js`: `findAllPaginated()`, `getTotal()`, `updateForce()`, `deleteForce()`
- Classe AdminController avec système d'update tracking
- Content Security Policy compatible (pas de scripts inline)

---

### 📅 Précédentes mises à jour - 2 Avril 2026 (15:46)

#### ✅ Corrections et Améliorations

1. **Intégration PostgreSQL**
   - Migration de SQLite vers PostgreSQL
   - Configuration de la connexion à la base de données
   - Initialisation des tables avec le schéma PostgreSQL

2. **Système de couleurs utilisateur**
   - Chaque utilisateur reçoit une couleur unique
   - Les couleurs sont persistées en base de données
   - Assignation automatique lors de l'inscription

3. **Interface utilisateur - Couleurs**
   - Le bouton "+ Add Note" affiche la couleur de l'utilisateur
   - Les nouveaux post-its popup avec la couleur de l'utilisateur

4. **Suppression de la fonctionnalité de connexion**
   - Suppression du bouton 🔗 "Connecter" les notes entre elles

#### 🚀 État actuel
- ✅ Application fonctionnelle avec PostgreSQL
- ✅ Chaque utilisateur a sa propre couleur
- ✅ UI cohérente avec couleurs utilisateur
- ✅ Drag & drop sécurisé (propriétaire uniquement)
- ✅ Toutes les modifications persistées en base de données

### 📅 Mise à jour - 3 Avril 2026

#### ✅ Mode Invité avec Modal

1. **Expérience Invité améliorée**
   - Les utilisateurs non connectés voient "👤 Hello guest, you can view notes" en haut de la page
   - Les invités peuvent consulter toutes les notes existantes
   - Double-clic tentant de créer une note affiche une modal au lieu d'une alerte

2. **Modal de Post pour Invités**
   - Design cohérent avec la modal d'authentification (image + message + boutons)
   - Message explicite: "To post a note you must login to your account or create one"
   - 3 boutons: Login, Sign Up, Close
   - Fermeture par clic sur le bouton Close ou en cliquant en dehors de la modal

3. **Navigation fluide**
   - Le bouton "Login" ouvre la modal d'authentification (onglet Login)
   - Le bouton "Sign Up" ouvre la modal d'authentification (onglet Sign Up)
   - Tous les boutons fonctionnent correctement sans alerte gênante

#### 🔧 Détails techniques
- Ajout des fonctions `openGuestModal()` et `closeGuestModal()` dans client.js
- Event listeners pour tous les boutons de la guest modal
- Modal se ferme au clic sur le fond/backdrop
- Double-clic détecte si l'utilisateur est connecté et affiche la modal appropriée

#### 🚀 État actuel
- ✅ Mode invité complet et fonctionnel
- ✅ Modal de post pour invités avec design cohérent
- ✅ Tous les boutons de navigation fonctionnent
- ✅ Bonne expérience utilisateur pour invités et utilisateurs connectés

### 📅 Mise à jour - 5 Avril 2026

#### ✅ Mises à jour en temps réel avec Socket.io

1. **Synchronisation multi-navigateurs**
   - Tous les navigateurs affichant le même tableau voient les changements instantanément
   - Création d'une note visible partout
   - Suppression d'une note synchronisée en temps réel
   - Déplacement/modification d'une note mis à jour immédiatement

2. **Socket.io Server**
   - Intégration de Socket.io au serveur Express
   - Gestion des événements: create, update, delete, move
   - Émission des événements à tous les clients connectés

3. **Socket.io Client**
   - Écouteurs pour les 4 types d'événements
   - Mise à jour du DOM sans rechargement
   - Logs de débogage dans la console

#### 🔧 Détails techniques
- Installation de `socket.io` (v4.8.1)
- Création de `http.Server` pour Socket.io
- Émission des événements dans les contrôleurs (addPost, deletePost, updatePost, movePost)
- Listeners dans `setupSocketIO()` qui mettent à jour l'UI en temps réel

#### 🚀 État actuel
- ✅ Synchronisation en temps réel fonctionnelle
- ✅ Multi-navigateurs synchronisés automatiquement
- ✅ Tous les changements reflétés instantanément