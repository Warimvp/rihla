# Rihla (رحلة) — les langues du monde, gratuites pour toujours

App d'apprentissage des langues 100 % gratuite, thème « carnet de voyage » : 10 destinations sur la route d'Ibn Battuta (Grenade → Tokyo, dont Le Caire pour l'arabe), leçons = étapes, réussites = tampons dans un passeport. Cible Maroc : interface FR/AR + RTL.

## Stack
- Vite + React 18, **JS/JSX (pas de TS)**, CSS vanilla (`src/styles.css` — les variables CSS = jetons du thème).
- Aucune lib UI, aucun backend : contenu dans `src/data/langues.js`, progrès en localStorage (`src/lib/progression.js`).
- Logique pure testée avec vitest : `pnpm test` (quiz déterministe via rng injecté, série de jours, visas/km).
- PWA : `public/manifest.webmanifest` + `public/sw.js` (cache-first même origine, enregistré en prod seulement).

## Thème (source de vérité visuelle)
- Canvas Claude Design : https://claude.ai/code/artifact/9646c563-567e-49f4-8bd9-cfcd80494524
- Sources des planches : `design/*.dc.html` + `design/canvas.json` (le fichier assemblé `design/theme-rihla.html` est ignoré par git, régénérable).
- **Jetons identiques** entre le canvas (planche « Couleurs & typographie ») et `src/styles.css` — ne pas les faire diverger.
- **Mode nuit « Nuit d'encre »** (Clair/Auto/Nuit dans Réglages, `rihla.theme`) : les écrasements de jetons existent EN DOUBLE dans `styles.css` — bloc `[data-theme='sombre']` (choix explicite) + bloc `@media (prefers-color-scheme: dark)` gardé par `:not([data-theme='clair'])` (auto natif, sans JS). **Toujours éditer les deux à l'identique.** Sémantique : les `-fonce` sont des couleurs de TEXTE (elles s'éclaircissent la nuit), les `-pale` des FONDS teintés (ils s'assombrissent). Texte sur fond Majorelle : `--sur-majorelle`, jamais `--majorelle-pale`. Deux balises `theme-color` à media queries dans index.html.
- Pas de drapeaux pour les langues (typo-médaillons ES/TR/…), pas d'emoji en guise d'icône (SVG inline dans `src/components/Icones.jsx`).

## I18n
- FR/AR dans `src/i18n.js` (même approche que khedma/Dari) : dictionnaires, direction dérivée, `lang`/`dir` posés sur `<html>` par un effet dans `App.jsx`.
- Polices : Young Serif (titres FR), Amiri (titres AR — bascule via `--police-titre` sous `[dir='rtl']`), Readex Pro (UI, couvre latin **et** arabe).
- **Langue des définitions** (`rihla.source` : auto/fr/ar, Réglages) : découplée de la langue d'interface. Tout affichage de SENS d'apprentissage passe par `sensPour(mot, source, langueId)` (i18n.js) — jamais `sens(mot, locale)` directement : il gère la bascule automatique quand la destination EST la langue des définitions (arabe → arabe ⇒ sens en français).
- CSS logique partout (`margin-inline-*`, `inset-inline-*`) ; icônes directionnelles retournées par `.icone-directionnelle`.

## Lancer
- Serveur : `rihla-dev` (port 5183, strictPort) dans `~/.claude/launch.json`. Ne jamais lancer via Bash.

## iOS (Capacitor 8)
- `appId` : `ma.rihla.app`, projet `ios/App/App.xcodeproj` (SPM, pas de CocoaPods).
- Scheme partagé `App` copié depuis khedma (le template Capacitor 8 n'en génère pas — sans lui `xcodebuild -scheme App` ne trouve rien).
- Workflow : `pnpm ios:sync` (build web + copie), puis Xcode. ⚠️ Mac Intel : premier rendu WKWebView 2–4 min (écran blanc) — attendre.
- Safe-areas : `viewport-fit=cover` + `env(safe-area-inset-*)` ; ne pas ajouter `contentInset` dans capacitor.config.
- Déploiement sans organisation Apple : README § « Déploiement ».

## Jeux du voyage (`src/components/Jeu*.jsx`, section dans la vue Apprendre)
- Cinq jeux de révision par destination, XP via `ajouterXp` (jamais les visas — eux restent liés aux étapes) :
  - **Zellige des paires** : memory 6 paires mot ↔ sens, bonus si peu de coups (30–50 XP).
  - **Le Souk** : 45 s chrono, 3 étals, combos (10 + 2×combo par bonne, plafond 100 XP/partie).
  - **La Caravane** : épeler 8 mots avec des tuiles-lettres (romanisation si écriture non latine, mots ≤ 10 caractères) ; 10 XP sans faute, 5 sinon. Rangées de lettres en `dir="ltr"` forcé même en AR.
  - **L'Oreille** : compréhension orale pure (aucun texte à lire, TTS obligatoire — carte désactivée si `peutParler()` est faux) ; 10 manches auto-avancées, 8 XP par bonne.
  - **Le Duel** : 2 joueurs sur le même téléphone, moitié haute pivotée à 180° (`.duel-moitie--haut`), premier sur la bonne réponse marque, une erreur verrouille la manche ; 8 manches, 30 XP forfaitaires.
- **L'étape du jour** (`Defi.jsx` + `src/lib/defi.js`, carte safran sur l'Accueil) : 10 questions dans les 9 langues, tirage déterministe par date (graine = AAAAMMJJ, même défi pour tous). Première réussite du jour : score×4 XP (+10 si parfait) **et la série avance** (quel que soit le score — c'est un rituel, pas un examen ; idempotent si une étape a déjà compté le jour). Rejouer le même jour : 0 XP, meilleur score conservé (`enregistrerDefi`).
- Animations : `.anim-pop` / `.anim-secouer` (réponses), flip 3D `.tuile`, `EclatEtoiles` (pluie de khatams), tampon `tamponner` — toutes coupées par `prefers-reduced-motion`.

## Le Carnet — révision espacée (`src/lib/carnet.js`, `src/components/Carnet.jsx`)
- Leitner à 5 rangs, intervalles `[1, 2, 4, 8, 16]` jours. Une étape **validée** verse ses 8 mots au rang 1 (`ajouterAuCarnet`, appelé dans App). Bonne réponse : +1 rang (plafond 5) ; erreur : retour au rang 1 — la date repart du jour.
- Session : les mots dus (les plus anciens d'abord), toutes langues mêlées, plafonnée à 12 ; distracteurs pris dans la langue du mot ; 3 XP par bonne réponse (les révisions ne doivent pas rapporter plus que les leçons).
- Carte « Le Carnet » sur l'Accueil : active si mots dus, sinon « À jour — reviens dans X j » (ou invite à valider une étape si vide).
- Stockage : `progres.carnet` = `{ "langueId:motId": { boite, jour } }` — clés stables, ne pas renommer les ids de mots.

## Principes produit (non négociables)
- **100 % gratuit pour toujours** : pas de pub, pas de compte, pas de paywall, tout fonctionne hors-ligne.
- Pas de faux verrous : toutes les destinations sont ouvertes dès le départ.
- Audio = synthèse vocale du système (`src/lib/tts.js`) — jamais d'API payante.
- Contenu : les sens FR/AR sont partagés (`CONCEPTS`) et joints par index aux mots de chaque langue — garder cet alignement en ajoutant du vocabulaire.
