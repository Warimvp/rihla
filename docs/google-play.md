# Publier Rihla sur Google Play

Dossier du 20/10/2026, état revu le 02/11/2026 : **1.1 (2) en cours d'examen chez Google** depuis le 02/11/2026, pour
11 pays ; **l'application n'est PAS publique** (la fiche Google Play répond 404). Compte d'organisation `Legantis
Digital Service` (connecté avec le compte Google de la société), test interne actif. **Publication gérée ACTIVÉE** : une
approbation ne publie rien, les modifications passent en « prêtes à être publiées » et le clic « Publier » revient au
responsable.

**État au 08/11/2026** : **1.1 (2) est EN PRODUCTION** (fiche publique, 11 pays, dernière release la veille, aucune
modification en attente). **1.1 (3) construite le 08/11** (branche `android/1.1-3`, `pnpm android:release` vert,
barrière « livrable » : rien à refuser) : AAB 4 113 719 octets, sha256 `274eae1a…e351c`, signé par la clé d'importation
de la société (SHA-256 `D4:8A:3C:31…38:64:37`), **toujours sans `INTERNET`** donc mêmes déclarations que la 1.1 (2).
Contenu : (1) **le bouton du son reste affiché dans les 15 langues** (éteint et barré quand l'appareil n'a pas la voix
de la langue, le toucher explique ; avant, il disparaissait) ; (2) la fenêtre « Nouveautés » de la 1.1 iOS
(`claude/mise-a-jour`, a4b2e7e — le test du z-index contre `.voile-etat` iOS y est remplacé par « au-dessus de toute
autre couche »). Les testeurs qui ont déjà la 1.1 (2) verront cette fenêtre UNE fois (elle date de la 1.1). **Le jeu en
ligne (La Course, serveur) n'est dans AUCUNE build 1.1, iOS comprise** : seul le Barid (duel par lien, sans serveur)
y est.

**1.2 préparée le 08/11/2026 (branche `android/1.1-3`, NON poussée, rien envoyé à Google)** : **La Course, l'adversaire
au hasard et les classements entrent dans la build Android** (facultatifs, éteints par défaut, écran « Jouer en ligne ? »
avant tout envoi). AAB `versionName 1.2 / versionCode 4`, 4 113 773 octets, sha256 `8bb2b55b…fbd32`, même clé d'importation.
Manifeste fusionné : `INTERNET` + les trois autorisations du rappel, **rien d'autre**. Barrière : `INTERNET` exigée
**et** UNE seule adresse de serveur admise (la bonne, https, présente) — l'une sans l'autre est refusée.
`android:sync` pose `VITE_RIHLA_SERVEUR` lui-même (plus de `.env`). Essayée dans la WebView 133 de l'émulateur (14
contrôles) : aucune requête avant le consentement, salle créée sur le serveur de production (code relu côté serveur),
« Serveur injoignable » proprement sans réseau. **Avant l'envoi, à faire dans la console (§ 5bis) : « Sécurité des
données », fiche (3 langues), classification IARC** — la 1.1 (3) en cours d'examen n'a PAS `INTERNET` : ne rien changer
dans ces déclarations avant son approbation et sa publication.

**Trouvé le 02/11/2026, corrigé en 1.1 (2)** : Google exige un lien vers la politique **dans l'application**, même sans
collecte ; il n'y en avait aucun. Réglages › À propos ouvre désormais `confidentialite/index.html`, la page embarquée
(page embarquée, ouverte sans réseau ; le nom de fichier est explicite car, sans extension, le serveur local de Capacitor rend
l'application). La 1.1 (1) embarquait en plus la version du 19/09 de cette page : construite avant le dernier commit.

| | |
|---|---|
| Identifiant | `ma.rihla.app` — **figé dès le premier envoi**, le même que sur iOS |
| Coquille | Capacitor 8.5 · `minSdk 24` (Android 7) · `targetSdk 36` (exigence de Google depuis le 31/08/2026) |
| Version | **`android/version.properties`** : `versionName` = la version affichée (la même que `MARKETING_VERSION`, iOS), `versionCode` = entier qui ne fait que monter |
| Livrables | `android/app/build/outputs/bundle/release/app-release.aab` (~4,1 Mo — Google Play ne prend que l'AAB) et `…/apk/release/app-release.apk` (essai par `adb install`) |
| Code natif | **aucun** (la WebView du système, rien d'autre) — voir § 4 « 16 Ko » |

---

## 1. Ce qui est fait et vérifié

**Construit** : projet `android/` (généré par `npx cap add android`, puis réglé), icône adaptative + ronde + écran
de lancement tirés de la MÊME source que l'icône iOS (`public/icons/icon.svg`, `pnpm android:icones`), AAB et APK
signés (avec une clé **jetable** pour l'essai — jamais la vôtre, voir § 6), barrière de publication
(`scripts/verifier-android.mjs`), numéros de version unifiés iOS/Android (`pnpm version:app`, `pnpm version:android`).

**Outils** : `scripts/gradle-android.mjs` trouve Java 21 (`JAVA_HOME`, sinon `~/.local/jdk-21*`) et le SDK
(`ANDROID_HOME`, sinon `~/Library/Android/sdk`) ; ni le shell ni `/usr/libexec/java_home` ne les connaissent, et le
`jarsigner` de `/usr/bin` n'est qu'un raccord macOS qui répond « Unable to locate a Java Runtime ». **Toujours**
`pnpm android:debug` / `pnpm android:release`, jamais `./gradlew` à la main.

**Regardé à l'émulateur** (AVD `rihla_pixel`, Pixel 8, API 36, WebView 133 ; toujours `adb -s emulator-5562`) :
démarrage à froid par le lanceur, icône ronde, écran de lancement, rendu bord à bord, accueil / étapes / carte-mot /
quiz / passeport en français ET en arabe (RTL), **bouton Retour** (ferme l'écran ouvert, quitte depuis la racine),
**mode sombre** (au démarrage et en bascule EN DIRECT, icônes de la barre d'état comprises), **rappel quotidien**
(une seule demande, celle des notifications ; alarme **inexacte** vérifiée par `dumpsys alarm` : `RTC_WAKEUP`,
fenêtre d'une heure), application entièrement fonctionnelle SANS autorisation Internet.

**Tests** : `pnpm test` (suite complète verte), dont — propres à Android — `src/lib/verifier-android.test.js`
(la barrière, 27 cas), `src/lib/barres.test.js` (icônes des barres système), `src/lib/fiche-google-play.test.js`
(la fiche ne ment pas), `src/lib/rappel.test.js` (alarme non exacte).

**Pas vérifié — à savoir** :
- aucun **appareil Android réel** (seulement l'émulateur) ;
- la **WebView ≥ 140** : l'AVD a la 133, donc Capacitor pose des marges natives ; sur un téléphone à jour, la WebView
  reçoit les zones sûres en CSS (`env(safe-area-inset-*)`). Les deux chemins sont couverts par le fond de fenêtre
  (§ 4) mais seul le premier a été regardé ;
- la **prononciation** : l'AVD n'a aucune voix de synthèse installée, les icônes haut-parleur n'y apparaissent donc
  pas (comportement voulu : sans voix pour la langue, l'app se tait). Sur un vrai téléphone, l'espagnol et la plupart
  des langues du voyage ont une voix Google ;
- l'installation **depuis Google Play** (Play App Signing) ; Android 7 à 11 ; tablettes et pliables ; TalkBack ;
- le partage du Barid (`navigator.share` dans la WebView : disponible depuis la WebView 89, repli sur le presse-papiers).

---

## 2. La clé d'importation — **vous, une seule fois, et la sauvegarder**

Google Play signe l'application avec SA clé (Play App Signing) ; vous signez chaque envoi avec votre **clé
d'importation**. Perdue, elle se remplace (réinitialisation dans la console) ; volée, quelqu'un peut envoyer des
versions à votre place : jamais dans le dépôt, jamais dans un nuage non chiffré. Je n'ai pas le droit de la créer
ni de la manipuler.

```bash
# Hors du dépôt. keytool demande le mot de passe : il n'apparaît ni à l'écran ni dans l'historique du shell.
# -J-Duser.language=en : keytool parle la langue du système, ce qui rend ses messages illisibles pour un script.
mkdir -p ~/cles/rihla && cd ~/cles/rihla
"$(ls -d ~/.local/jdk-21*/Contents/Home | head -1)/bin/keytool" -J-Duser.language=en -genkeypair -v \
  -keystore rihla-importation.jks -alias rihla-importation \
  -keyalg RSA -keysize 4096 -validity 10000 \
  -dname "CN=LEGANTIS DIGITAL SERVICE, O=LEGANTIS DIGITAL SERVICE, C=MA"
