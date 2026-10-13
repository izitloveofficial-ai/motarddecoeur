# Mise en production — Motards de Cœur

Ce guide complète `AGENTS.md`. Rien n'est considéré comme « en ligne » tant que les vérifications
de la section 5 n'ont pas été faites **sur le site publié**.

## 1. Hébergement et environnement
- Site web : projet Lovable, publié depuis la branche `main` (bouton « Publish »).
- Base de données, authentification, stockage et fonctions : projet Supabase existant (ne pas en créer un nouveau).
- Variables publiques (navigateur) : `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`.
- Secrets (jamais dans le dépôt) : `SUPABASE_SERVICE_ROLE_KEY`, `FIREBASE_SERVICE_ACCOUNT_JSON`,
  `ANTHROPIC_API_KEY` (assistant IA). Les secrets des fonctions se règlent dans Supabase →
  Edge Functions → Secrets.

## 2. Intégration et déploiement continus
- `.github/workflows/ci.yml` : à chaque proposition de modification et chaque envoi sur `main`,
  vérifie le code (lint), lance les tests, compile le site web et la version mobile, et cherche
  des secrets oubliés.
- Le site se publie via Lovable après fusion sur `main` (déploiement volontaire, pas automatique).
- `.github/workflows/deploy-functions.yml` : déploiement manuel d'une fonction Supabase. Demande deux
  secrets GitHub : `SUPABASE_ACCESS_TOKEN` et `SUPABASE_PROJECT_REF`.
- Recommandé : protéger `main` (GitHub → Settings → Branches) en exigeant que la CI soit verte.

## 3. Sécurité
- Aucune clé privée dans le dépôt ni dans le navigateur ; la CI utilise des valeurs factices.
- Les fonctions Supabase vérifient la session de l'utilisateur avant d'agir.
- Activer l'authentification à deux facteurs sur GitHub, Supabase, Lovable et Firebase.
- Vérifier régulièrement les alertes de sécurité Supabase (Advisors) et les règles RLS.
- Définir une limite de dépense mensuelle sur le compte de l'API d'IA.

## 4. Surveillance
- Point de contrôle : `https://<ton-domaine>/healthz` (répond `{"status":"ok"}`).
- Uptime : créer un contrôle gratuit (UptimeRobot, Better Stack…) sur `/healthz` et sur `/join`, avec
  alerte par e-mail ou SMS.
- Logs : Supabase → Logs (Edge Functions, API, Auth) ; Lovable pour les erreurs du site.
- Surveiller le nombre de pré-inscriptions et d'erreurs dans `/admin`.

## 5. Vérifications après publication (à faire sur le site réel)
1. `/healthz` répond ok.
2. `/lancement` et `/join` s'affichent ; envoyer une pré-inscription de test.
3. Connexion d'un compte test, page Rencontres, envoi d'un message.
4. `/admin` : cartes, graphique, tableau (compte administrateur).
5. Assistant IA : poser une question (après ajout de `ANTHROPIC_API_KEY`).
6. Retour arrière : conserver l'adresse de la version précédente publiée dans Lovable.
