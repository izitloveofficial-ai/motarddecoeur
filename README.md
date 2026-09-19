# Motards de Cœur

## Pré-inscriptions

Le formulaire `/join` transmet les préinscriptions à l'API serveur, qui les valide puis les écrit
dans la base applicative D1. Voir `docs/preinscriptions-application-database.md` pour la migration,
les variables serveur, l'import de l'historique et le retour arrière.

## Notification email reportée

La notification email ajoutée dans la PR #44 est désactivée. Son appel reposait sur une fonction
serveur TanStack Start importée par la route `/join`; ce backend n'est pas disponible dans l'aperçu
Lovable et empêchait celui-ci de charger l'application.

Cette fonctionnalité devra être réintroduite uniquement avec un backend pris en charge par
l'environnement de déploiement (par exemple une Edge Function Supabase). La clé du fournisseur
d'email devra rester exclusivement dans les secrets de ce backend et ne jamais utiliser le préfixe
public `VITE_`.
