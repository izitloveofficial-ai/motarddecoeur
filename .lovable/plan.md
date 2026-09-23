# Audit de centralisation (lecture seule) et plan de bascule

## 1. Connexion effectivement configurée
- Le projet est lié à une seule base externe (identifiant visible dans l'URL publique `pfaxuvdcmcfnzjqskbrl`). Le navigateur la lit via les variables publiques du fichier `.env` (URL + clé publique uniquement).
- Aucune liaison Lovable Cloud n'est gérée par ce projet ; aucun secret serveur (clé de service, URL serveur) n'est visible dans l'environnement de travail. Le statut de session de test est `no_supabase`.
- Base D1 : aucune liaison `DB` présente dans ce déploiement.

## 2. Ce que mon environnement peut réellement faire
- Lire : le code, les fichiers de migration du dépôt, l'historique git.
- Ne peut pas : lire les tables, les règles d'accès réelles, les comptes ni les fonctions déployées (pas d'accès à la base, pas de session admin, pas de clé de service). Toute affirmation sur l'état réel de la base reste donc **non vérifiée**.
- Pour l'auditer vraiment, il faut soit relier la base au projet (Connecteurs), soit que le propriétaire exécute des requêtes de comptage fournies par moi (sans données personnelles).

## 3. Cartographie des flux (code courant)

```text
Inscription compte  /signup  -> Auth (signUp)            -> base externe
Connexion           /login   -> Auth (signIn)            -> base externe
Préinscription      /join    -> INSERT preinscriptions   -> base externe (direct)
Activation          /activate-> RPC get_invited_/finalize_preinscription
Profils/app         profile.setup, discover, matches, messages -> tables profiles,
                    profile_photos, prompts, swipes, matches, messages, blocks, reports
Admin préinscr.     /admin/preinscriptions -> fetch /api/admin/preinscriptions
                    GET  -> lit D1 (database(env))      <-- ÉCART
                    POST -> invitations via REST base externe (clé de service)
Admin membres/signalements -> tables + fonction admin-ban-user
Contrôle d'accès    require-admin.ts -> RPC is_admin / is_beta_tester
```

## 4. Écarts détectés
1. **Critique** : `/join` écrit dans la base externe, mais la liste admin (GET `/api/admin/preinscriptions`) lit encore D1, absent -> erreur 500, la liste admin ne peut pas afficher les inscriptions. Le résumé précédent disant « lecture directe » ne correspond pas au code actuel.
2. L'envoi d'invitations dépend d'une clé de service non configurée -> réponse 503.
3. `POST /api/preinscriptions` (D1) reste branché dans `src/server.ts` : route morte mais active, source de confusion.
4. Fonctions appelées mais absentes du dépôt : `send-progress-update`, `health-check` (existence réelle non vérifiable).
5. Dérive de structure : les tables de l'application (profiles, matches, messages, swipes, reports, blocks, prompts, announcements, push_tokens, progress_updates, beta testers) n'ont aucun fichier de création dans le dépôt ; `member_profiles` est créé mais le code utilise `profiles`.
6. `use-admin-status.ts` refait un contrôle `is_admin` côté navigateur (affichage seulement, acceptable si la base garde les règles).

## 5. Plan incrémental (après approbation, aucune suppression)
**Étape 0 — Sauvegarde et inventaire (propriétaire)**
- Export complet de la base depuis le tableau de bord du fournisseur ; export des comptes Auth.
- Exécution de requêtes de comptage que je fournis (nombre de préinscriptions par statut, nombre de comptes, de profils, lignes de `admin_users`), sans afficher d'e-mails.

**Étape 1 — Corriger la lecture admin (petite modification)**
- Faire lire la liste admin directement dans `preinscriptions` via la session admin (règle `is_admin()` déjà prévue), le serveur ne gardant que les invitations.
- Validation : l'admin voit les 5 lignes historiques + les nouvelles ; comptage identique à l'étape 0.

**Étape 2 — Invitations**
- Ajouter la clé de service dans Secrets ; tester sur une adresse de recette ; vérifier passage `pending -> invited`.

**Étape 3 — Neutraliser D1 sans rien supprimer**
- Débrancher la route `POST /api/preinscriptions` D1 (fichiers et migrations D1 conservés, marqués historiques) ; mise à jour de la documentation.

**Étape 4 — Aligner le dépôt sur la base réelle**
- Récupérer la structure réelle (lecture seule) et l'ajouter au dépôt comme référence, sans l'appliquer. Vérifier les fonctions manquantes.

**Validation avant chaque bascule** : comptages avant/après identiques, test /join -> visible en admin, connexion d'un compte existant, aucun compte ni ligne perdu. Retour arrière = version précédente du site, données intactes.

## Points à confirmer
- Voulez-vous relier la base au projet pour que je puisse lire la structure (étape 4), ou préférez-vous exécuter vous-même les requêtes ?
