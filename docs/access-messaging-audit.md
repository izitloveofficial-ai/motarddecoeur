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
