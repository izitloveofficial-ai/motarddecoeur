// Après le build mobile (mode SPA), TanStack Start génère dist/client/_shell.html
// comme point d'entrée. Capacitor exige un fichier "index.html" à la racine du
// dossier web (webDir) : ce script fait simplement la copie.
import { copyFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const clientDir = resolve(import.meta.dirname, "..", "dist", "client");
const shell = resolve(clientDir, "_shell.html");
const index = resolve(clientDir, "index.html");

if (!existsSync(shell)) {
  console.error(
    "Erreur : dist/client/_shell.html introuvable. Le build mobile (npm run build:mobile) a-t-il échoué avant cette étape ?",
  );
  process.exit(1);
}

copyFileSync(shell, index);
console.log("✓ dist/client/index.html créé à partir de _shell.html (prêt pour Capacitor).");
