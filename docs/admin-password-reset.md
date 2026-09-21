# Audit et exploitation de la réinitialisation administrateur

## Audit avant modification

- `/admin/login` authentifiait directement le navigateur auprès de Supabase Auth, puis appelait
  la fonction `is_admin`. Le mot de passe, son empreinte et les sessions étaient donc gérés hors du
  backend applicatif.
- Le rôle administrateur était conservé dans `admin_users`. Le script de provisionnement évitait
  déjà de recréer un utilisateur portant la même adresse.
- Les préinscriptions du formulaire public sont stockées dans la liaison Cloudflare D1 `DB` et les
  migrations `0001`/`0002`. Cette livraison ne modifie ni ces tables, ni ce formulaire.
- Aucun transport e-mail utilisable par le backend D1 n'était configuré dans le dépôt. La nouvelle
  intégration utilise l'API Resend, exclusivement côté serveur.

## Mise en production

1. Vérifier la sauvegarde D1, puis appliquer `migrations/0003_admin_password_reset.sql`. La migration
   est additive, crée uniquement les quatre tables d'authentification et enregistre l'unique compte
   administrateur `contact@motardsdecoeur.com` sans mot de passe. Elle ne crée donc aucun mot de
   passe par défaut. Pour revenir en arrière, supprimer dans cet ordre `admin_auth_attempts`,
   `admin_sessions`, `admin_password_resets`, puis `admin_accounts`.
2. Configurer les secrets/runtime `RESEND_API_KEY`, `ADMIN_EMAIL_FROM` et `APP_URL`. `APP_URL` doit
   être l'origine HTTPS réellement déployée, sans chemin (par exemple `https://motardsdecoeur.com`).
3. Déployer, ouvrir `/admin/login`, choisir **Mot de passe oublié ?**, puis saisir
   `contact@motardsdecoeur.com`.
4. Ouvrir l'e-mail dans les quinze minutes, choisir deux fois le nouveau mot de passe et
   l'enregistrer. Toute session administrateur précédemment émise par ce backend est alors révoquée.

Les empreintes de mots de passe utilisent PBKDF2-HMAC-SHA-256 à 600 000 itérations avec un sel
aléatoire propre à chaque mot de passe. Les jetons aléatoires de 32 octets ne sont conservés qu'en
SHA-256 et sont à usage unique. Les demandes sont limitées par empreinte d'adresse e-mail et
empreinte d'adresse IP.
