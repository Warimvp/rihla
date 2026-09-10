# Rihla (رحلة) — les langues du monde, gratuites pour toujours

App d'apprentissage des langues 100 % gratuite, thème « carnet de voyage » : 14 destinations sur la route d'Ibn Battuta (Grenade → Tokyo, dont Le Caire pour l'arabe), leçons = étapes, réussites = tampons dans un passeport. Cible Maroc : interface FR/AR + RTL.

## Stack
- Vite + React 18, **JS/JSX (pas de TS)**, CSS vanilla (`src/styles.css` — les variables CSS = jetons du thème).
- Aucune lib UI, aucun backend : contenu dans `src/data/langues.js`, progrès en localStorage (`src/lib/progression.js`).
- Logique pure testée avec vitest : `pnpm test` (quiz déterministe via rng injecté, série de jours, visas/km).
- PWA : `public/manifest.webmanifest` + `public/sw.js`, enregistré en prod seulement. **Réseau d'abord sur les navigations** (repli cache après 4 s ; l'app en cache passe devant toute réponse en erreur ; une page redirigée — portail captif — est servie mais jamais mise en cache), cache-first sur le reste (assets hachés). `BUILD` et `PRECACHE` sont injectés dans `dist/sw.js` par le plugin `rihla-sw` de `vite.config.js` (hash du contenu livré — rien à bumper à la main) : **les marqueurs `const BUILD = '…'` et `const PRECACHE = […]` doivent rester tels quels dans `public/sw.js`**, le build échoue sinon. Pas de rechargement forcé à l'activation (il tomberait en pleine leçon) : la nouvelle version arrive au lancement suivant. `src/lib/sw.test.js` évalue le SW dans un faux monde.

## Thème (source de vérité visuelle)
- Canvas Claude Design : https://claude.ai/code/artifact/9646c563-567e-49f4-8bd9-cfcd80494524
- Sources des planches : `design/*.dc.html` + `design/canvas.json` (le fichier assemblé `design/theme-rihla.html` est ignoré par git, régénérable).
- **Jetons identiques** entre le canvas (planche « Couleurs & typographie ») et `src/styles.css` — ne pas les faire diverger.
- **Mode nuit « Nuit d'encre »** (Clair/Auto/Nuit dans Réglages, `rihla.theme`) : les écrasements de jetons existent EN DOUBLE dans `styles.css` — bloc `[data-theme='sombre']` (choix explicite) + bloc `@media (prefers-color-scheme: dark)` gardé par `:not([data-theme='clair'])` (auto natif, sans JS). **Toujours éditer les deux à l'identique.** Sémantique : les `-fonce` sont des couleurs de TEXTE (elles s'éclaircissent la nuit), les `-pale` des FONDS teintés (ils s'assombrissent). Texte sur fond Majorelle : `--sur-majorelle`, jamais `--majorelle-pale`. Deux balises `theme-color` à media queries dans index.html.
- Pas de drapeaux pour les langues (typo-médaillons ES/TR/…), pas d'emoji en guise d'icône (SVG inline dans `src/components/Icones.jsx`).
- **Vignettes de destination** (`src/components/Vignettes.jsx`) : un monument par VILLE, jamais par pays — trois règles : d'avant le 20e siècle, **aucun emblème ni couleur nationale** (tout en `currentColor`, le test refuse le moindre hex), aucun décalque. Saraï (rasée en 1395) = une yourte sur la steppe. Elles font le centre du tampon de visa (`TamponVisa`, encre × forme à cadences différentes : 14 tampons distincts, testé) et illustrent le carnet de route de la vue Apprendre.

