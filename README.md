# Motards de Cœur

## Notification email des pré-inscriptions

Le formulaire `/join` continue d'enregistrer directement les données dans
`public.preinscriptions` via la clé publique Supabase. Une fois cet enregistrement confirmé, une
fonction **exécutée côté serveur** demande à [Resend](https://resend.com/) d'envoyer une notification.
La clé Resend n'est donc jamais incluse dans le JavaScript du navigateur.

L'envoi est volontairement « best effort » : une configuration email absente ou une erreur Resend
est journalisée côté serveur, sans annuler l'enregistrement Supabase ni remplacer le message de
succès affiché au visiteur.

### Configuration manuelle

1. Créer un compte Resend.
2. Dans **Domains**, ajouter et vérifier `motardsdecoeur.com`. Ajouter chez le fournisseur DNS les
   enregistrements SPF/DKIM indiqués par Resend et attendre que le domaine soit marqué comme vérifié.
3. Créer une clé API Resend limitée à l'envoi d'emails.
4. Ajouter les variables suivantes dans les secrets/variables **serveur** de l'hébergeur :

   ```dotenv
   RESEND_API_KEY=re_xxxxxxxxx
   PREINSCRIPTION_NOTIFICATION_TO=contact@motardsdecoeur.com
   PREINSCRIPTION_NOTIFICATION_FROM=Motards de Coeur <notifications@motardsdecoeur.com>
   ```

   `PREINSCRIPTION_NOTIFICATION_FROM` doit utiliser le domaine vérifié. Ces variables ne doivent
   jamais porter le préfixe `VITE_`, car les variables `VITE_*` sont publiques. Les variables
   Supabase publiques existantes (`VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY`) restent
   nécessaires au formulaire.

5. Redéployer l'application après l'ajout des variables.

### Vérifications après déploiement

1. Soumettre une nouvelle adresse email depuis `/join` et vérifier le message de succès.
2. Vérifier la nouvelle ligne dans `public.preinscriptions`.
3. Vérifier la réception sur `contact@motardsdecoeur.com` et l'événement correspondant dans les
   journaux Resend (contrôler aussi les indésirables lors du premier test).
4. Effectuer un test temporaire sans `RESEND_API_KEY` : la ligne Supabase et le message de succès
   doivent toujours être présents, tandis que le serveur doit journaliser l'absence de configuration.
