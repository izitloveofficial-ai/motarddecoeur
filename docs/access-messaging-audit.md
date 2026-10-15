# Audit des accès membres et de la messagerie

Date de l'audit local : 24 septembre 2026.

## Périmètre et niveaux de preuve

Cet audit décrit **le dépôt de la branche de travail**. Il ne vaut ni recette du site publié,
ni validation des données de production. La configuration publique locale désigne le projet
Supabase existant, mais sa résolution DNS était indisponible pendant l'audit. Les politiques RLS,
les publications Realtime, les fonctions et les rôles effectivement déployés restent donc à
comparer avec les sources SQL du projet depuis le tableau de bord ou un accès opérateur en lecture.

Les statuts employés sont ceux de la mission :

- **vérifié en session réelle** : aucun parcours dans cet audit local ; deux identités autorisées
  et deux appareils sont nécessaires ;
- **défaut constaté** : comportement reproductible dans le code ou par test automatisé ;
- **maquette** : contenu sans parcours métier adossé aux données réelles ;
- **restant à tester** : contrôle statique effectué, mais preuve en session ou côté projet distant
  encore nécessaire.

## Matrice des rôles et des parcours

| Page ou action                                | Administrateur                | Bêta-testeur                  | Visiteur              | État / preuve locale                                                                     |
| --------------------------------------------- | ----------------------------- | ----------------------------- | --------------------- | ---------------------------------------------------------------------------------------- |
| `/login`, connexion et récupération           | Autorisé                      | Autorisé                      | Autorisé              | Restant à tester en session réelle                                                       |
| `/profile/setup`, profil et photos            | `requireAppAccess`            | `requireAppAccess`            | Refusé                | Restant à tester ; lectures/écritures Supabase côté session                              |
| `/profiles`                                   | Autorisé par `requireAdmin`   | Refusé                        | Refusé                | **Maquette** de profils fictifs, pas une preuve du parcours de rencontre                 |
| `/discover`                                   | `requireAppAccess`            | `requireAppAccess`            | Refusé                | Restant à tester ; intention de rencontre requise                                        |
| `/discover/likes`                             | `requireAppAccess`            | `requireAppAccess`            | Refusé                | Restant à tester ; intention de rencontre requise                                        |
| Like/refus, annulation et création d'un match | Autorisé                      | Autorisé                      | Refusé                | Restant à tester ; dépend des RLS/triggers de `swipes` et `matches`                      |
| `/matches`, `/matches/new`                    | `requireAppAccess`            | `requireAppAccess`            | Refusé                | Restant à tester                                                                         |
| `/messages` et `/messages/$matchId`           | `requireAppAccess`            | `requireAppAccess`            | Refusé                | Restant à tester à deux ; contrôle client du participant présent                         |
| Historique, envoi, lecture et Realtime        | Participant seulement attendu | Participant seulement attendu | Refusé attendu        | Restant à confirmer contre les RLS déployées ; fusion locale dédupliquée et triée testée |
| Indicateur de saisie                          | Participant attendu           | Participant attendu           | Refusé attendu        | Restant à tester à deux ; canal Broadcast à vérifier côté Realtime Authorization         |
| Blocage et signalement                        | Autorisé                      | Autorisé                      | Refusé                | Restant à tester ; ne pas assouplir les politiques pour la recette                       |
| `/profile/blocked`                            | `requireAppAccess`            | `requireAppAccess`            | Refusé                | Restant à tester                                                                         |
| `/rides`, création/participation/suivi        | `requireAppAccess`            | `requireAppAccess`            | Refusé                | Restant à tester                                                                         |
| `/community`, `/events`, `/premium`           | `requireAppAccess`            | `requireAppAccess`            | Refusé                | Restant à tester ; certaines surfaces sont essentiellement éditoriales                   |
| `/admin/preinscriptions`                      | `requireAdminPage`            | Refusé                        | Refusé                | Restant à tester avec les trois rôles                                                    |
| `/admin/members`                              | `requireAdminPage`            | Refusé                        | Refusé                | Restant à tester avec les trois rôles                                                    |
| `/admin/reports`                              | `requireAdminPage`            | Refusé                        | Refusé                | Restant à tester ; correction annoncée en `96b9c03` absente des objets Git locaux        |
| `/admin/announcements`, `/admin/status`       | `requireAdminPage`            | Refusé                        | Refusé                | Restant à tester avec les trois rôles                                                    |
| Lecture publique de `/rdv/$token`             | Sans rôle, avec jeton         | Sans rôle, avec jeton         | Sans rôle, avec jeton | Restant à tester : confidentialité, expiration et entropie du jeton côté base            |

