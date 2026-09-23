# Motards de Cœur

## Pré-inscriptions

Le formulaire `/join` écrit directement dans `public.preinscriptions` (base Supabase existante,
insertion anonyme autorisée par RLS avec `consent_rgpd = true`). `/admin/preinscriptions` lit cette
même table avec la session administrateur ; la politique RLS `is_admin()` filtre l'accès. Les
invitations passent par `POST /api/admin/preinscriptions` (clé de service côté serveur). Les fichiers
D1 sont historiques — voir `docs/preinscriptions-application-database.md`.

## Notification email reportée

La notification email ajoutée dans la PR #44 est désactivée. Son appel reposait sur une fonction
serveur TanStack Start importée par la route `/join`; ce backend n'est pas disponible dans l'aperçu
Lovable et empêchait celui-ci de charger l'application.

Cette fonctionnalité devra être réintroduite uniquement avec un backend pris en charge par
l'environnement de déploiement (par exemple une Edge Function Supabase). La clé du fournisseur
d'email devra rester exclusivement dans les secrets de ce backend et ne jamais utiliser le préfixe
public `VITE_`.