## I18n
- FR/AR dans `src/i18n.js` (même approche que khedma/Dari) : dictionnaires, direction dérivée, `lang`/`dir` posés sur `<html>` par un effet dans `App.jsx`.
- Polices : Young Serif (titres FR), Amiri (titres AR — bascule via `--police-titre` sous `[dir='rtl']`), Readex Pro (UI, couvre latin **et** arabe).
- **Langue des définitions** (`rihla.source` : auto/fr/ar, Réglages) : découplée de la langue d'interface. Tout affichage de SENS d'apprentissage passe par `sensPour(mot, source, langueId)` (i18n.js) — jamais `sens(mot, locale)` directement : il gère la bascule automatique quand la destination EST la langue des définitions (arabe → arabe ⇒ sens en français).
- CSS logique partout (`margin-inline-*`, `inset-inline-*`) ; icônes directionnelles retournées par `.icone-directionnelle`.
- **Tout mot dans la langue CIBLE** s'affiche via `<MotCible>` / `<Romanisation>` (`src/components/MotCible.jsx`) : `dir="auto"` + `lang` (BCP-47 de `langue.tts`). Jamais `mot.t` nu — sinon « ¿Cómo estás? » s'affiche à l'envers sous interface arabe (600 mots et 260 romanisations sont bordés de ponctuation neutre). Les SENS (`sensPour`) n'y passent pas. Ne jamais poser une marge sur l'élément `dir="ltr"` lui-même : une propriété logique s'y résout contre SA direction — `Romanisation` enrobe le style pour ça.

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
  - **L'Oreille** : compréhension orale pure (aucun texte à lire, TTS obligatoire — carte désactivée si `peutParler(langue.tts)` est faux : il faut une voix pour LA langue (`voixPour`, `src/lib/tts.js`), pas seulement l'API ; sans voix swahili l'app se tait plutôt que de le prononcer à la française, et la leçon perd aussi son exercice « écouter ») ; 10 manches, **bouton Continuer** entre chaque (jamais d'enchaînement automatique : rien n'est chronométré, et 950 ms ne laissaient pas lire la correction), 8 XP par bonne.
  - **Le Duel** : 2 joueurs sur le même téléphone, moitié haute pivotée à 180° (`.duel-moitie--haut`), premier sur la bonne réponse marque, une erreur verrouille la manche ; 8 manches, 30 XP forfaitaires.
