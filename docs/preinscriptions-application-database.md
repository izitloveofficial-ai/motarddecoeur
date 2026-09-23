# Préinscriptions — base applicative

> **Document historique.** La bascule D1 décrite ci-dessous n'est plus active. Source de vérité actuelle :
> la table `public.preinscriptions` de la base Supabase existante. Voir la section « État actuel » en fin
> de document. Les instructions D1 (liaison `DB`, import, migrations `migrations/`) ne doivent plus être appliquées.

## Cause du problème

La migration `06990eb` a déplacé les préinscriptions vers D1, mais pas l'identité : le navigateur
obtient toujours son jeton de Supabase et l'API vérifie toujours le rôle avec `is_admin()`. Le
déploiement doit donc pointer `VITE_SUPABASE_URL` (navigateur) et `SUPABASE_URL` (serveur) vers le
**même projet**, fournir `SUPABASE_ANON_KEY` au serveur et contenir l'UUID du compte dans
`public.admin_users`. Si les variables serveur n'ont pas suivi la migration, ou si le compte a été
recréé dans un nouveau projet (donc avec un nouvel UUID), `is_admin()` ne peut pas reconnaître le
compte. C'est la rupture exacte dans le code migré : D1 ne contient et ne déduit aucun rôle.

La page ne refait plus l'ancien contrôle RPC dans le navigateur. Elle transmet la session au nouvel
endpoint D1, qui reste l'unique autorité. Une absence de session renvoie 401 et un compte valide sans
rôle renvoie 403. Dans les deux cas, la page masque compteurs, filtres et tableau au lieu de rendre
des zéros trompeurs.

L'erreur serveur exacte est `Error: The DB binding is not configured`. La version précédente
appelait `database(env)` et la table de limitation de débit **avant** de lire et valider le JSON.
Une liaison `DB` absente produisait donc systématiquement un 500, y compris pour `{}`. Le serveur
valide maintenant le corps avant le premier accès à `DB` et journalise l'exception d'infrastructure
avec le préfixe `POST /api/preinscriptions failed`.

Le formulaire appelle `POST /api/preinscriptions`; le serveur écrit avec des requêtes paramétrées
dans la liaison Cloudflare D1 `DB`, et l'administration lit cette même liaison. Supabase n'est pas
utilisé comme base de données pour ce flux.

## Configuration et déploiement

1. Dans Lovable/Cloudflare, créer puis lier la nouvelle base D1 sous le nom de liaison exact `DB`.
   **`DB` est une liaison de ressource, pas une variable texte ni un secret.** Aucune variable
   `DATABASE_URL` n'est lue par l'application.
2. Appliquer, dans l'ordre, `migrations/0001_preinscriptions.sql` puis la migration additive
   `migrations/0002_preserve_legacy_preinscription_fields.sql`. Vérifier ensuite `preinscriptions`
   et `preinscription_attempts` dans la liste des tables.
3. Configurer côté serveur les variables d'identité déjà utilisées par l'administration :
   `SUPABASE_URL`, `SUPABASE_ANON_KEY` et `SUPABASE_SERVICE_ROLE_KEY`. Elles ne servent jamais à
   lire ou écrire les préinscriptions. Ne jamais les préfixer par `VITE_`.
4. Conserver côté navigateur `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY` uniquement pour
   la session d'administration existante. Elles ne sont pas des identifiants de la base D1.
5. Déployer l'application, soumettre une adresse de recette sur `/join`, puis vérifier immédiatement
   le compteur et la ligne dans `/admin/preinscriptions`.

Le test d'intégration `src/lib/preinscriptions.integration.test.ts` applique cette même migration à
une base SQLite éphémère exposée par la même interface D1. Il contrôle les trois réponses 400 sans
base, puis le trajet API 201 → ligne en base → lecture immédiate par l'API d'administration.

## Import des cinq lignes historiques

Le compte est créé (s'il n'existe pas) et promu sans adresse inscrite dans le dépôt :

```sh
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... ADMIN_EMAIL=... ADMIN_PASSWORD=... \
  npm run admin:provision
```

`ADMIN_PASSWORD` n'est nécessaire que lors d'une création. L'outil résout toujours l'adresse vers
l'UUID Auth courant puis effectue un upsert dans `admin_users`; il peut donc réparer un UUID devenu
obsolète après changement de projet.

L'outil suivant exporte d'abord les cinq lignes Supabase dans un fichier JSON en mode `0600`, refuse
de continuer si le total source n'est pas exactement cinq, puis les importe par paramètres dans D1.
Il conserve les champs historiques (`city`, `age`, `sex`, `bike_type`), les champs récents, les
dates, le consentement, le statut et les identifiants. Enfin, il relit D1 et compare chaque couple
id/e-mail. Il n'exécute aucun `DELETE`, `DROP` ni modification de la source.

```sh
SOURCE_SUPABASE_URL=... SOURCE_SUPABASE_SERVICE_ROLE_KEY=... \
CLOUDFLARE_ACCOUNT_ID=... CLOUDFLARE_D1_DATABASE_ID=... CLOUDFLARE_API_TOKEN=... \
  npm run preinscriptions:migrate
```

Pour séparer les phases de contrôle :

```sh
node scripts/migrate-preinscriptions.mjs export
node scripts/migrate-preinscriptions.mjs import
```

Exemple (les valeurs restent des paramètres, elles ne doivent pas être concaténées au SQL) :

```sql
INSERT OR IGNORE INTO preinscriptions
  (id, first_name, email, location, rider_profile, favorite_bike, primary_interest,
   message, consent_rgpd, status, invitation_sent_at, user_id, created_at)
VALUES (?, ?, lower(trim(?)), ?, ?, ?, ?, ?, 1, ?, ?, ?, ?);
```

Comparer ensuite le nombre de lignes et les adresses normalisées dans les deux bases. Conserver
l'export chiffré jusqu'à validation fonctionnelle, puis le supprimer selon la politique RGPD.

## Retour arrière

Redéployer la version précédente de l'application sans supprimer la base D1. Si le retour arrière
dure, réactiver temporairement l'ancienne politique d'insertion Supabase. Avant tout nouveau
déploiement, exporter les lignes reçues dans D1 pendant l'incident et les réimporter pour éviter
toute perte. La migration D1 est additive et ne doit pas être supprimée lors du rollback.

## État actuel (septembre 2026)

- `/join` écrit directement dans `public.preinscriptions` (base externe).
- `/admin/preinscriptions` lit directement cette table ; la règle `is_admin()` en protège l'accès.
- `POST /api/admin/preinscriptions` reste côté serveur pour les invitations (nécessite `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY`).
- `POST /api/preinscriptions` (D1) répond 410. Les fichiers et migrations D1 sont conservés à titre historique, hors du chemin critique.
