# Conversion des préinscriptions au lancement

## État préparé (aucun envoi)

La migration conserve `public.preinscriptions`, ajoute son suivi de conversion et crée
`public.member_profiles` uniquement parce qu'aucune table de profil n'existait dans les migrations
du projet. Elle ne crée aucun utilisateur Auth. La campagne est initialisée avec `enabled = false` :
la fonction d'envoi répond `campaign_suspended` tant qu'elle reste suspendue.

## Déploiement

1. Appliquer les migrations Supabase.
2. Déployer `send-preinscription-invitations` avec la vérification JWT active.
3. Définir le secret Edge Function `SITE_URL` et personnaliser le modèle **Invite user** de
   Supabase Auth avec le libellé « Créer mon compte Motards de Cœur ».
4. Ajouter explicitement le premier administrateur, après création volontaire de son compte :
   `insert into public.admin_users(user_id) values ('UUID_AUTH_ADMIN');`.
5. Vérifier que `/activate` figure dans les URL de redirection Auth autorisées.

La clé `SUPABASE_SERVICE_ROLE_KEY` est injectée automatiquement dans l'Edge Function et ne doit
jamais être ajoutée à une variable `VITE_*`.

## Lancer plus tard

Après validation sur un projet de recette et ordre explicite de lancement :

```sql
update public.invitation_campaign
set enabled = true, updated_at = now(), updated_by = 'UUID_AUTH_ADMIN'
where id = true;
```

L'administrateur authentifié ouvre `/admin/preinscriptions`, filtre et sélectionne les lignes, puis
confirme l'envoi. Les lots sont limités à 100 identifiants. Les lignes sans consentement et les
statuts `declined`, `invalid` ou `converted` sont ignorés. Une ligne déjà `invited` n'est pas
renvoyée, ce qui rend la commande relançable sans double envoi.

## Suspendre ou annuler

Suspendre immédiatement tous les nouveaux envois (les e-mails déjà remis ne sont pas rappelables) :

```sql
update public.invitation_campaign
set enabled = false, updated_at = now(), updated_by = 'UUID_AUTH_ADMIN'
where id = true;
```

Marquer individuellement une personne désinscrite ou une adresse inutilisable :

```sql
update public.preinscriptions set status = 'declined' where id = 'UUID_PREINSCRIPTION';
update public.preinscriptions set status = 'invalid' where id = 'UUID_PREINSCRIPTION';
```

## Recette obligatoire avant lancement

Effectuer ces contrôles exclusivement dans un projet de recette avec une adresse contrôlée :

1. insertion publique d'une nouvelle préinscription consentie, sans utilisateur Auth ;
2. conservation d'une ligne antérieure après migration (`status = pending`) ;
3. refus d'envoi lorsque la campagne est suspendue, puis invitation de l'adresse de test ;
4. définition d'un mot de passe depuis `/activate` ;
5. préremplissage, correction et création de `member_profiles` ;
6. liaison `user_id`, statut `converted` et `converted_at` ;
7. second clic : même UUID et même profil, sans nouvel utilisateur ;
8. adresse Auth existante : aucune identité en doublon et traitement manuel/connexion normale ;
9. accès anonyme : INSERT consenti autorisé, SELECT/UPDATE refusés ;
10. accès authentifié non-admin : liste et Edge Function refusées ; accès admin : liste autorisée.

Ne jamais exécuter cette recette sur les adresses réelles de production.
