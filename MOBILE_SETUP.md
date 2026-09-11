# Application mobile — Motards de Cœur

## Ce qui est déjà en place (dans le dépôt)

- `vite.config.mobile.ts` : configuration de build séparée, 100 % statique (mode SPA),
  n'affecte jamais le site web publié sur Lovable (`vite.config.ts` reste inchangé).
- `scripts/prepare-mobile-build.mjs` : finalise le build (renomme le shell généré en
  `index.html`, requis par Capacitor).
- `capacitor.config.ts` : configuration Capacitor (nom de l'app, identifiant, dossier web).
- Dépendances Capacitor ajoutées à `package.json`.
- Testé et validé de bout en bout : `npm run build:mobile` produit un `dist/client/`
  autonome (aucun serveur requis), avec toutes les pages de l'application.

## Ce qu'il reste à faire — sur ta machine (pas possible depuis ici)

Ces étapes nécessitent Android Studio et/ou Xcode, que je n'ai pas dans mon environnement.

### 1. Prérequis à installer sur ton ordinateur

- **Node.js** (déjà nécessaire pour le projet)
- **Pour Android** : [Android Studio](https://developer.android.com/studio)
- **Pour iPhone** : Xcode (Mac uniquement, via l'App Store), + un compte Apple Developer (99 €/an)

### 2. Cloner le dépôt et installer

```bash
git clone https://github.com/izitloveofficial-ai/motarddecoeur.git
cd motarddecoeur
npm install
```

### 3. Construire la version mobile et l'ajouter à Capacitor

```bash
npm run build:mobile
npx cap add android
npx cap add ios       # Mac uniquement
npx cap sync
```

Cela crée deux nouveaux dossiers `android/` et `ios/` dans le projet — ce sont de vrais
projets natifs, à committer dans le dépôt Git une fois créés.

### 4. Ouvrir et tester

```bash
npx cap open android   # ouvre Android Studio
npx cap open ios       # ouvre Xcode (Mac uniquement)
```

Depuis Android Studio ou Xcode, tu peux lancer l'app sur un émulateur ou un téléphone
branché en USB pour la tester réellement.

### 5. Permissions caméra (important, sinon l'app plante à l'usage)

La prise de photo native (`@capacitor/camera`) est déjà intégrée au formulaire de profil.
Avant de tester sur un vrai appareil, il faut déclarer les permissions :

**Android** (`android/app/src/main/AndroidManifest.xml`) — généralement ajouté
automatiquement par `npx cap sync`, à vérifier quand même :

```xml
<uses-permission android:name="android.permission.CAMERA" />
```

**iOS** (`ios/App/App/Info.plist`) — à ajouter **manuellement**, Capacitor ne le fait pas
automatiquement :

```xml
<key>NSCameraUsageDescription</key>
<string>Motards de Cœur a besoin d'accéder à l'appareil photo pour ta photo de profil.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>Motards de Cœur a besoin d'accéder à tes photos pour choisir une photo de profil.</string>
```

Sans ces lignes côté iOS, l'app plante immédiatement dès qu'on essaie de prendre une photo.

### 6. Icônes et écran de démarrage

Une fois le logo officiel définitif disponible (fichier carré haute résolution,
1024×1024 px minimum, fond plein) :

```bash
npm install @capacitor/assets --save-dev
npx capacitor-assets generate
```

Génère automatiquement toutes les tailles d'icônes et écrans de démarrage requis par
Android et iOS.

### 7. À chaque modification du site web

Il faut reconstruire et resynchroniser avant de retester sur mobile :

```bash
npm run build:mobile
npx cap sync
```

## ⚠️ Point d'attention pour la soumission aux stores

Cette première version charge l'interface entièrement en local (rapide, fonctionne même
avec une connexion instable). **L'accès à l'appareil photo natif est déjà intégré**
(formulaire de profil), ce qui aide à ne pas ressembler à un simple site encapsulé.

Apple, en particulier, peut encore refuser une application sans autre valeur ajoutée
native. Les notifications push (nouveaux matchs et messages) sont intégrées avec
`@capacitor/push-notifications`. Pour les activer :

1. Crée un projet Firebase et active Firebase Cloud Messaging.
2. Configure Android (`google-services.json`) et iOS (clé APNs) dans les projets natifs.
3. Ajoute le compte de service Firebase complet dans le secret Edge Function
   `FIREBASE_SERVICE_ACCOUNT_JSON` depuis le tableau de bord Supabase.
4. Exécute `npx cap sync`, puis teste l'autorisation et la réception sur un appareil réel.

Sans ce secret, la fonction `send-push` renvoie volontairement
`firebase_not_configured` et les messages/matchs continuent de fonctionner normalement.
