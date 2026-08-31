# Rihla · رحلة — les langues du monde, gratuites pour toujours

**➜ App en ligne : https://warimvp.github.io/rihla/** (PWA installable — déployée automatiquement à chaque push sur `main`). Code sous licence [MIT](LICENSE) : libre d'usage, de copie et de modification — comme l'app, pour toujours.

En 1325, Ibn Battuta quitte Tanger pour 29 ans de voyage et 120 000 km. **Rihla** (« le voyage ») reprend sa route : chaque langue est une **destination**, chaque leçon une **étape**, chaque réussite un **tampon** dans ton passeport.

- 9 destinations : Grenade (espagnol), Venise (italien), Londres (anglais), Istanbul (turc), Ispahan (persan), Mombasa (swahili), Delhi (hindi), Pékin (mandarin), Tokyo (japonais)
- Leçons en deux temps : cartes-mots (avec prononciation) puis quiz
- Cinq jeux de révision par destination : **Zellige des paires** (memory), **Le Souk** (45 s chrono, combos), **La Caravane** (épellation, l'étoile avance sur la piste), **L'Oreille** (compréhension orale pure) et **Le Duel** (2 joueurs face à face sur un seul téléphone)
- **L'étape du jour** : un défi quotidien qui mélange les 9 langues — même tirage pour tout le monde, et il fait avancer ta série de jours de voyage
- XP, kilomètres parcourus, série de « jours de voyage », visas à collectionner
- Interface **français / arabe (RTL)** — pensée pour le Maroc
- **100 % gratuit, pour toujours** : pas de pub, pas de compte, pas de paywall, fonctionne hors-ligne (PWA)

Thème complet (logo boussole-zellige, palette Majorelle/terracotta/safran/menthe, composants, écrans) sur le canvas Claude Design : https://claude.ai/code/artifact/9646c563-567e-49f4-8bd9-cfcd80494524 — sources dans `design/`.

## Démarrer

```bash
pnpm install
pnpm dev        # http://localhost:5183
pnpm test       # vitest (logique quiz / progression)
pnpm build      # production dans dist/
```

## Déploiement — gratuit, et sans organisation Apple

### 1. Le web d'abord (zéro compte Apple, zéro dirham) — ✅ en place

Déployé sur **GitHub Pages** : https://warimvp.github.io/rihla/ — le workflow `.github/workflows/pages.yml` teste, construit et publie à chaque push sur `main`. La base Vite est relative (`base: './'`), donc le même build se déploie tel quel ailleurs (Cloudflare Pages, Hostinger, racine ou sous-chemin). Sur iPhone : Safari → Partager → « Sur l'écran d'accueil ». Au Maroc, l'essentiel du parc est Android : le canal web/PWA couvre déjà presque tout le monde.

### 2. Sur ton iPhone — compte Apple **gratuit** (aucun abonnement)

Pas besoin du programme payant pour installer sur **ton** téléphone :

1. `pnpm ios:sync && npx cap open ios`
2. Dans Xcode : cible **App** → *Signing & Capabilities* → *Team* = ton identifiant Apple personnel (« Personal Team »)
3. Branche l'iPhone et **Run**. La signature gratuite expire au bout de 7 jours — un nouveau Run la renouvelle.

### 3. App Store — compte Apple Developer **individuel** (99 $/an)

Une organisation n'est **pas** requise pour publier : l'adhésion **« Individual »** au Apple Developer Program publie sur l'App Store mondial **sous ton nom personnel**, sans numéro D-U-N-S ni société. Le type « Organization » ne sert qu'à publier au nom d'une entreprise. L'adhésion individuelle inclut TestFlight (bêta jusqu'à 10 000 testeurs) et la distribution mondiale.

### 4. Android

Google Play : compte développeur à 25 $ **une seule fois** — ou distribution directe d'APK / PWA sans aucun compte.

## Architecture

```
src/
  data/langues.js      # 9 langues × 2 leçons × 8 mots (sens FR/AR partagés par index)
  lib/progression.js   # XP, série de jours, visas, km — pur + localStorage injectable
  lib/quiz.js          # quiz déterministe (rng injectable) : compréhension ↔ production
  lib/tts.js           # prononciation via la synthèse vocale du système (gratuite, hors-ligne)
  i18n.js              # dictionnaires FR/AR, direction RTL dérivée
  components/          # Accueil (itinéraire), Apprendre (étapes), Leçon, Passeport, Réglages
design/                # planches du thème (Claude Design) + canvas.json
ios/                   # projet Capacitor (généré) — voir CLAUDE.md § iOS
```
