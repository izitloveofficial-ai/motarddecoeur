// Configuration DÉDIÉE à l'application mobile (Capacitor).
//
// N'affecte JAMAIS le site web publié sur Lovable : celui-ci continue
// d'utiliser vite.config.ts (avec le serveur Nitro/Cloudflare) normalement.
//
// Cette configuration produit une version 100 % statique du site (mode SPA
// de TanStack Start), sans aucun serveur requis à l'exécution — nécessaire
// car Capacitor ne peut charger que des fichiers locaux, jamais un serveur.
//
// Utilisation : npm run build:mobile (voir package.json)
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  nitro: false,
  tanstackStart: {
    spa: { enabled: true },
  },
  vite: {
    // Certains environnements de build (bacs à sable, CI restreints) ne supportent
    // pas IPv6 ; ce réglage force IPv4 pour le serveur de prévisualisation interne
    // utilisé pendant la génération du fichier statique. Sans incidence ailleurs.
    preview: { host: "127.0.0.1" },
  },
});
