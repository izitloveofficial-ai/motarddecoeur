# Préinscriptions — base applicative

## Cause du problème

Le navigateur écrivait directement dans la table Supabase historique. Cette écriture dépendait de
la configuration publique et l'administration lisait également cette ancienne table. Le formulaire
appelle désormais `POST /api/preinscriptions`; le serveur valide les données et écrit avec des
requêtes paramétrées dans la liaison Cloudflare D1 `DB`. L'administration utilise la même liaison.
Supabase ne sert plus au stockage des préinscriptions (il reste le fournisseur d'identité).

## Configuration et déploiement

1. Créer/lier la base D1 à l'application sous le nom exact `DB`.
2. Appliquer `migrations/0001_preinscriptions.sql` avec l'outil de migration de l'hébergeur.
3. Définir **uniquement côté serveur** `SUPABASE_URL`, `SUPABASE_ANON_KEY` (contrôle du rôle
   administrateur) et `SUPABASE_SERVICE_ROLE_KEY` (envoi d'invitations). Ne jamais utiliser le
   préfixe `VITE_` pour ces valeurs.
4. Déployer l'application, soumettre une adresse de recette sur `/join`, puis vérifier immédiatement
   le compteur et la ligne dans `/admin/preinscriptions`.

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
