# reels — les pubs verticales de MaRihla (Remotion)

Deux pubs 1080×1920, 30 fps, refaites **en darija marocaine** à partir des vidéos d'origine
(« Pub 1 · Voyage 1325 », 30 s, et « Pub 4 · Apprends partout », 15 s — elles aussi faites avec Remotion 4.0.535).

- **Mêmes coupes, même musique.** La piste audio des vidéos d'origine est reprise telle quelle : les scènes tombent
  aux mêmes instants (carte sombre à 8 s, téléphone à 12 s, carte finale à 23,03 s ; 2,33 s / 4 s / 10,03 s pour la pub 4).
- **Les textes sont dans `src/textes/darija.js`** — un seul fichier à relire ou à corriger (écriture arabe, mots en safran
  marqués `{ t, accent: true }`). Les noms de villes, le badge App Store, la mention des photos y sont aussi.
- **Les téléphones montrent la vraie app**, en interface arabe (RTL), capturée au simulateur : l'app n'a pas de mode
  darija, ses écrans restent donc en arabe standard — seul le texte de la pub est en darija.
- Tout le reste est dessiné en code : Tanger 1325 (SVG), les cartes (`d3-geo` + `world-atlas`), le hublot, la carte finale.

## Refaire les vidéos

```sh
cd reels && pnpm install

# 1. La musique : extraite des vidéos d'origine (hors git — voir .gitignore)
mkdir -p public/audio
ffmpeg -i MaRihla-Pub1-Voyage-1325.mp4          -vn -c:a copy public/audio/pub1.m4a
ffmpeg -i MaRihla-Pub4-Apprends-Partout.mp4     -vn -c:a copy public/audio/pub4.m4a

# 2. Les écrans de l'app (hors git) : lancer l'app (`pnpm dev` à la racine, port 5183), puis
node scripts/capturer-ecrans.mjs            # → public/ecrans/*.jpg|png + manifeste.json

# 3. Le rendu
pnpm exec remotion studio                   # aperçu
pnpm render:darija:pub1                     # → out/MaRihla-Pub1-Voyage-1325-darija.mp4
pnpm render:darija:pub4                     # → out/MaRihla-Pub4-Apprends-Partout-darija.mp4
```

Dans un conteneur sans navigateur de Remotion : `RIHLA_CHROMIUM=/chemin/vers/headless_shell pnpm render:…`
(`scripts/app.mjs` accepte la même variable pour les captures).

## Voix off (optionnelle)

La vidéo sort **musique seule** par défaut. Pour y poser une voix en darija :

- **Le texte à dire et ses fenêtres de temps** sont dans `src/textes/voix.json` : une réplique par ligne (`debut` = quand la
  voix démarre, `limite` = avant quand elle doit avoir fini). Ce n'est pas toujours le texte de l'écran : l'année et « 15 »
  sont épelés, « MaRihla » se dit « مارحلة ». C'est aussi la feuille de travail d'un comédien de voix.
- **Les fichiers audio** se posent dans `public/voix/<voix>/<pub>-<id>.mp3` (hors git) ; `<voix>` est un nom libre, c'est le
  dossier. On les obtient de deux façons :
  - **Synthèse** : `scripts/voix.py` génère `jamal` et `mouna` (les voix neuronales marocaines de Microsoft,
    `ar-MA-JamalNeural` et `ar-MA-MounaNeural`) :
    ```sh
    python3 -m venv .venv-voix && .venv-voix/bin/pip install edge-tts
    .venv-voix/bin/python scripts/voix.py            # ou --voix jamal
    ```
    Chaque réplique est mesurée : si elle dépasse sa fenêtre, elle est refaite en accélérant juste ce qu'il faut (le script
    prévient au-delà de +30 %, il faut alors raccourcir le texte) ; les silences de tête et de queue sont coupés et le
    niveau est ramené à −16 LUFS. Attention à la ponctuation : un point fait une longue pause (« بلاش. بلا اشتراك. » dure 6 s,
    avec des virgules 4 s) — c'est elle qui règle le rythme. Le paquet `edge-tts` passe par le service « lecture à voix haute »
    d'Edge, sans clé : **usage non officiel**. Pour une campagne payante, mêmes voix via Azure Speech avec une clé.
  - **Voix humaine** (ou un autre outil) : un fichier par ligne de `voix.json`, mêmes noms.
- **Le rendu** : `pnpm exec remotion render Pub1-Darija out/pub1-voix.mp4 --props='{"voix":"jamal"}'` (idem `Pub4-Darija`).
  La musique descend à 30 % pendant chaque réplique (`src/voix.js`) ; les durées sont mesurées au rendu, et une réplique qui
  déborde sa `limite` est signalée dans la console.
- **À écouter avant de diffuser.** Une voix de synthèse lit du darija écrit en arabe : l'accent est marocain, mais la
  prononciation de chaque mot n'est pas garantie.

## Ce qu'il faut savoir

- **Les polices sont celles de l'app** (`../public/polices/`, importées telles quelles) : Amiri pour les titres arabes,
  Readex Pro pour l'interface, Young Serif pour la marque « MaRihla ». `src/polices.js` attend leur chargement avant
  chaque image, sinon un sous-ensemble tardif partirait en police de repli.
- **Les captures sont rejouables.** `scripts/graines.mjs` retrouve la graine qui donne, dans l'app, les mêmes questions
  que la vidéo d'origine (« My name is… », « Merci », « Please » ; « L'addition », « Le café »). `React.StrictMode` appelle
  deux fois le moteur de quiz : c'est le *second* tirage qu'on voit, et la recherche en tient compte.
- **Quatre créneaux, un moteur de calques** (`src/composants/EcransApp.jsx`) : `Etats` (captures qui se succèdent),
  `EcranCartes` (le retournement 3D rejoué sur de vraies captures, décor sans carte + carte seule), `EcranQuiz`
  (états avant / pendant / après et touchers, lus dans `manifeste.json`).
- Rien n'est tiré au hasard dans le rendu (`bruit()` est déterministe) : deux rendus donnent les mêmes images.
