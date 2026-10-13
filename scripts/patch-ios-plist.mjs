// Ajoute les autorisations caméra / photos dans le projet iPhone (Info.plist),
// et retire la clé qui empêche l'installation (ITSWatchOnlyContainer).
// Sans danger si on le relance : il n'ajoute jamais deux fois la même clé.
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const file = "ios/App/App/Info.plist";
if (!existsSync(file)) {
  console.error("Dossier ios introuvable : lance d'abord « cap add ios ».");
  process.exit(1);
}

let xml = readFileSync(file, "utf8");
const additions = {
  NSCameraUsageDescription:
    "Motards de Cœur a besoin d'accéder à l'appareil photo pour ta photo de profil.",
  NSPhotoLibraryUsageDescription:
    "Motards de Cœur a besoin d'accéder à tes photos pour choisir une photo de profil.",
};

let changed = false;
for (const [key, text] of Object.entries(additions)) {
  if (xml.includes(`<key>${key}</key>`)) continue;
  xml = xml.replace(
    /<\/dict>\s*<\/plist>\s*$/,
    `\t<key>${key}</key>\n\t<string>${text}</string>\n</dict>\n</plist>\n`,
  );
  console.log(`+ ${key} ajouté`);
  changed = true;
}

const watchKey = /\s*<key>ITSWatchOnlyContainer<\/key>\s*<(true|false)\/>/;
if (watchKey.test(xml)) {
  xml = xml.replace(watchKey, "");
  console.log("- ITSWatchOnlyContainer retiré");
  changed = true;
}

if (changed) writeFileSync(file, xml);
console.log(changed ? "Info.plist mis à jour." : "Info.plist déjà à jour.");
