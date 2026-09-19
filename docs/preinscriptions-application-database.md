# Préinscriptions — base applicative

## Cause du problème

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
2. Appliquer `migrations/0001_preinscriptions.sql` à cette base D1 avant le déploiement. Vérifier
   ensuite `preinscriptions` et `preinscription_attempts` dans la liste des tables.
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

Avant de désactiver l'ancienne table, exporter les cinq lignes en CSV depuis Supabase. Pour chaque
ligne, exécuter côté D1 un `INSERT OR IGNORE` dans `preinscriptions`, en faisant correspondre
`city` vers `location`, en conservant `created_at`, `status`, `invitation_sent_at`, `user_id` et les
champs de formulaire. Normaliser `email` en minuscules et convertir `consent_rgpd` en `1`.

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
