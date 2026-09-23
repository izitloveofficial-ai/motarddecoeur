# Consignes permanentes — Motards de Cœur

## Objectif

Le site est déjà très avancé. Centraliser progressivement la gestion des comptes, des données et des fonctions dans les services accessibles depuis le projet Lovable Pro, après vérification technique de leur architecture réelle. La base Supabase actuelle et les anciens parcours Cloudflare peuvent contenir des données et des comptes à conserver.

## Règles impératives

- Ne supprimer, écraser ni réinitialiser aucune donnée, aucun compte, aucune identité, aucun profil ni aucun média existant.
- Ne jamais créer une nouvelle base ou basculer des utilisateurs sans inventaire, export vérifié, correspondance des identifiants, validation fonctionnelle et procédure de retour arrière.
- Avant une modification, identifier les systèmes réellement utilisés en production et le chemin complet de lecture et d’écriture. Ne pas déduire l’état des données du seul code ou du statut « Lovable Cloud ».
- Préserver les parcours existants : ouverture de compte, connexion, préinscription, activation, administration, invitations, profils, messagerie et autres fonctions actives. Vérifier les droits d’accès et les règles RLS avant chaque bascule.
- Procéder par étapes réversibles : lecture et inventaire, sauvegarde, correction ciblée, tests, comparaison des données avant/après, puis publication contrôlée. Ne désactiver un ancien chemin qu’après avoir vérifié qu’aucun client actif ne l’utilise et que son remplacement fonctionne.
- Ne pas ajouter de secrets dans le dépôt ou le navigateur. Les accès privilégiés restent côté serveur.
- Signaler explicitement ce qui n’a pas été vérifié sur les données ou l’environnement de production. Ne jamais présenter une migration comme terminée sur la seule base d’un build ou de tests locaux.
- Préférer les outils directs de dépôt et les connecteurs à l’agent conversationnel Lovable afin d’éviter de consommer simultanément les crédits Lovable et Codex. N’utiliser le chat Lovable que si indispensable.

## État historique à vérifier, pas à présumer

Le projet a utilisé Supabase et des parcours sur Cloudflare. L’objectif actuel est une centralisation progressive dans l’écosystème Lovable Pro. Le code et les connexions peuvent évoluer : établir l’état réel à chaque intervention avant de choisir la prochaine étape.
