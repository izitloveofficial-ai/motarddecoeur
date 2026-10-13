#!/bin/sh
# Prépare l'application Android en une seule commande : sh android.sh
# (construit le site mobile, crée ou met à jour le projet Android, puis ouvre Android Studio.)
set -e
cd "$(dirname "$0")"

BUN="$HOME/.bun/bin/bun"
[ -x "$BUN" ] || BUN="$(command -v bun || true)"
if [ -z "$BUN" ]; then
  echo "Bun est introuvable. Dis-le-moi et on le réinstalle."
  exit 1
fi

echo "1/4  Construction de la version mobile…"
"$BUN" run build:mobile

if [ ! -d android ]; then
  echo "2/4  Création du projet Android…"
  "$BUN" x cap add android
else
  echo "2/4  Projet Android déjà présent."
fi

echo "3/4  Synchronisation…"
"$BUN" x cap sync android

echo "4/4  Ouverture d'Android Studio…"
"$BUN" x cap open android
echo "Terminé. Dans Android Studio, attends la fin de « Gradle sync », choisis un appareil et clique sur le triangle vert."