## Chemins de contrôle vérifiés dans le dépôt

1. Les routes membres exécutent `requireAppAccess`, qui exige une session fraîche puis accepte
   `is_admin()` **ou** `is_beta_tester()`.
2. Toutes les routes `/admin/*` présentes exécutent `requireAdminPage`, qui n'accepte que
   `is_admin()` ; la seule dissimulation d'un lien dans l'interface n'est donc pas la protection.
3. La conversation relit le match et refuse localement un utilisateur qui n'est ni
   `profile_a_id` ni `profile_b_id`. Ce contrôle améliore l'interface mais ne remplace pas la RLS.
4. L'envoi insère `match_id`, `sender_id` et le contenu avec le jeton de l'utilisateur. La réception
   écoute les `INSERT` et `UPDATE` de `messages` filtrés par match. L'historique et les événements
   Realtime sont maintenant fusionnés par identifiant et triés chronologiquement, y compris après
   une reconnexion ou une livraison hors ordre.
5. `send-push` authentifie l'appelant et vérifie avec la clé serveur qu'un match relie l'appelant au
   destinataire. Les clés privilégiées restent dans les Edge Functions.

## Contrôles distants obligatoires avant de conclure

Exporter ou consulter **en lecture seule**, sans appliquer de migration :

- les politiques RLS et privilèges de `profiles`, `profile_photos`, `profile_prompts`, `swipes`,
  `matches`, `messages`, `blocks`, `reports`, `events`, `event_attendees`, `follows`,
  `safety_shares`, `admin_users` et la table des bêta-testeurs ;
- le corps et les droits `EXECUTE` de `is_admin`, `is_beta_tester`, `nearby_profiles`,
  `who_liked_me`, `mark_match_seen` et `event_notification_targets` ;
- l'appartenance de `messages` à la publication Supabase Realtime ;
- l'autorisation Broadcast du canal de conversation : un tiers ne doit ni écouter ni usurper un
  indicateur de saisie ;
- les politiques du bucket `profile-photos` pour lecture, ajout, remplacement et suppression ;
- les versions réellement déployées des Edge Functions `send-push`, `delete-account` et
  `admin-ban-user`.

Points de refus à démontrer : un tiers ne lit ni n'insère dans un match, un utilisateur bloqué ne
peut plus écrire dans les deux sens, un bêta-testeur ne lit aucune table d'administration et ne peut
appeler aucune action privilégiée. Les fonctions de suppression définitive présentes dans le dépôt
n'ont pas été invoquées pendant cet audit.

## Protocole de recette à deux appareils

Ne créer la mise en relation qu'après identification explicite par Christophe d'un compte neuf sous
son contrôle ou d'un bêta-testeur autorisé. Relever les UUID des deux participants, vérifier leurs
rôles et profils, puis vérifier l'absence de blocage ; ne choisir aucun compte existant au hasard.

Pour chaque sens A→B puis B→A, envoyer au moins cinq messages identifiables et noter, avec une
horloge monotone côté navigateur :

| Message    | Envoi validé côté émetteur | Apparition côté destinataire | Délai (ms) | Doublon / ordre |
| ---------- | -------------------------- | ---------------------------- | ---------- | --------------- |
| 1 à 5, A→B | À mesurer                  | À mesurer                    | À mesurer  | À vérifier      |
| 1 à 5, B→A | À mesurer                  | À mesurer                    | À mesurer  | À vérifier      |

