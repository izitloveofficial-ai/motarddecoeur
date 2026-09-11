import type { CapacitorConfig } from "@capacitor/cli";

// Identifiant unique de l'app (format inversé du nom de domaine).
// ⚠️ Une fois publié sur les stores, cet identifiant ne peut plus jamais changer.
const appId = "app.motardsdecoeur.mobile";

const config: CapacitorConfig = {
  appId,
  appName: "Motards de Cœur",
  webDir: "dist/client",
  backgroundColor: "#1a1112", // Couleur de fond avant le premier rendu (évite le flash blanc)
  server: {
    // Contenu chargé localement depuis les fichiers embarqués (mode 100% statique),
    // jamais depuis une URL distante — nécessaire pour l'app store review et le
    // fonctionnement hors-ligne partiel (l'UI se charge même sans réseau, seules
    // les données Supabase nécessitent une connexion).
    androidScheme: "https",
  },
};

export default config;
