# Vidéos TikTok — lancement de Motards de Cœur

Kit pour publier régulièrement sur TikTok jusqu'à l'ouverture de l'application, avec un seul objectif :
**faire remplir la préinscription gratuite** (`/join`).

## Contenu du dossier

| Fichier | Rôle |
| --- | --- |
| `videos.json` | Texte, images, durées, légende et hashtags de chaque vidéo générée |
| `render.mjs` | Fabrique les vidéos MP4 verticales (1080×1920, 30 i/s) dans `out/` |
| `logo.mjs` | Rend transparent le blanc du logo → `assets/logo-transparent.png` |
| `template.html` | Mise en page animée (couleurs, polices et logo du site) |
| `idees-videos.md` | Calendrier et scripts de vidéos à filmer soi-même |

Le logo figure sur **toutes** les vidéos : en haut à gauche pendant la vidéo, puis en grand sur
l'écran final. Le texte reste hors des zones masquées par l'interface TikTok (onglets en haut, boutons à
droite, légende en bas).

## Générer les vidéos

Prérequis : Node 20+, [Playwright](https://playwright.dev) (`npm i -g playwright && npx playwright install chromium`),
[ffmpeg](https://ffmpeg.org) et, pour la voix off, [Piper](https://github.com/OHF-Voice/piper1-gpl)
(`pip install piper-tts`) avec la voix française « siwis » (licence CC BY 4.0) :

```bash
mkdir -p marketing/tiktok/assets/voix
curl -L https://github.com/rhasspy/piper/releases/download/v0.0.2/voice-fr-siwis-medium.tar.gz \
  | tar xz -C marketing/tiktok/assets/voix
```

Sans la voix, les vidéos sont rendues avec une piste silencieuse.

```bash
node marketing/tiktok/logo.mjs               # une fois, ou après changement de logo
node marketing/tiktok/render.mjs --preview   # aperçu PNG de chaque scène
node marketing/tiktok/render.mjs             # toutes les vidéos → marketing/tiktok/out/
node marketing/tiktok/render.mjs 03          # seulement la vidéo 03
```

Si ffmpeg ou piper ne sont pas dans le PATH : variables `FFMPEG`, `PIPER` et `PIPER_VOICE`.
Les MP4 et le modèle de voix (70 Mo) ne sont pas versionnés.

### Voix off

Chaque scène a un champ `voice` : la phrase lue par la voix de synthèse. La scène s'allonge
automatiquement si la phrase est plus longue que sa durée. Écrire les nombres en toutes lettres
(« cent pour cent »), l'adresse comme elle se prononce, et « email » en « i-mèle ». Limite connue : cette voix prononce
imparfaitement les sons nasals (« an », « on », « in »). Pour un rendu plus naturel, utiliser l'option
« Texte en voix » de TikTok ou enregistrer sa propre voix.

Crédit de la voix : modèle Piper « fr_FR siwis » entraîné sur la SIWIS French Speech Synthesis
Database (University of Edinburgh), licence CC BY 4.0.

### Changer le logo (version haute définition)

Le logo utilisé est `assets/logo-source.png` (original 1080 × 1080). Sans ce fichier, `logo.mjs` se rabat sur le logo du site (160 px, plus flou).
Pour changer de logo, remplacer ce fichier (PNG ou JPG, idéalement 1000 px ou plus) :
`marketing/tiktok/assets/logo-source.png`, puis relancer `logo.mjs` et `render.mjs`. Toute la partie
blanche devient transparente automatiquement ; un léger halo clair garde le texte gris lisible sur
les fonds sombres.

### Créer une nouvelle vidéo

Copier un bloc de `videos.json`, changer l'`id` et les scènes :

- `bg` : image de `src/assets/` (fond animé) ;
- `kicker` : petite étiquette dorée ; `title` : texte principal (`*mot*` = italique doré) ;
- `text` : sous-titre facultatif ; `voice` : texte de la voix off ; `duration` : secondes ; `titleSize` : taille du titre (112 par défaut) ;
- dernière scène `"cta": true` avec `perks` (avantages) et `button`.

N'utiliser que des images de décor, de groupes ou de motos : ne pas présenter les photos de profil
d'exemple comme de vrais membres. Ne pas annoncer de chiffres (inscrits, date d'ouverture)
qui n'aient pas été vérifiés.

## Publier sur TikTok

1. Importer le MP4. Pour ajouter une musique, baisser son volume sous la voix
   (« Sons » → « Volume »). Compte professionnel : bibliothèque de musique commerciale uniquement.
2. Coller la légende et les hashtags de `videos.json`.
3. Mettre le lien de préinscription dans la bio :
   `https://motardsdecoeur.com/join` (vérifier que ce lien ouvre bien la page de préinscription).
4. Épingler la vidéo 01 en haut du profil.
5. Répondre aux commentaires dans l'heure, idéalement en vidéo (« Réponse à @… »).

Rythme conseillé : **3 à 5 vidéos par semaine**, en alternant vidéos générées et vidéos filmées
(voir `idees-videos.md`). Heures qui fonctionnent souvent : 12 h–13 h et 18 h–21 h, dimanche matin
pour le public motard. Regarder les statistiques TikTok après deux semaines et doubler ce qui marche.
