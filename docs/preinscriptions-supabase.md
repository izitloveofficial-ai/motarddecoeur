# Lire les pré-inscriptions dans Supabase

## Structure actuelle

La table `public.preinscriptions` conserve deux générations de champs :

- le formulaire actuel écrit `first_name`, `email`, `location`, `rider_profile`,
  `favorite_bike`, `primary_interest`, `message`, `consent_rgpd` et `created_at` ;
- les anciens champs `city`, `age`, `sex` et `bike_type` sont toujours présents,
  mais sont facultatifs. Ils peuvent donc être à `NULL` sur les nouvelles lignes.

Ces anciens champs ne sont **pas supprimés** : ils restent notamment utilisés comme
valeurs de repli par le parcours de conversion des pré-inscriptions historiques.

## Vue de lecture

La migration `20260908120000_create_preinscriptions_readable_view.sql` crée la vue
`public.preinscriptions_readable`. Elle expose uniquement, dans cet ordre :

1. `created_at` ;
2. `first_name` ;
3. `email` ;
4. `location` ;
5. `rider_profile` ;
6. `favorite_bike` ;
7. `primary_interest` ;
8. `message` ;
9. `consent_rgpd`.

La vue est déclarée avec `security_invoker = true` : elle respecte donc les règles
RLS de la table source. La lecture anonyme reste interdite et l'accès authentifié
continue de dépendre de la politique administrateur existante.

## Consultation dans Supabase

Après application des migrations, ouvrir **Table Editor**, sélectionner le schéma
`public`, puis la vue **preinscriptions_readable**. Il est aussi possible de la lire
depuis le SQL Editor :

```sql
select *
from public.preinscriptions_readable
order by created_at desc;
```

La table `public.preinscriptions` reste la source utilisée par le formulaire et par
le parcours d'invitation. La vue est uniquement une présentation simplifiée et ne
modifie ni les insertions ni les données existantes.

## Nettoyage ultérieur

Une suppression de `city`, `age`, `sex` ou `bike_type` devra faire l'objet d'une
validation et d'une migration séparée. Avant ce nettoyage, il faudra migrer les
données historiques utiles et retirer les valeurs de repli qui référencent encore
ces colonnes dans les fonctions de conversion.
