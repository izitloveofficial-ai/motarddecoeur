#!/bin/sh
# Prépare l'application iPhone en une seule commande : sh ios.sh
# (construit le site mobile, met à jour le projet iPhone, ajoute les autorisations
# et les icônes, puis ouvre Xcode.)
set -e
cd "$(dirname "$0")"

BUN="$HOME/.bun/bin/bun"
[ -x "$BUN" ] || BUN="$(command -v bun || true)"
if [ -z "$BUN" ]; then
  echo "Bun est introuvable. Dis-le-moi et on le réinstalle."
  exit 1
fi

echo "1/6  Construction de la version mobile…"
"$BUN" run build:mobile

if [ ! -d ios ]; then
  echo "2/6  Création du projet iPhone…"
  "$BUN" x cap add ios
else
  echo "2/6  Projet iPhone déjà présent."
fi

echo "3/6  Autorisations caméra et photos…"
"$BUN" run ios:patch

echo "4/6  Icônes et écran de démarrage…"
"$BUN" run ios:assets

echo "5/6  Synchronisation…"
"$BUN" x cap sync ios

echo "6/6  Ouverture de Xcode…"
"$BUN" x cap open ios
echo "Terminé. Dans Xcode, choisis un iPhone et clique sur le triangle ▶."