Vérifier ensuite : réception sans rechargement, historique et ordre après rechargement, absence de
doublon, saisie, passage à « Vu », coupure/rétablissement réseau, reprise après reconnexion et rendu
sur les deux formats mobiles. Dans une troisième session non participante, tenter l'URL directe et
les lectures/insertions API : elles doivent être refusées sans révéler le profil ou l'historique.
Bloquer enfin un compte de recette, confirmer l'échec d'envoi, puis restaurer uniquement l'état de
recette prévu. Conserver les mesures réelles dans ce document ou dans le compte rendu de recette ;
ne jamais remplacer ces mesures par une estimation locale.

## Limites et décision de publication

- Aucun compte, profil, match, message, média ou rôle n'a été créé, modifié ou supprimé.
- Aucun test à deux sessions ni aucune mesure de latence n'a encore été réalisé.
- L'état déployé de Supabase et de Lovable n'a pas été vérifié à cause de l'indisponibilité réseau.
- La branche de travail n'est pas `main` : aucune publication Lovable ne doit être déclenchée à ce
  stade. Après fusion sur `main`, publier, contrôler le statut, puis exécuter la recette ci-dessus
  avant toute autre bascule.

## Relevé distant en lecture seule — 15 octobre 2026

Projet lu : `pfaxuvdcmcfnzjqskbrl` (`motards-de-coeur`, eu-west-1), le seul projet Supabase du compte
et celui référencé par le client du site. Lecture faite uniquement par requêtes `SELECT` sur le
catalogue, l'outil d'avis de sécurité Supabase et la lecture du code des Edge Functions déployées.
Aucune migration, aucune écriture, aucun appel de fonction métier ou d'Edge Function.

Volumes au moment du relevé (comptages agrégés) : 28 profils dont 18 Premium, 2 admins,
16 bêta-testeurs, 15 matchs, 36 messages, 0 blocage, 10 fichiers photo, 23 préinscriptions.

Statut des constats ci-dessous : **défaut constaté** dans les règles déployées. Aucun n'a été
exploité ni démontré par une requête réelle ; la preuve par refus/acceptation relève de l'étape 2.

### Critique

