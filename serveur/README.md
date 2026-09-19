# Le serveur de Rihla — duels en direct et classements

Un Worker Cloudflare + trois Durable Objects, **entièrement dans le plan gratuit** (100 000 requêtes/jour, objets SQLite). Optionnel : sans lui, l'app est 100 % hors-ligne, exactement comme avant.

| Objet | Rôle | Une instance par… |
|---|---|---|
| `Salle` | un duel en direct (La Course) : deux WebSockets hibernables, la règle `src/lib/salle.js`, le chrono, le verdict | code de salle (`KZ5CM`) |
| `Hall` | « un adversaire au hasard » : les WebSockets en attente SONT la file (tag = langue) | singleton |
| `Registre` | un classement : l'étape du jour ou les duels de la semaine (SQLite) ; identité sans compte par empreinte du secret | clé (`jour:2026-09-19`, `semaine:2026-W38`) |

Le serveur importe **le code de l'app** (`../../src/lib/salle.js`, `barid.js`, `data/langues.js`) : il connaît les bonnes réponses, chronomètre lui-même et tranche — un client ne peut ni retoucher son score ni son temps. La règle du duel se teste dans `src/lib/salle.test.js`, sans Cloudflare.

## Routes

| Méthode | Route | Réponse |
|---|---|---|
| `GET` | `/` | `{ ok, service, version }` |
| `POST` | `/salles` `{ langue }` | `{ code }` — `langue` = id d'une destination ou `*` |
| `GET` | `/salles/:code` (WebSocket, `?id=&nom=`) | la salle ; en HTTP simple : `{ code }` ou 404 |
| `GET` | `/hall?langue=` (WebSocket, `?id=&nom=`) | `{ type: 'attente' }` puis `{ type: 'salle', code }` |
| `GET` | `/classement/:type/:cle?id=` | `{ lignes[50], total, moi }` |
| `POST` | `/scores` `{ id, secret, nom, type: 'jour', cle, score, temps }` | `{ ok, rang, total }` — 403 `identite` si le secret ne correspond pas |

Messages WebSocket d'une salle (serveur → client) : `salle`, `joueurs`, `depart { graine, langue, dans }`, `reprise`, `etat`, `fin { joueurs[{ score, temps, verdict, points }] }`, `erreur { code }`. Client → serveur : `repondre { i, optionId }`, `revanche`, `ping`.

## Développer en local

```bash
cd serveur && pnpm install
pnpm dev          # http://localhost:8787 — Durable Objects simulés, état dans .wrangler/state
```

Côté app, sans rebâtir : dans la console du navigateur, `localStorage.setItem('rihla.serveur', 'http://localhost:8787')` puis recharger (la clé `rihla.serveur` l'emporte sur `VITE_RIHLA_SERVEUR` — pratique aussi pour l'app iOS installée).

## En production

Déployé le 19 septembre 2026 : **https://rihla-serveur.rihla-serveur.workers.dev** (plan gratuit). L'app web le lit par la variable de dépôt GitHub `VITE_RIHLA_SERVEUR` (déjà posée) ; l'app iOS par `.env` au moment de `pnpm ios:sync`.

## Déployer (une fois)

1. Un compte Cloudflare (gratuit) : https://dash.cloudflare.com/sign-up
2. Se connecter depuis ce dossier — ouvre le navigateur, à faire soi-même :
   ```bash
   cd serveur && pnpm wrangler login
   ```
3. Déployer :
   ```bash
   pnpm deploy
   ```
   Wrangler crée le Worker `rihla-serveur`, ses trois espaces Durable Objects, et affiche l'adresse : `https://rihla-serveur.<sous-domaine>.workers.dev`.
4. Donner l'adresse à l'app :
   - **web (GitHub Pages)** : dépôt → Settings → Secrets and variables → Actions → *Variables* → `VITE_RIHLA_SERVEUR` = l'adresse. Le prochain push la lit (`.github/workflows/pages.yml`).
   - **en local** : `VITE_RIHLA_SERVEUR=…` dans `.env` (voir `.env.example`).
   - **iOS** : `pnpm ios:sync` après avoir mis la variable dans `.env` (elle est figée dans le build).

Ensuite, chaque mise à jour du serveur = `pnpm deploy` ; `pnpm journal` (wrangler tail) suit les logs en direct ; `pnpm verifier` bâtit sans déployer.

## Ce qui est envoyé, et rien d'autre

Pseudonyme, scores, temps, et un identifiant tiré au hasard sur l'appareil (`rihla.voyageur`) avec un secret qui ne sert qu'à prouver que c'est le même appareil. Aucun compte, aucun e-mail, aucune adresse IP conservée par le code (Cloudflare en voit passer, comme tout hébergeur). Les classements s'effacent d'eux-mêmes après 60 jours, les salles après une heure.

## Limites du plan gratuit et ordres de grandeur

Un duel ≈ 25 messages WebSocket (facturés 1 requête pour 20) + 2 requêtes ; un score ≈ 1 requête ; un classement affiché ≈ 1 requête. Les 100 000 requêtes quotidiennes couvrent des milliers de joueurs actifs par jour. Au-delà : plan Workers Paid (5 $/mois).
