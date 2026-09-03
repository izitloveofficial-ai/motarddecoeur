# Motards de Cœur

## Pré-inscriptions

Le formulaire `/join` enregistre directement les pré-inscriptions dans la table Supabase
`public.preinscriptions` avec la configuration publique existante
(`VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY`).

## Notification email reportée

La notification email ajoutée dans la PR #44 est désactivée. Son appel reposait sur une fonction
serveur TanStack Start importée par la route `/join`; ce backend n'est pas disponible dans l'aperçu
Lovable et empêchait celui-ci de charger l'application.

Cette fonctionnalité devra être réintroduite uniquement avec un backend pris en charge par
l'environnement de déploiement (par exemple une Edge Function Supabase). La clé du fournisseur
d'email devra rester exclusivement dans les secrets de ce backend et ne jamais utiliser le préfixe
public `VITE_`.
