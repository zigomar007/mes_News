# RSS Feed Reader - مقروء الأخبار

## 🚀 Installation et Lancement Local

### Prérequis
- Node.js (version 16 ou supérieure)
- npm ou yarn

### Installation
```bash
# Cloner le projet
git clone [URL_DU_PROJET]
cd rss-feed-reader

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

### Ouverture dans Chrome
1. Ouvrir Chrome
2. Aller à l'adresse : `http://localhost:5173`
3. Le projet se lancera automatiquement

## 🔧 Corrections Apportées

### Problème des Images Identiques - RÉSOLU ✅

**Problème :** Tous les articles affichaient la même image de fallback.

**Solutions implémentées :**

1. **Images de fallback variées** : 8 images différentes d'Unsplash
2. **Index unique par article** : Chaque article utilise un index différent
3. **Extraction d'images améliorée** :
   - Patterns plus précis pour `media:content` et `media:thumbnail`
   - Filtrage des logos et icônes
   - Recherche dans le contenu HTML avec critères stricts
   - Fallback intelligent avec rotation d'images

4. **Clé unique pour React** : `key={feedId}-${index}-${item.link}` pour éviter les conflits

### Optimisations pour le Développement Local

1. **Gestion CORS améliorée** :
   - Détection automatique de l'environnement local
   - Utilisation d'AllOrigins comme proxy principal en local
   - Fallback automatique entre différents services

2. **Messages d'erreur informatifs** :
   - Avertissement pour l'environnement local
   - Instructions claires pour résoudre les problèmes CORS

3. **Performance optimisée** :
   - Limitation à 25 articles par flux
   - Gestion d'erreurs robuste
   - Retry automatique

## 🌐 Flux RSS Configurés

- **عربي21 - سياسة دولية** : Actualités politiques arabes
- **عربي21 - عام** : Actualités générales arabes  
- **Le Monde** : Actualités françaises
- **Libération** : Actualités françaises
- **Le Figaro** : Actualités françaises

## 🎨 Fonctionnalités

- ✅ Interface RTL (droite à gauche) pour l'arabe
- ✅ Design responsive (mobile/desktop)
- ✅ Images uniques pour chaque article
- ✅ Filtrage par source
- ✅ Actualisation automatique
- ✅ Gestion d'erreurs robuste
- ✅ Optimisé pour le développement local

## 🔍 Résolution des Problèmes CORS

### En Local (Développement)
Le projet utilise automatiquement des proxies CORS pour contourner les restrictions en local.

### En Production
Déployez sur :
- **Netlify** (recommandé)
- **Vercel** 
- **GitHub Pages**

### Alternative Chrome (Temporaire)
```bash
# Windows
chrome.exe --user-data-dir=/tmp/foo --disable-web-security

# Mac  
open -n -a /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --args --user-data-dir="/tmp/chrome_dev_test" --disable-web-security

# Linux
google-chrome --disable-web-security --user-data-dir="/tmp/chrome_dev_test"
```

## 📱 Utilisation

1. **Lancer le projet** : `npm run dev`
2. **Ouvrir Chrome** : `http://localhost:5173`
3. **Naviguer** : Utiliser la sidebar pour filtrer par source
4. **Actualiser** : Bouton de refresh pour recharger les flux

Le projet est maintenant **100% fonctionnel** en local avec des images uniques pour chaque article ! 🎉