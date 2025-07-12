# RSS Feed Reader - مقروء الأخبار

## 🚀 Installation et Lancement Local

### Prérequis
- Node.js (version 16 ou supérieure)
- npm ou yarn
- Chrome ou Firefox

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

## 🔧 Solution Complète - Images Réelles des Articles

### Problème Résolu ✅
**Extraction des vraies images des articles depuis les flux RSS**

### Technologies Utilisées
- **Google JSAPI** : `https://www.google.com/jsapi`
- **RSS2JSON GFAPI** : `https://rss2json.com/gfapi.js`
- **Extraction intelligente d'images** depuis le contenu RSS

### Méthodes d'Extraction d'Images

1. **Champs directs RSS2JSON** :
   - `item.thumbnail`
   - `item.enclosure` (type image)

2. **Analyse du contenu HTML** :
   - Parsing des balises `<img>` dans le contenu
   - Filtrage des logos/icônes/avatars
   - Validation des URLs d'images

3. **Patterns de recherche** :
   - URLs d'images dans le texte brut
   - Attributs `src` des balises img
   - Métadonnées GUID contenant des images

4. **Fallback intelligent** :
   - Image par défaut si aucune image trouvée
   - Gestion d'erreurs de chargement

### Fonctionnement 100% Local

#### APIs Externes Utilisées (CDN)
- **Google JSAPI** : Contournement CORS natif
- **RSS2JSON GFAPI** : API gratuite sans clé requise
- **Fonts Google** : Police Cairo pour l'arabe

#### Aucun Serveur Backend Requis
- Tout fonctionne côté client
- Pas de proxy serveur nécessaire
- Compatible avec tous les navigateurs modernes

## 🌐 Flux RSS Configurés

- **عربي21 - سياسة دولية** : Actualités politiques arabes
- **عربي21 - عام** : Actualités générales arabes  
- **Le Monde** : Actualités françaises
- **Libération** : Actualités françaises
- **Le Figaro** : Actualités françaises

## 🎨 Fonctionnalités

- ✅ **Images réelles des articles** extraites des flux RSS
- ✅ Interface RTL (droite à gauche) pour l'arabe
- ✅ Design responsive (mobile/desktop)
- ✅ Filtrage par source
- ✅ Actualisation automatique
- ✅ Gestion d'erreurs robuste
- ✅ **100% local** - aucun serveur requis
- ✅ **Contournement CORS** natif avec Google JSAPI

## 🔍 Architecture Technique

### Extraction d'Images - Algorithme
```javascript
1. Vérifier item.thumbnail (RSS2JSON)
2. Vérifier item.enclosure (type image)
3. Parser le HTML du contenu
4. Chercher les balises <img>
5. Filtrer les logos/icônes
6. Valider les URLs
7. Fallback vers image par défaut
```

### Gestion CORS
```javascript
1. Google JSAPI (priorité 1)
2. RSS2JSON GFAPI (priorité 2)  
3. Fetch direct (fallback)
```

## 📱 Utilisation

1. **Lancer le projet** : `npm run dev`
2. **Ouvrir Chrome** : `http://localhost:5173`
3. **Naviguer** : Utiliser la sidebar pour filtrer par source
4. **Actualiser** : Bouton de refresh pour recharger les flux

## 🎯 Avantages de Cette Solution

### ✅ Images Authentiques
- Chaque article affiche sa vraie image
- Extraction intelligente depuis le contenu RSS
- Pas d'images aléatoires ou génériques

### ✅ Performance Optimale
- Chargement rapide avec CDN
- Pas de serveur intermédiaire
- Cache navigateur natif

### ✅ Fiabilité
- Multiples méthodes de fallback
- Gestion d'erreurs complète
- Compatible tous navigateurs

### ✅ Simplicité
- Aucune configuration serveur
- Pas de clés API requises
- Déploiement statique possible

## 🚀 Déploiement

Le projet peut être déployé sur :
- **Netlify** (recommandé)
- **Vercel** 
- **GitHub Pages**
- **Tout hébergeur statique**

```bash
npm run build
# Déployer le dossier 'dist'
```

---

**Le projet est maintenant 100% fonctionnel avec les vraies images des articles !** 🎉

Chaque article affiche son image authentique extraite directement du flux RSS, sans recours à des images aléatoires.