- **L'étape du jour** (`Defi.jsx` + `src/lib/defi.js`, carte safran sur l'Accueil) : 10 questions dans les 14 langues, tirage déterministe par date (graine = AAAAMMJJ, même défi pour tous). Première réussite du jour : score×4 XP (+10 si parfait) **et la série avance** (quel que soit le score — c'est un rituel, pas un examen ; idempotent si une étape a déjà compté le jour). Rejouer le même jour : 0 XP, meilleur score conservé (`enregistrerDefi`).
- Animations : `.anim-pop` / `.anim-secouer` (réponses), flip 3D `.tuile`, `EclatEtoiles` (pluie de khatams), tampon `tamponner` — toutes coupées par `prefers-reduced-motion`.

## Visuels de concepts (`src/lib/visuels.jsx`)
- Indexés par **id de concept** (partagé par les 14 langues) : zéro octet dans `langues.js`, aucun champ ajouté aux mots. `visuels.test.jsx` vérifie que chaque id existe — renommer un concept casse ici.
- Deux familles : **engendrés** par le code (couleurs = aplat de la couleur fixe, nombres = khatams, jours = colonne de la semaine, grand/petit = disques ; 21 concepts, tous au niveau 1) — sans ambiguïté, donc `visuelDeQuiz` et admis comme question « voir » ; **dessinés** (pictos ville / corps / maison, 23) — aide au verso de la carte-mot et sur la face « sens » du Zellige, **jamais une question notée** (un dessin peut se lire de deux façons).
- Tout est en `currentColor` sur la grille 48 d'`Icones.jsx` : le contexte pose l'encre (`.visuel-quiz` = Majorelle, verso = `--sur-majorelle`), le mode nuit suit. Seules les couleurs de la leçon « couleurs » sont des hex fixes. La bande de la semaine est retournée en RTL (`.visuel-semaine`).
- Toujours du **SVG inline en composant** : un fichier `.svg`, un sprite `<use>` ou une police d'icônes ne reçoivent ni les variables CSS ni `currentColor` (le thème y meurt), et `sw.js` ne les pré-cache pas.
- Ajouter un visuel = une entrée dans `VISUELS` (`{ quiz, dessin }`), rien d'autre. Pas de drapeaux, pas d'emblème national.

## Le Carnet — révision espacée (`src/lib/carnet.js`, `src/components/Carnet.jsx`)
- Leitner à 6 rangs, intervalles `[1, 3, 7, 16, 35, 90]` jours (16 jours plafonnait : une destination terminée renvoyait 12 mots/jour, toute la session). Une étape **validée** verse ses 8 mots (`ajouterAuCarnet`, appelé dans App) : rang 2 pour un mot **réussi pendant la leçon** (`reussis` remonté par `Lecon.surTerminer`), rang 1 sinon. Bonne réponse : +1 rang (plafond 6) ; erreur : retour au rang 1 — la date repart du jour.
- Session : `composerSession` réserve la moitié des places aux mots fragiles (rang ≤ 2, les plus RÉCENTS d'abord — un mot raté hier ne passe pas derrière l'arriéré), le reste aux dus les plus anciens ; toutes langues mêlées, plafonnée à 12 ; distracteurs pris dans la langue du mot ; 3 XP par bonne réponse (les révisions ne doivent pas rapporter plus que les leçons).
- Carte « Le Carnet » sur l'Accueil : active si mots dus, sinon « À jour — reviens dans X j » (ou invite à valider une étape si vide).
- Stockage : `progres.carnet` = `{ "langueId:motId": { boite, jour } }` — clés stables, ne pas renommer les ids de mots.

## Cap du voyage (choix de la langue d'apprentissage)
- `rihla.cap` (localStorage) : `'route'` (suivre la route d'Ibn Battuta, comportement historique) ou un id de langue. `null` = jamais choisi → l'écran `Cap.jsx` s'affiche une fois (non annulable) ; ensuite modifiable via Réglages → « Changer » (annulable). `prochaineEtape(progres, langues, cap)` fait passer la langue choisie devant tant qu'elle n'a pas son visa, puis retombe sur la logique route. Choisir une langue aligne aussi `rihla.destination` (onglet Apprendre).

## Aide à l'utilisation (2026-09-06)
- **Guide du voyageur** (`Guide.jsx`, ouvert des Réglages) : 9 sections FR/AR qui expliquent visas, exercices, XP/objectif, série+caravansérail, Carnet, étape du jour, jeux, cap, hors-ligne. À MAJ quand une mécanique change.
- **Sauvegarde** (`src/lib/sauvegarde.js`) : export/import du progrès en texte via le presse-papiers (l'app est 100 % locale — vider le navigateur efface tout). `importerProgres` est tolérant aux champs absents, strict sur la marque/version/cohérence ; il ne remplace jamais un voyage par du bruit. Toujours passer par `surRestaurer` (App) qui écrit ET sauve.
- **Semaine d'activité** au Passeport : 7 barres depuis `progres.xpJours` (menthe = objectif atteint, safran sinon).
- **Partager** (Web Share API, repli presse-papiers) et **Proposer une amélioration** (issues GitHub) dans les Réglages.

## Contenu : 14 destinations × 24 leçons (2 688 mots)
- Route ordonnée par km : es 400 · **pt 700** · it 2100 · **de 2600** · en 2900 · tr 3200 · ar 3600 · **ru 5200** · fa 5400 · sw 6600 · hi 7900 · zh 11300 · **ko 12500** · ja 13400.
- 24 leçons par destination sur **5 niveaux** : N1 « Survie » (salutations, enroute, atable, nombres, marche, jours, couleurs, famille), N2 « Conversation » (rencontre, debrouille, exprimer, meteo, heure), N3 « Récits » (hotel, sante, telephone, transport), N4 « Le quotidien » (ville, maison, corps, travail), N5 « Nuances » (souvenirs, projets, opinions). `LECONS_META[].niveau` groupe l'affichage ; le libellé se lit `t[\`niveau${niveau}\`]` dans `Apprendre.jsx` — un niveau de plus = une clé `niveauN` FR **et** AR dans `i18n.js`. Le visa exige les 24 — et une fois décroché il est **figé** dans `progres.visas` (`figerAvancement`, appelé par `App.terminer` ; `figerAvancements` au chargement migre les voyages antérieurs, datés de leur dernière étape) : ajouter des leçons ne révoque aucun tampon et n'ampute pas les km (`progres.parcours` garde la meilleure fraction atteinte). Le passage de 12 à 24 leçons avait tout révoqué en silence — plus jamais.
- Les mots sont **uniques dans une langue** (id ET texte cible) et les sens FR/AR uniques entre leçons : deux tuiles jumelles au Zellige ou deux bonnes réponses au quiz seraient un bug. `langues.test.js` le vérifie.
- Ajouter une leçon = 8 concepts communs (fr+ar) + 8 entrées × 14 langues, romanisation obligatoire pour fa/hi/zh/ja/ar/**ru**/**ko** — le garde-fou `langues.test.js` veille.
- ⚠️ Insertion d'une langue dans `BRUTES` : ancrer sur la fin COMPLÈTE d'un bloc (dernier mot + `],` + `},` mots + `},` langue). S'arrêter au `},` de `mots` insère la langue DANS l'objet précédent (erreur de syntaxe silencieuse jusqu'au parse).

## Publicité (socle éteint) — `src/lib/pub.js`
- **Décision produit** : pas de paywall ; revenus par pub RÉCOMPENSÉE d'abord (opt-in, échangée contre une nuit de caravansérail via `offrirGel`), interstitielle plafonnée en appoint, **jamais de bannière**, **jamais de pub pendant une leçon / un jeu / une révision / l'étape du jour**.
- Aucun SDK n'est installé : `brancherFournisseur()` reste vide → `pubsDisponibles()` est faux → le bouton du Passeport n'existe pas et l'app est identique à aujourd'hui. Brancher AdMob = installer `@capacitor-community/admob` + appeler `brancherFournisseur()` dans `main.jsx`.
- Quota des interstitielles (pur, testé) : ≥ 3 étapes ET ≥ 5 minutes (`peutMontrerInterstitiel`).
- ⚠️ Le jour de l'activation : réécrire les 3 textes qui promettent « sans pub » (README, `t.gratuit`, guide FR+AR), ajouter consentement UMP + ATT, mettre à jour la page de confidentialité et les étiquettes App Store. Stratégie complète : artifact « Monétiser Rihla ».

## Rappel quotidien (`src/lib/rappel.js`)
- Notification locale via `@capacitor/local-notifications`, id fixe `1325`, planification `{ on: { hour, minute } }` (quotidienne). **Natif seulement** : sur le web les boutons sont désactivés avec un message honnête (une notification programmée ne survit pas à la fermeture de l'onglet). Réglages : Activé/Coupé + heure. Clés `rihla.rappel` / `rihla.rappel.heure`.

## Mécaniques « niveau Duolingo » (2026-09-06)
- **Exercices variés en leçon** (`construireQuiz`, cycle `CYCLE_EXERCICES`) : comprendre → écouter → produire → épeler, et **un tour sur deux** deux substitutions — **lire** (écriture seule → romanisation, si le mot en a une) à la place de comprendre, **voir** (image du concept → mot cible, sans français ni arabe) à la place de produire. Replis AUTOMATIQUES : sans voix pour la langue (`peutParler(langue.tts)`), écouter → comprendre ; cible > 10 caractères (`cibleEpellation`), épeler → produire ; sans romanisation, lire → comprendre ; sans image, voir → produire. L'image est **injectée** par `capacites.aVisuel` (Lecon passe `visuelDeQuiz`), jamais importée par `quiz.js` — sinon le test ne pourrait plus échouer. L'épellation partagée vit dans `src/lib/epellation.js` (Caravane + leçons).
- **Objectif du jour** (10/20/30 XP, Réglages) : chaque gain d'XP passe par `App.majProgres` → `attribuerXpDuJour` (14 jours conservés dans `progres.xpJours`). Barre sur l'Accueil. Les débits (achat de nuit) ne s'attribuent pas.
- **Caravansérail** (gel de série) : 150 XP la nuit, stock max 2 (Passeport). `majSerieAvecGels` couvre EXACTEMENT un jour manqué (l'avant-veille) ; 2+ jours manqués → série perdue, nuits conservées. `gelConsomme` remonte jusqu'aux écrans de fin (chip menthe).
- **Sons + haptique** (`src/lib/sons.js`) : WebAudio synthétisé (aucun asset), `retourReponse(bonne)` sur CHAQUE réponse (leçons, défi, carnet, 5 jeux), `fanfare()` sur les fins victorieuses ; coupable dans Réglages (`rihla.sons`). Toujours déclenché par un geste (règles d'autoplay).
- Pas de vies/cœurs à la Duolingo : c'est un dark pattern de monétisation, contraire au « gratuit pour toujours ».
- **Fin de leçon** : « Étape suivante · <titre> » (primaire) quand `prochaineEtape(progres, [langue], 'route')` en propose une autre que celle qu'on vient de jouer, sinon « Rejouer » ; jamais lancée toute seule. `<Lecon key={langue:lecon}>` force le remontage.
- **Accessibilité des exercices** : après la révélation, les options passent en `aria-disabled` + garde dans le handler — jamais `disabled`, qui éjecte le focus. Le bandeau de correction est un `role="status"` **toujours monté** (classe `.lecteur-seul` quand il est vide) ; l'invite de question reçoit le focus à chaque avancée ; la carte-mot est `role="button"` retournable au clavier ; le bouton « Voir la réponse / Suivant » est un seul nœud.
- **Tests de rendu** (`src/components/Ecrans.rendu.test.jsx`, `// @vitest-environment jsdom`) : de vrais écrans montés avec `createRoot` + `act` — une leçon jouée jusqu'au bilan, l'Accueil avec un visa figé, l'app en arabe (RTL + `dir="auto"` sur les mots cibles).

## Principes produit (non négociables)
- **100 % gratuit pour toujours** : pas de pub, pas de compte, pas de paywall, tout fonctionne hors-ligne.
- Pas de faux verrous : toutes les destinations sont ouvertes dès le départ.
- Audio = synthèse vocale du système (`src/lib/tts.js`) — jamais d'API payante.
- Contenu : les sens FR/AR sont partagés (`CONCEPTS`) et joints par index aux mots de chaque langue — garder cet alignement en ajoutant du vocabulaire.