1. **Un membre peut s'attribuer Premium lui-même.** La politique `modification de son propre
   profil` (UPDATE, `auth.uid() = id`, sans `WITH CHECK`) et les privilèges de colonne laissent
   `authenticated` modifier `is_premium`, `plan`, `is_verified` et `is_active` sur sa ligne.
   Le déclencheur `sync_plan_and_premium` aligne les deux colonnes mais ne bloque rien. Toutes les
   vérifications Premium côté base (`start_pending_conversation`, super like, `who_liked_me`,
   tri de `nearby_profiles`) se contournent ainsi.
2. **Le destinataire d'un message peut le réécrire ou le déplacer.** La politique `marquer les
   messages recus comme lus` autorise un UPDATE de toute la ligne, pas seulement `read_at`.
   `WITH CHECK (sender_id <> auth.uid())` ne vérifie pas l'appartenance au nouveau `match_id` :
   le destinataire peut modifier `content` d'un message reçu, voire le rattacher à une autre
   conversation dont il connaît l'identifiant.

### Élevé

3. **`send-push` déployée diffère du dépôt.** La version déployée (v8) accepte n'importe quel
   `profile_id` de n'importe quel membre connecté, sans contrôle de relation ni limite de longueur ;
   la version du dépôt exige un match et limite titre/corps. Impact réel conditionné à la présence
   du secret `FIREBASE_SERVICE_ACCOUNT_JSON`, non vérifiée.
4. **Temps réel.** Seule `public.messages` est dans la publication `supabase_realtime` : l'abonnement
   du client aux UPDATE de `matches` (passage « en attente » → « mutuel ») ne reçoit donc jamais
   d'événement. Le canal `messages:<matchId>` est ouvert sans `private: true` et `realtime.messages`
   n'a aucune politique : le Broadcast « en train d'écrire » n'est pas autorisé côté serveur ;
   quiconque connaît l'UUID du match peut l'écouter ou l'usurper (impact limité à l'indicateur).
5. **Lecture anonyme.** `profile_photos`, `profile_prompts` et `profile_interests` sont lisibles par
   le rôle `anon` (politiques sur `public`) pour tout profil actif, sans filtre de blocage ; le bucket
   `profile-photos` est public. `event_attendees` est lisible par `anon` : qui participe à quel
   événement est public.

### Moyen ou à arbitrer

6. `pending_charges` : un membre peut insérer des frais pour lui-même, alors que la politique
   s'intitule « seul le système peut créer des frais en attente ».
7. Un participant peut supprimer un match ; la clé étrangère `messages → matches` est en
   `ON DELETE CASCADE` : l'historique disparaît aussi pour l'autre personne.
8. Stockage : aucune politique UPDATE sur `profile-photos`, le remplacement d'un fichier par
   upsert échouera ; ajout et suppression limités au dossier `<uid>/`.
9. `weekly-backup` envoie chaque lundi l'export JSON complet (profils, messages, signalements…)
   en pièce jointe par e-mail via Resend : point à valider au regard du RGPD.
10. Avis Supabase : RLS désactivé sur `spatial_ref_sys` (PostGIS), protection contre les mots de
    passe divulgués désactivée, `search_path` non fixé sur `check_forbidden_words` et
    `sync_plan_and_premium`, extensions `postgis` et `pg_net` dans `public`, 23 fonctions
    `SECURITY DEFINER` exécutables par `anon` (sans effet utile sans session pour la plupart).

### Conforme à l'attendu

- RLS activé sur toutes les tables applicatives ; `magic_links` sans politique (fermée aux clients).
- `is_blocked` est bidirectionnel ; l'envoi de message exige d'être participant et non bloqué ;
  `nearby_profiles`, `who_liked_me` et la lecture des profils excluent les comptes bloqués.
- Un tiers ne lit ni `matches` ni `messages` d'une conversation à laquelle il ne participe pas.
- `admin_users` lisible par les seuls admins ; un bêta-testeur ne lit que sa propre ligne et
  aucune table d'administration.
- `mark_match_seen` limitée aux participants ; `event_notification_targets` et `mark_match_seen`
  non exécutables par `anon`.
- `delete-account` ne supprime que l'utilisateur du JWT ; `admin-ban-user` exige une ligne
  `admin_users` ; les fonctions sans JWT (`send-test-email`, `check-email-status`,
  `weekly-backup`, `upload-test-photo`) exigent un admin ou le secret cron ; les tâches
  `pg_cron` ne contiennent pas le secret en clair.

### Écart entre le dépôt et la production

- 65 migrations appliquées en production contre 7 fichiers dans `supabase/migrations/` : le
  dépôt ne permet pas de reconstruire la base.
- 13 Edge Functions déployées contre 3 dans le dépôt (`send-preinscription-invitations`,
  `send-progress-update`, `member-lifecycle-emails`, `health-check`, `send-test-email`,
  `check-email-status`, `delete-storage-object`, `weekly-backup`, `upload-test-photo`,
  `redeem-magic-link` absentes du dépôt). `delete-account` et `admin-ban-user` correspondent au
  dépôt sur les contrôles d'accès ; `send-push` non (point 3).
- La migration `schedule_member_lifecycle_emails` est appliquée mais aucune tâche `pg_cron`
  correspondante n'existe : envoi désactivé ou supprimé, à confirmer.

### Non vérifié à ce stade

Refus et acceptations par requêtes réelles avec deux comptes (étape 2), présence du secret
Firebase, réglages Auth autres que ceux de l'avis, version publiée sur Lovable, et données
éventuelles hors Supabase (Cloudflare).
