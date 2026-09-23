# Consignes permanentes — Motards de Cœur

## Architecture de référence

Le site est déjà avancé et utilise directement le projet Supabase existant pour l'authentification et les données. Le backend Lovable Cloud n'est pas activé. Conserver ce projet Supabase connecté à Lovable tant qu'une autre solution n'apporte pas un bénéfice démontré et une migration vérifiée. Centraliser le pilotage du site dans le projet Lovable Pro ne signifie pas déplacer physiquement la base.

## Règles impératives

- Ne supprimer, écraser ni réinitialiser aucune donnée, aucun compte, aucune identité, aucun profil ni aucun média existant.
- Ne jamais créer une nouvelle base ou basculer des utilisateurs sans inventaire, export vérifié, correspondance des identifiants, validation fonctionnelle et procédure de retour arrière.
- Avant une modification, identifier les systèmes réellement utilisés en production et le chemin complet de lecture et d'écriture. Ne pas déduire l'état des données du seul code ou du statut « Lovable Cloud ».
- Préserver les parcours existants : ouverture de compte, connexion, préinscription, activation, administration, invitations, profils, messagerie et autres fonctions actives. Vérifier les droits d'accès et les règles RLS avant chaque bascule.
- Procéder par étapes réversibles : lecture et inventaire, sauvegarde, correction ciblée, tests, comparaison des données avant/après, puis publication contrôlée. Ne désactiver un ancien chemin qu'après avoir vérifié qu'aucun client actif ne l'utilise et que son remplacement fonctionne.
- Après chaque modification arrivée sur la branche de production `main`, publier le projet Lovable, vérifier le statut de publication et contrôler le parcours touché avant de poursuivre. Si la publication échoue, arrêter les changements suivants et traiter l'incident. Une branche de travail ou PR ne constitue pas une version de production.
- Ne pas ajouter de secrets dans le dépôt ou le navigateur. Les accès privilégiés restent côté serveur.
- Signaler explicitement ce qui n'a pas été vérifié sur les données ou l'environnement de production. Ne jamais présenter une migration comme terminée sur la seule base d'un build ou de tests locaux.
- Préférer les outils directs de dépôt et les connecteurs à l'agent conversationnel Lovable afin d'éviter de consommer simultanément les crédits Lovable et Codex. N'utiliser le chat Lovable que si indispensable.

## État historique à vérifier, pas à présumer

Le projet a utilisé Supabase et des parcours sur Cloudflare. Les éventuelles données Cloudflare et fonctions déployées hors du dépôt restent à inventorier. Établir l'état réel à chaque intervention. Suivre la feuille de route du rapport d'audit daté du 23 septembre 2026, avec validation des critères de sortie avant l'étape suivante.