```

Puis le fichier de propriétés, **hors du dépôt lui aussi**, droits 600 :

```bash
cat > ~/cles/rihla/keystore.properties <<'FIN'
storeFile=/Users/<vous>/cles/rihla/rihla-importation.jks
storePassword=<le mot de passe du magasin>
keyAlias=rihla-importation
keyPassword=<le mot de passe de la clé>
FIN
chmod 600 ~/cles/rihla/keystore.properties ~/cles/rihla/rihla-importation.jks
```

La build le lit par la variable `ANDROID_KEYSTORE_PROPERTIES` (recommandé) ou, à défaut, depuis
`android/keystore.properties` (ignoré par git, comme `*.jks` et `*.keystore`). Sauvegarder le `.jks` ET les mots de
passe dans votre gestionnaire de mots de passe. **Sans ce fichier, `bundleRelease` / `assembleRelease` refusent avant
de compiler** (message : « Build de publication refusée »).

---

## 3. Fabriquer et envoyer une build

```bash
cd ~/Projects/rihla          # après fusion de la branche android-play dans main
# Aucun .env n'est nécessaire. Surtout PAS de VITE_RIHLA_SERVEUR : la barrière refuse un bundle qui porte
# l'adresse du serveur de duels est posée PAR `android:sync` (1.2) : la barrière la refuse absente ou différente.
ANDROID_KEYSTORE_PROPERTIES=~/cles/rihla/keystore.properties pnpm android:release
```

La commande enchaîne `vite build`, `cap sync android`, `verifier-android.mjs synchro`, Gradle (`bundleRelease
assembleRelease`) puis `verifier-android.mjs livrable`, et **s'arrête au premier refus** (un refus nomme la règle et
le fichier). Le fichier à envoyer est l'`.aab`.

### Dans la Play Console — **vous** (l'entrée `ma.rihla.app` existe déjà, en brouillon)

1. **Tests → Test interne → Créer une version** : accepter **Play App Signing**, téléverser `app-release.aab` (4,1 Mo :
   sous la limite de 10 Mo de l'outil de téléversement automatique, mais l'envoi reste le vôtre), notes de version, liste
   de testeurs (adresses e-mail, jusqu'à 100), déployer.
2. Tester sur un vrai téléphone Android (le § 1 liste ce que l'émulateur n'a pas montré).
3. **Production → Créer une version** puis **Envoyer pour examen** : après la liste de contrôle du § 8.

### Chaque nouvel envoi

`pnpm version:android` (versionCode + 1) — ou `pnpm version:app 1.2` pour changer la version affichée des DEUX
plateformes (iOS : build + 1 ; Android : versionCode + 1) — puis `pnpm android:release`. Google Play refuse un
`versionCode` déjà envoyé, et l'erreur tombe APRÈS le téléversement.

---

## 4. Choix techniques, et pourquoi

**Autorisations** (manifeste FUSIONNÉ de l'APK, jugé par `verifier-android.mjs` : toute autre est refusée) :

| Autorisation | Pourquoi |
|---|---|
| `POST_NOTIFICATIONS` | le rappel quotidien (**opt-in**, demandée seulement à l'activation dans Réglages) |
| `RECEIVE_BOOT_COMPLETED` | reprogrammer le rappel après un redémarrage du téléphone |
| `WAKE_LOCK` | réveiller le téléphone le temps d'afficher le rappel |
| `ma.rihla.app.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION` | posée par androidx.core à toute application ; permission de signature, interne, invisible |
| **`INTERNET` — déclarée (1.2)** | le jeu en ligne facultatif : `fetch` + `WebSocket` vers l'UNIQUE serveur de la barrière (https/wss, jamais en clair : `usesCleartextTraffic` reste refusé), seulement après l'écran « Jouer en ligne ? ». Elle va avec « Sécurité des données » (§ 5bis) et la politique. Sans l'adresse du serveur dans la build, la barrière la refuse (autorisation sans usage) |
| **`SCHEDULE_EXACT_ALARM` — retirée** | le greffon de notifications la pose et enverrait l'utilisateur dans « Alarmes et rappels » ; Google Play la réserve aux applications d'alarme et de calendrier. Le rappel est `isExactNotification: false` (`src/lib/rappel.js`) : à 19 h, pas à la minute près |

Le greffon **ajoute bien** `SCHEDULE_EXACT_ALARM` au manifeste fusionné (constaté en la rétablissant : la barrière
`livrable` la refuse) : le `tools:node="remove"` du manifeste source est indispensable, pas décoratif. `INTERNET`, elle,
est DÉCLARÉE explicitement dans le manifeste source depuis la 1.2 (le modèle ne la pose pas) : la barrière refuse un
manifeste qui la retire (`tools:node="remove"`) ou qui ne la cite qu'en commentaire.

- **`allowBackup="false"` ET `dataExtractionRules`.** Le progrès vit dans le `localStorage` de la WebView : une
  sauvegarde Google Drive ou un transfert vers un autre téléphone l'emporterait, ce qui contredirait « rien ne quitte
  votre téléphone ». La sauvegarde manuelle de Réglages reste le moyen de changer de téléphone.
- **Bouton Retour = historique de la page** (`MainActivity.java`). Capacitor 8 ne s'en charge plus (c'était le rôle de
  `@capacitor/app`) : sans ceci l'activité se ferme à chaque Retour, même au fond d'une étape — constaté à l'émulateur.
  L'application pose déjà une entrée d'historique par écran ouvert (`src/App.jsx`) ; le natif n'a qu'à la reprendre, et
  rend la main au comportement par défaut (quitter) quand il n'y en a plus. **Pas de `@capacitor/app`** : il aurait
  modifié aussi le paquet iOS (SwiftPM figé sur les artefacts Capacitor 8.5).
- **Bord à bord partout** (`EdgeToEdge.enable`, appelé APRÈS `super.onCreate`) : imposé à partir de `targetSdk 35`.
  Capacitor transmet les zones sûres à la page en CSS si la WebView est ≥ 140, sinon pose des marges natives.
- **Barres système et thème.** Le fond de fenêtre a une variante de nuit (`res/values-night/colors.xml`, jeton `--sable`
  sombre) : sans elle, une bande crème restait derrière les barres d'une page sombre (chemin « marges »). Le **style
  des icônes** est dit par l'application elle-même (`src/lib/barres.js`, greffon `SystemBars` du noyau) selon son thème
  EFFECTIF : Capacitor le résout une fois au démarrage d'après le système et ne le réévalue pas, et ignore le choix
  « Clair / Sombre » imposé dans Réglages. Limite assumée : thème imposé ≠ thème du système sur une WebView < 140 laisse
  le fond de fenêtre du système.
- **16 Ko.** Depuis le 01/11/2025, Google Play refuse une mise à jour dont les bibliothèques natives (`.so`) ne sont pas
  alignées sur 16 Ko (`targetSdk ≥ 35`). Rihla n'en embarque **aucune** (`unzip -l app-release.apk | grep '\.so$'` ne
  rend rien ; `zipalign -c -P 16` passe). Pour que ça le reste, la barrière **refuse toute `.so`** : un greffon futur qui
  en apporte une fait échouer `android:release` jusqu'à ce qu'on vérifie son alignement ELF (`zipalign -P 16` ne le prouve
  PAS : il laisse passer une `.so` alignée à 4 Ko) puis qu'on l'autorise dans `verifier-android.mjs`.
- **Pas de R8 ni de minification** : l'application est une WebView, Capacitor et ses greffons s'appuient sur la
  réflexion, et le gain serait négligeable. **Pas de publicité** : aucun SDK, `pubsDisponibles()` est faux ; le jour où
  elle entre, la fiche, « Sécurité des données » et la politique changent en même temps (`CLAUDE.md`, « Publicité »).
- **Jeu en ligne et pourboire : absents de cette build** (adresse du serveur refusée par la barrière ; `estNatif()`
  masque le lien de don).

---

## 5. La fiche et les déclarations (valeurs à saisir)

**Fiche principale** : textes, limites et coordonnées dans `docs/fiche-google-play.md` (fr-FR par défaut, `ar`, `en-US`).
**Visuels** (dossier `captures/google-play/`, ignoré par git — régénérable, ~6 Mo) :

```bash
pnpm android:debug                           # l'APK de débogage : sa WebView accepte DevTools
node scripts/captures-google-play.mjs        # 5 écrans × (fr, ar), voyage de démonstration semé, 1080 × 2400 natif
node scripts/presentation-google-play.mjs    # cadre + légende → 1080 × 2160 ; image de présentation 1024 × 500 (fr, en, ar)
```

Icône : `android/app/src/main/ic_launcher-playstore.png` (512 × 512, PNG 32 bits avec alpha). Captures : PNG 24 bits
SANS alpha, côté long ≤ 2 × côté court (**un Pixel natif 1080 × 2400 est REFUSÉ** : d'où la composition ; ne JAMAIS forcer
`adb shell wm size`, la WebView 133 de l'AVD dessine alors des cartes coupées). Les sets `ar` et `fr` sont à téléverser
dans leur langue ; `en-US` reprend ceux du français.

| Déclaration | Réponse |
|---|---|
| Accès à l'application | toutes les fonctions sont accessibles sans identifiants |
| Annonces | **aucune** ; identifiant publicitaire : **non** |
| Sécurité des données | **1.1 : aucune donnée collectée ni partagée** (pas d'`INTERNET`). **1.2 : voir § 5bis** (pseudonyme, scores, identifiant aléatoire, facultatifs) ; pas de compte → pas d'URL de suppression de compte |
| Politique de confidentialité | `https://warimvp.github.io/rihla/confidentialite/` |
| Classification (IARC) | catégorie « Tous les autres types d'applications » ; contenu à évaluer dans le package : non ; partage de contenu utilisateur : non ; contenu en ligne : non ; produits soumis à l'âge : non ; position, achats, récompenses, navigateur : non ; « produit essentiellement éducatif » : **oui**. Résultat obtenu : Brésil **L**, ESRB **Tout public**, PEGI **3** |
| Public cible | **13 ans et plus** : tranches 13–15, 16–17, 18+ (la console refuse d'ailleurs toute tranche < 13 ans : la classification ESRB n'est pas « Tout public »-enfant). L'application n'est pas destinée aux enfants ; cocher une tranche < 13 ans la ferait entrer dans la politique « Familles ». **PROPOSITION à confirmer** |
| Applications gouvernementales / fonctions financières / santé | non / aucune / aucune (la leçon « Chez le médecin » est du vocabulaire, aucun conseil) |
| Catégorie | **Éducation** ; tags : apprentissage des langues |
| Pays | à choisir (Maroc d'abord ?) ; **gratuite** |

### État de la console au 20/10/2026 (entrée `ma.rihla.app`, affichée « Marihla » avant la fiche)

Tout est **enregistré, rien n'est envoyé** (« Envoyer l'appli pour examen » reste grisé : il faut d'abord une version) :
annonces, identifiant publicitaire, applis gouvernementales, fonctionnalités financières, santé, **sécurité des données**
(aucune collecte), **classification IARC**, **cible 13+**, catégorie **Enseignement**, coordonnées
(`contact@legantis.net`, `+212 6 72 75 90 97`, `https://warimvp.github.io/rihla/`), **fiche fr-FR / en-US / ar** (textes,
icône, image de présentation par langue, 5 captures en français et en arabe ; `en-US` hérite des captures françaises),
déclaration d'éléments IA : « Ne pas signaler ».

⚠ **Correction faite en passant** : la console portait comme « règles de confidentialité » `https://github.com/Warimvp/rihla`
(le dépôt, pas une politique — Google l'aurait refusée à l'examen). Remplacée par `https://warimvp.github.io/rihla/confidentialite/`.

Restent : la clé d'importation, l'AAB et la **première version** (Test interne), les pays de distribution, la relecture des
textes arabes et anglais, puis l'envoi (§ 8).

---

## 5bis. Ce qui change dans la console pour la 1.2 — à faire AVANT « Envoyer pour examen »

La 1.2 envoie des données hors du téléphone (si, et seulement si, le voyageur active le jeu en ligne). La console doit
le dire **avant** que la build parte : Google compare la fiche « Sécurité des données » à ce que l'APK sait faire.
**Ne rien modifier tant que la 1.1 (3), en cours d'examen, n'est pas approuvée et publiée** (elle n'a pas `INTERNET`).
Ordre : (1) publier la 1.1 (3) ; (2) déclarations ci-dessous ; (3) fiche ; (4) Production → Créer une version → `rihla-1.2-versionCode4.aab`
(`~/Documents/bureaux/Rihla-PlayStore/aab/`) ; (5) tout envoyer ensemble.

**Sécurité des données** (Contenu de l'application) — *proposition, à valider par vous (§ 5ter)* :

| Catégorie Play | Type | Collecté | Partagé | Facultatif | Finalité | Chiffré en transit |
|---|---|---|---|---|---|---|
| Informations personnelles | **Nom** (le pseudonyme, 24 caractères, choisi librement) | oui | non | **oui** (jeu en ligne activé par l'utilisateur) | fonctionnalités de l'appli | oui (https / wss) |
| Identifiants d'appareil ou autres | **ID d'appareil ou autres ID** (identifiant tiré au hasard sur l'appareil + empreinte d'un secret ; **pas** un identifiant publicitaire) | oui | non | oui | fonctionnalités de l'appli | oui |
| Activité dans l'application | **Autres actions** (scores, temps de jeu, réponses pendant un duel) | oui | non | oui | fonctionnalités de l'appli | oui |

Tout le reste : **non collecté**. « Partagé » = non : Cloudflare héberge le serveur **pour le compte de Rihla** (prestataire,
exempté par la définition de Google). Suppression : les scores s'effacent d'eux-mêmes après 60 jours, les salles après
1 heure ; l'utilisateur peut demander l'effacement immédiat par e-mail (la page de confidentialité le dit) → répondre
« oui, par un moyen en dehors de l'appli » avec `https://warimvp.github.io/rihla/confidentialite/`. L'ancien texte
« aucune donnée collectée » ne doit plus figurer nulle part (fiche, captures, légendes).

**Classification (IARC)** : refaire le questionnaire. Les joueurs interagissent (duel en direct, pseudonyme visible de
l'adversaire et dans les classements) : « les utilisateurs peuvent interagir » = **oui** ; aucun échange de texte libre
entre joueurs, aucune position partagée, aucun achat. Résultat attendu : toujours un public large, avec la mention
« Interactivité des utilisateurs ». Les pseudonymes passent par un filtre local ET serveur (`src/lib/pseudo.js`,
`nomPublic`).

**Fiche (3 langues)** : coller les nouveaux textes de `docs/fiche-google-play.md` (« La Course (facultatif) » dans « Pour
réviser » ; le paragraphe « Sans compte… » ne dit plus « aucune donnée » ni « pas d'autorisation Internet »). Les
captures n'ont pas besoin d'être refaites. **Public cible** : 13 ans et plus, inchangé.

## 5ter. Questions que la 1.2 vous pose (je ne les ai pas tranchées)

1. **CNDP (loi 09-08)** : la 1.2 envoie un pseudonyme, un identifiant aléatoire et des scores depuis des téléphones au
   Maroc. La version web fait déjà la même chose depuis le 19/09. Un récépissé est-il nécessaire ? À faire valider.
2. **Journaux de Cloudflare** — *tranché le 09/11 : on les éteint ; reste à DÉPLOYER.* `serveur/wrangler.jsonc` activait
   `observability` : d'après la documentation de Cloudflare, les journaux de Workers gardent les métadonnées ET les
   en-têtes de chaque requête (donc, très probablement, l'adresse IP — non vérifié dans le compte), 3 jours sur le plan
   gratuit, 7 sur le payant. Le réglage est maintenant `"observability": { "enabled": false }` (commit local, test
   `src/lib/serveur.confidentialite.test.js`, 4 sabotages détectés) mais **il ne prend effet qu'au prochain
   `pnpm deploy` depuis `serveur/`** (à faire par vous : `wrangler login` est le vôtre). Tant que ce n'est pas fait,
   la phrase « le code n'en conserve aucune » reste vraie mais les journaux d'avant gardent les adresses jusqu'à leur
   expiration (≤ 3 jours après le déploiement) — donc **déployer AVANT d'envoyer la fiche « Sécurité des données »**,
   qui ne déclare pas d'adresse IP collectée.
3. **Serveur à jour ?** Le dernier changement du dossier `serveur/` (filtre de pseudonymes côté serveur, `1eafb9b`, 01/10)
   a-t-il été déployé (`pnpm run deploy` depuis `serveur/`) ? Le serveur de production répond `{"version":"1"}` comme le
   dépôt, mais rien ne prouve la date de son déploiement. Le client filtre de toute façon les noms reçus (`messagePropre`).
4. **iOS** : la 1.2 iOS (même code, build 8 dans le projet) n'embarque le serveur que si `.env` contient
   `VITE_RIHLA_SERVEUR` au moment de `pnpm ios:sync` — et alors `docs/app-store.md` § 12 (étiquettes de confidentialité)
   s'applique. Aucun build iOS n'a été fait ici.

---

## 6. Ce qui a été éprouvé par sabotage

Chaque règle de la barrière a été cassée UNE fois, le refus NOMMÉ constaté, le fichier restauré et son `md5` comparé.

**`synchro`** (`src/lib/verifier-android.test.js`, projet jetable hermétique + témoin qui doit passer) — **21/21**
neutralisations détectées en 1.1 : `allowBackup`, `dataExtractionRules`, `usesCleartextTraffic`, `SCHEDULE_EXACT_ALARM`
non retirée, autorisation non justifiée, commentaires XML (une autorisation commentée n'en est pas une), `server.url`, `appId`, fichier absent / différent / orphelin par rapport à `dist/`, `assets/public` vide,
`MARKETING_VERSION` iOS ≠ `versionName`, `versionCode` illisible, taille et alpha des icônes (adaptative, ronde, de
lancement, de la fiche), icône manquante, `livrable` sans APK.
**1.2** (jeu en ligne) : `INTERNET` retirée ou seulement commentée (refusée : elle doit être déclarée), adresse du serveur
absente du bundle, serveur d'essai en plus du bon, bonne adresse en `http`, plus un témoin « l'adresse dans plusieurs
fichiers passe ». Les quatre règles du script ont été neutralisées une à une (INTERNET non exigée, présence non exigée,
autre adresse non refusée, constante `SERVEUR` divergente) : les tests ont échoué à chaque fois, `md5` restauré identique.
Côté fiche et page : l'ancienne promesse « aucune donnée » dans la fiche, l'ancienne phrase « Android n'a pas le jeu en
ligne » dans la page, et le filtre des points « en ligne » des Nouveautés ont aussi été sabotés puis détectés.

**`livrable`** (build RÉEL signé par une clé jetable créée hors dépôt puis supprimée ; protocole à rejouer après tout
changement du script) :

| Provocation | Refus constaté |
|---|---|
| AAB dépouillé de sa signature (`zip -d 'META-INF/*.SF' …`) | « n'est PAS signé » |
| AAB / APK signés par une clé `CN=Android Debug` | « signé avec la clé de DÉBOGAGE » |
| APK modifié après signature | « signature invalide (DOES NOT VERIFY) » |
| `versionCode` ≠ celui de l'APK | « versionCode de l'APK (1) ≠ android/version.properties (2) » |
| `tools:node="remove"` retiré, build refait | « Manifeste FUSIONNÉ : android.permission.SCHEDULE_EXACT_ALARM présente — interdite » |
| `WAKE_LOCK` retirée de la liste justifiée | « Manifeste FUSIONNÉ : autorisation … WAKE_LOCK non justifiée » |
| autorisation attendue fictive ajoutée à la liste | « … VIBRATE attendue et absente » |
| `lib/arm64-v8a/libfaux.so` ajoutée à l'APK | « Bibliothèque(s) native(s) dans l'APK » |
| build de publication sans clé | « Build de publication refusée : aucun fichier de signature » |

Défauts de la barrière trouvés par ces épreuves, corrigés : `jarsigner` introuvable (raccord macOS → faux « signature
invalide » sur un build sain) ; `livrable` s'arrêtait à la première faute de la SOURCE et ne jugeait plus le manifeste
fusionné (alors que c'est lui qui montre ce que le greffon pose).

**Autres** : `barres.test.js` (3 sabotages : thème explicite ignoré, suivi du système jamais arrêté, appel hors
Android), `fiche-google-play.test.js` (5 : chiffre de destinations faux, titre trop long, langue oubliée, `INTERNET`
rétabli, description courte trop longue), `rappel.test.js` (alarme exacte).

---

## 7. Pièges déjà rencontrés

- **`--` dans un commentaire XML** : `mergeDebugResources` échoue (« La chaîne "--" n'est pas autorisée dans les
  commentaires »). Arrivé deux fois (`colors.xml`, `values-night/colors.xml`).
- **`force-stop` juste après avoir semé le `localStorage`** : la WebView écrit sur disque avec retard, le voyage semé est
  perdu (l'écran d'une première installation, en français même dans la passe arabe). Recharger la page EN PLACE.
- **Retour** : sans le rappel de `MainActivity`, l'activité se ferme à chaque Retour (§ 4).
- **Icônes de la barre d'état noires sur fond sombre** (mode nuit) : voir `src/lib/barres.js`.
- **`rihla_pixel` recréé le 08/11/2026** (Pixel 8, `system-images;android-36;google_apis;arm64-v8a`, `-port 5562
  -no-snapshot -no-audio -no-window`) ; il est ÉTEINT, l'AVD reste défini. Pour piloter la WebView : le socket DevTools est
  `webview_devtools_remote_<pid de l'app>` — jamais « le premier de /proc/net/unix » (un lancement précédent en laisse
  d'obsolètes et le script reste suspendu sans erreur).
- **`adb` nu** est ambigu dès qu'un autre émulateur tourne : toujours `adb -s emulator-5562`, et ne jamais toucher aux
  émulateurs d'autres sessions (`atlasya_pixel`, `stores_pixel`).
- **`cap sync` ajoute `cordova.js` et `cordova_plugins.js`** à `assets/public` : ils ne viennent pas de `dist/` (la
  barrière les connaît).
- **Une autorisation commentée n'est pas une autorisation** : les commentaires du manifeste citent `INTERNET` et
  `SCHEDULE_EXACT_ALARM` ; la barrière les retire avant de lire.

---

## 8. Liste de contrôle avant « Envoyer pour examen »

- [x] Lien vers la politique DANS l'application (Réglages › À propos), ouvert à l'émulateur réseau coupé (1.1 (2))
- [x] Clé d'importation créée (`~/cles/rihla`) ; **sauvegarde du fichier et des mots de passe à confirmer**
- [ ] `pnpm android:release` vert avec VOTRE clé (barrière « livrable » : rien à refuser), AAB téléversé
- [ ] Essai sur un vrai téléphone Android : lancement, hors ligne (mode avion), rappel, Retour, arabe
- [x] **1.2** : La Course essayée dans la WebView 133 de l'émulateur `rihla_pixel` (Pixel 8, API 36, recréé le 08/11) :
      aucune requête avant le consentement, salle créée sur le serveur de production, hors connexion propre (14/14)
- [ ] **1.2** : déclarations de la console faites (§ 5bis), fiche collée en 3 langues, IARC refaite, **après** la
      publication de la 1.1 (3)
- [ ] **1.2** : essai d'un duel COMPLET à deux appareils (non fait : il inscrirait deux lignes au classement public)
- [ ] Fiche remplie (fr-FR, ar, en-US) ; **les textes arabes et anglais relus par un lecteur natif**
- [ ] Déclarations du § 5 faites ; classification IARC envoyée ; public cible **13+** confirmé
- [ ] Pays de distribution choisis ; prix : gratuite
- [x] Politique de confidentialité en ligne (`warimvp.github.io/rihla/confidentialite/`) — relire qu'elle n'annonce pas
      pour Android une fonction absente de cette build (le jeu en ligne : désactivé par défaut et ABSENT ici).
      Fait le 22/10/2026 : la page dit que l'application Android n'a ni le jeu en ligne ni l'autorisation Internet
      (FR + AR), son contact est celui de la fiche (`contact@legantis.net`) ; `fiche-google-play.test.js` le garde.
      **Effective à la fusion** : le workflow Pages publie la page à chaque push sur `main`.
- [ ] Branche `android-play` relue, fusionnée dans `main`, poussée (le workflow Pages teste et publie à chaque push)
