# Dossier App Store — Rihla

> **✅ Publiée le 21/09/2026** — https://apps.apple.com/app/id6809222617 (id `6809222617`, version 1.0, vendeur « Yassir legmara », compte individuel).
> Relevé de la fiche publique le 24/09/2026 (API `itunes.apple.com/lookup?id=6809222617`) — **trois écarts avec ce dossier, à corriger à la prochaine version** :
> - **Nom affiché : `ma.rihla.app`** au lieu de `Rihla — les langues du monde` (§ 1.2). Le nom se modifie avec une nouvelle version soumise à l'examen.
> - **Âge 17+ (« Unrestricted Web Access »)** au lieu de 4+ : le questionnaire (§ 3.3) a reçu « Oui » à l'accès web illimité. Répondre **Non**.
> - **Langues : EN seul** : `CFBundleDevelopmentRegion = en` et aucune `CFBundleLocalizations` dans `ios/App/App/Info.plist`. Déclarer `fr` et `ar` (et passer la région de développement à `fr`) pour que la fiche annonce Français / Arabe.
>
> Lien à utiliser partout : `https://apps.apple.com/app/id6809222617` (sans pays ni nom : il survit au renommage). La bannière Safari de la version web pointe sur le même id (`index.html`).

Fiche de soumission **champ par champ**, dans l'ordre exact des écrans d'App Store Connect.
Chaque ligne = un champ du formulaire. `⬜` = donnée que toi seul as (identité, téléphone, choix).
Tout le reste est prêt à copier-coller.

Le binaire : `pnpm ios:release` → `ios/build/export/App.ipa`.
Pour une **mise à jour** (pas pour la première soumission) : `pnpm version:build` d'abord, sinon Apple
refuse le paquet (ITMS-4238).

---

## 0 · Avant d'ouvrir le formulaire

| # | Point | État |
|---|---|---|
| 0.1 | Adhésion Apple Developer Program active (type **Individual**, 99 $/an) | Team ID `Q9L7244W3Z` — déjà utilisé par `scripts/archiver.sh` |
| 0.2 | **Business → Agreements** : dernier « Apple Developer Program License Agreement » accepté. App gratuite ⇒ ni contrat « Paid Apps », ni infos bancaires, ni infos fiscales | ⬜ à vérifier |
| 0.3 | Identifiant `ma.rihla.app` présent dans **Certificates, Identifiers & Profiles → Identifiers** (créé tout seul par la signature automatique du premier archivage) | ✔ normalement |
| 0.4 | **Transporter** installée (Mac App Store, gratuite) — ou Xcode → Organizer | ⬜ |
| 0.5 | Authentification à deux facteurs active sur l'Apple ID | ✔ obligatoire depuis longtemps |

## A · Les six données que je ne peux pas deviner

À préparer avant de commencer — elles reviennent dans plusieurs écrans.

| # | Donnée | Où elle sert | Ta valeur |
|---|---|---|---|
| A.1 | **Nom légal** exact, tel qu'il apparaît dans Apple Developer → Membership | Copyright (§ 5.9), nom du vendeur affiché sur la fiche | ⬜ |
| A.2 | **Téléphone** au format international (`+212 6 …`) | Contact d'examen (§ 5.11), et publiquement si statut « trader » | ⬜ |
| A.3 | **E-mail de contact** pour l'examen | Contact d'examen (§ 5.11) | ⬜ (`ylegmara@gmail.com` ?) |
| A.4 | **Statut DSA** : trader ou non-trader → voir § 2.9, à trancher avant | App Information | ⬜ |
| A.5 | **Adresse postale ou boîte postale** — uniquement si tu te déclares trader ; elle sera **publique** sur la fiche dans l'UE | Trader status | ⬜ |
| A.6 | **Mise en vente** : automatique dès l'approbation, ou manuelle (recommandé) | § 5.12 | ⬜ |

---

## 1 · Écran « Mes apps » → **+** → Nouvelle app

| # | Champ | Valeur |
|---|---|---|
| 1.1 | Plateformes | **iOS** uniquement (le projet est `TARGETED_DEVICE_FAMILY = 1`, iPhone seul — donc **aucune capture iPad à fournir**) |
| 1.2 | Nom (30 c. max) | `Rihla — les langues du monde` (28 c.) — si refusé car déjà pris : `Rihla · langues du monde` |
| 1.3 | Langue principale | **Français (France)** |
| 1.4 | Bundle ID | `ma.rihla.app` (dans la liste déroulante — Rihla / XC ma rihla app) |
| 1.5 | SKU (interne, jamais public) | `rihla-001` |
| 1.6 | Accès utilisateur | **Accès complet** |

⚠️ Le **nom** et le **bundle ID** ne se changent plus après la première publication. Le SKU jamais.

---

## 2 · Onglet « App Information » (Informations sur l'app)

### Partie localisable — **Français** (langue par défaut)

| # | Champ | Limite | Valeur |
|---|---|---|---|
| 2.1 | Nom | 30 | `Rihla — les langues du monde` |
| 2.2 | Sous-titre | 30 | `Apprends en voyageant. Gratuit` (30 pile) |
| 2.3 | URL de confidentialité | — | `https://warimvp.github.io/rihla/confidentialite/` (la page existe : `public/confidentialite/index.html`, FR + AR) |

### Partie localisable — **Arabe** (bouton « Français (France) ▾ » en haut à droite → Ajouter une langue → العربية)

| # | Champ | Limite | Valeur |
|---|---|---|---|
| 2.4 | الاسم | 30 | `رحلة — لغات العالم` |
| 2.5 | العنوان الفرعي | 30 | `تعلم اللغات وأنت تسافر. مجاناً` (30 pile — la version avec shadda, تعلّم, fait 31 et sera refusée) |
| 2.6 | رابط سياسة الخصوصية | — | `https://warimvp.github.io/rihla/confidentialite/` |

### Informations générales

| # | Champ | Valeur |
|---|---|---|
| 2.7 | Catégorie principale | **Éducation** |
| 2.8 | Catégorie secondaire | **Voyages** (facultatif, mais utile) |
| 2.9 | **Statut de professionnel (DSA / Digital Services Act)** | Voir l'encadré ci-dessous — **obligatoire**, l'app ne peut pas être distribuée dans l'UE sans |
| 2.10 | Droits de contenu — « Cette app contient-elle, affiche-t-elle ou donne-t-elle accès à du contenu tiers ? » | **Non** — tout le contenu est original ; les polices (Young Serif, Amiri, Readex Pro) sont sous licence OFL, embarquées, licences dans `public/polices/LICENCE.txt` |
| 2.11 | Contrat de licence utilisateur | Laisser le **CLUF standard d'Apple** |
| 2.12 | Classification par âge | Questionnaire → § 3 |

> **2.9 — Trader ou non-trader ?**
> Apple oblige **tout** développeur à se déclarer, même hors UE. Deux réponses possibles :
> - **« Ce n'est pas un compte de professionnel »** : rien d'autre à saisir. Les consommateurs de l'UE voient une mention disant que le droit de la consommation ne s'applique pas. C'est la réponse cohérente avec Rihla aujourd'hui : app gratuite, sans pub, sans achat intégré, sans activité commerciale.
> - **« Compte de professionnel »** : adresse (ou BP), téléphone et e-mail **publiés sur la fiche App Store dans l'UE**, plus une vérification par Apple (documents, validation du téléphone et de l'e-mail).
>
> ⚠️ Le jour où la publicité récompensée est activée (`src/lib/pub.js`), l'app devient une activité commerciale : il faudra repasser en **trader**, avec l'adresse publique.

---

## 3 · Questionnaire de classification par âge

Réponds dans l'ordre. Pour Rihla, **tout est « Aucun » / « Non »** — le résultat doit être **4+**.

| # | Section → question | Réponse |
|---|---|---|
| 3.1 | Contrôles intégrés → Contrôles parentaux | Non |
| 3.2 | Contrôles intégrés → Vérification de l'âge | Non |
| 3.3 | Fonctionnalités → Accès web illimité | **Non** ← important : l'app n'ouvre aucun navigateur interne |
| 3.4 | Fonctionnalités → Contenu généré par les utilisateurs | Non |
| 3.5 | Fonctionnalités → Réseaux sociaux | Non |
| 3.6 | Fonctionnalités → Messagerie et chat | Non (le Duel est à deux **sur le même téléphone**, sans réseau) |
| 3.7 | Fonctionnalités → Publicité | Non (socle éteint, aucun SDK installé) |
| 3.8 | Thèmes matures → Grossièretés ou humour grossier | Aucun |
| 3.9 | Thèmes matures → Horreur / peur | Aucun |
| 3.10 | Thèmes matures → Alcool, tabac, drogues | Aucun |
| 3.11 | Médical ou bien-être → Informations médicales ou de traitement | Aucun (la leçon « chez le médecin » n'est que du vocabulaire — ni conseil, ni information médicale) |
| 3.12 | Médical ou bien-être → Santé ou bien-être | Aucun |
| 3.13 | Sexualité ou nudité (3 questions) | Aucun × 3 |
| 3.14 | Violence → dessin animé / réaliste / graphique / armes (4 questions) | Aucun × 4 |
| 3.15 | Activités de hasard → Jeux d'argent, jeux d'argent simulés, concours, coffres à butin (4 questions) | Non × 4 (les « jeux du voyage » ne mettent en jeu ni argent, ni hasard payant, ni classement entre joueurs) |
| 3.16 | Résultat attendu | **4+** |

---

## 4 · Onglet « Confidentialité de l'app »

| # | Champ | Valeur |
|---|---|---|
| 4.1 | URL de la politique de confidentialité | `https://warimvp.github.io/rihla/confidentialite/` |
| 4.2 | « Collectez-vous, vous ou vos partenaires tiers, des données à partir de cette app ? » | **Non** → puis **Publier**. Aucune autre question n'est posée, et la fiche affiche le badge **« Données non collectées »** |
| 4.3 | URL des choix de confidentialité | Laisser vide |

C'est exact et vérifiable : pas de compte, pas de serveur, pas d'analytique, pas de SDK publicitaire,
polices embarquées — le binaire ne fait aucune requête réseau.

⚠️ **Valable seulement si le build iOS est fait SANS `VITE_RIHLA_SERVEUR` dans `.env`** (ou avec la
ligne commentée). Depuis le 19 septembre 2026, un serveur de duels existe (dossier `serveur/`) ; s'il
est dans le build, le jeu en ligne (opt-in) envoie un pseudonyme et des scores : voir § 12 pour le
questionnaire à refaire. Pour la première soumission, le plus simple et le plus honnête : build sans
la variable, fiche « Données non collectées » ; le jeu en ligne arrivera dans une mise à jour.

---

## 5 · Onglet « iOS App 1.0 » — Préparer la soumission

### 5.0 L'icône (le logo) — aucun champ à remplir

Depuis Xcode 9, l'icône de la fiche App Store est **lue dans le binaire** : elle n'est nulle part dans
le formulaire. Elle arrive avec le `.ipa`, et pour la changer il faut re-téléverser un build.

| Point | État |
|---|---|
| Fichier | `ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png` |
| Taille | **1024 × 1024** — une seule entrée dans `Contents.json` (format Xcode 14+ : `actool` engendre toutes les tailles dérivées) ✔ |
| Transparence | canal alpha présent mais **totalement opaque** ; le catalogue compilé la marque `Opaque: True` ✔ |
| Coins, bordure, ombre | aucun — c'est iOS qui applique le masque arrondi ✔ |
| Jumelle web / presse | `public/icons/icon-1024.png` (même dessin), plus `icon-512`, `icon-192`, `apple-touch-icon` (180) et `icon.svg` pour la PWA |

Deux règles d'Apple sur l'icône, à garder en tête :

- **Pas de texte** ni de drapeau : l'icône est une boussole-zellige en aplats (Majorelle, crème, safran) — conforme au thème et aux règles du projet.
- **Ne pas évoquer une icône d'Apple** (ligne directrice 4.1) : à petite taille, une aiguille de boussole bicolore dans un disque bleu peut faire penser à Safari. Le risque reste faible — l'étoile zellige à huit branches, la palette et l'aiguille safran sont très différentes — mais si un examinateur le soulève, la parade est d'épaissir l'étoile (le khatam devient l'élément dominant) plutôt que de redessiner l'aiguille.

### 5.1 Captures d'écran — **6,9″ : 1320 × 2868 px** (1 minimum, 10 maximum)

Les 7 fichiers de `captures/` sont déjà à la bonne taille et **sans canal alpha** (vérifié) :

| Ordre | Fichier | Écran |
|---|---|---|
| 1 | `captures/2-itineraire.png` | L'itinéraire — c'est la vignette qui vend |
| 2 | `captures/4-niveaux.png` | Les 24 étapes sur 5 niveaux |
| 3 | `captures/3-carte-mot.png` | Une carte-mot |
| 4 | `captures/5-souk.png` | Le Souk |
| 5 | `captures/6-passeport.png` | Le passeport (visas + semaine) |
| 6 | `captures/1-cap.png` | « Où va ta rihla ? » |
| 7 | `captures/7-nuit.png` | Mode nuit |

- Glisser-déposer dans la zone **iPhone 6,9″**. Les tailles plus petites sont mises à l'échelle automatiquement : rien d'autre à fournir.
- **Zone 6,5″** (elle réclame 1242 × 2688 ou 1284 × 2778) : facultative dès que la 6,9″ est remplie — Apple exige l'une **ou** l'autre. Pour la remplir quand même, les mêmes sept écrans sont prêts en **1284 × 2778** dans `captures/6.5/`, engendrés depuis les 6,9″ :

  ```bash
  mkdir -p captures/6.5
  for f in captures/*.png; do sips -z 2778 1284 "$f" --out "captures/6.5/$(basename $f)"; done
  ```

  Le ratio des deux formats diffère de 0,4 % : la hauteur est donc très légèrement étirée plutôt que recadrée — rien de visible, et aucun contenu perdu. La barre d'état gardée est celle d'un 6,9″ (Dynamic Island) ; Apple ne l'exige pas identique au châssis.
- Si App Store Connect réclame des captures pour la **localisation arabe**, recopie les mêmes fichiers (ou refais-les avec l'interface en arabe — plus vendeur au Maroc).

### 5.2 → 5.13 Les champs, dans l'ordre de la page

| # | Champ | Limite | Valeur |
|---|---|---|---|
| 5.2 | Aperçu de l'app (vidéo) | — | Laisser vide |
| 5.3 | Texte promotionnel (FR) | 170 | `14 langues sur la route d'Ibn Battuta, 2 688 mots, 5 jeux, un défi par jour. Gratuit pour toujours : sans pub, sans compte, et tout marche hors-ligne.` |
| 5.4 | Description (FR) | 4000 | § 6 |
| 5.5 | Mots-clés (FR) | 100 | `apprendre,arabe,vocabulaire,espagnol,turc,japonais,russe,coréen,voyage,gratuit,hors-ligne,maroc` |
| 5.6 | URL d'assistance | — | `https://github.com/Warimvp/rihla` |
| 5.7 | URL marketing | — | `https://warimvp.github.io/rihla/` |
| 5.8 | Version | — | `1.0` |
| 5.9 | Copyright | — | `2026 ⬜ ton nom légal` (Apple ajoute le « © » lui-même) |
| 5.10 | Build | — | **1.0 (5)** — déposé chez Apple le 17/09/2026 à 21:52, en traitement. Il apparaît dans la liste 5 à 30 min après ; le sélectionner ici |
| 5.11 | Informations pour l'examen | — | § 5.11 ci-dessous |
| 5.12 | Mise en vente | — | **Publier manuellement cette version** (tu choisis le jour) |
| 5.13 | Identifiant de publicité (IDFA) | — | **Non** (question posée au moment de « Soumettre ») |

Puis en arabe (sélecteur de langue en haut de la page) :

| # | Champ | Limite | Valeur |
|---|---|---|---|
| 5.14 | النص الترويجي | 170 | `14 لغة على درب ابن بطوطة، 2688 كلمة، 5 ألعاب، وتحدٍّ كل يوم. مجاني إلى الأبد: بلا إعلانات، بلا حساب، ويشتغل بدون أنترنت.` |
| 5.15 | الوصف | 4000 | § 6 |
| 5.16 | الكلمات المفتاحية | 100 | `تعلم,عربية,مفردات,إسبانية,تركية,يابانية,روسية,كورية,سفر,مجاني,بدون أنترنت,المغرب` |

> Règle des mots-clés : le **nom** et le **sous-titre** sont déjà indexés — ne jamais y répéter un mot
> (d'où l'absence de « langues » dans 5.5 et de « لغات » dans 5.16). Virgules **sans espace**.
> Ni pluriels, ni accents inutiles : Apple gère les variantes.

### 5.11 Informations pour l'examen

| # | Champ | Valeur |
|---|---|---|
| 5.11.a | Connexion requise | **Décoché** — l'app n'a ni compte ni identifiant |
| 5.11.b | Prénom / Nom | ⬜ A.1 |
| 5.11.c | Téléphone | ⬜ A.2 (format `+212…`) |
| 5.11.d | E-mail | ⬜ A.3 |
| 5.11.e | Pièce jointe | Aucune |
| 5.11.f | Notes | le texte anglais du § 8 |

---

## 6 · Descriptions

### Description — Français (à coller en 5.4)

```
En 1325, Ibn Battuta quittait Tanger pour le plus grand voyage de son siècle. Rihla (« le voyage ») te fait reprendre sa route : 14 langues, 14 destinations, un passeport à tamponner.

14 LANGUES DU MONDE — arabe, espagnol, portugais, italien, allemand, anglais, turc, russe, persan, swahili, hindi, mandarin, coréen, japonais : de Grenade à Tokyo, chaque langue est une destination sur ta carte. Et tu choisis la langue de tes définitions : apprends l'anglais avec des sens en arabe, ou l'arabe avec des sens en français.

CINQ NIVEAUX PAR DESTINATION — Survie (les mots), Conversation (faire connaissance, se débrouiller, le temps qu'il fait), Récits (à l'hôtel, chez le médecin, prendre la route), Le quotidien (la ville, la maison, le corps, le travail) et Nuances (raconter hier, parler de demain, donner son avis). Cartes-mots avec prononciation, puis des exercices variés : comprendre, écouter, produire, épeler, lire l'écriture, remettre une phrase dans l'ordre, et retrouver un mot d'après une image — sans passer par la traduction. Valide tes 24 étapes et décroche le visa de la ville.

5 JEUX POUR RÉVISER — le memory Zellige, le Souk chrono, la Caravane d'épellation, l'Oreille (compréhension orale pure) et le Duel à deux sur un seul téléphone.

L'ÉTAPE DU JOUR — un défi quotidien qui mélange toutes les langues, le même pour tous les voyageurs.

LE CARNET — la révision espacée : chaque étape validée y verse ses mots, et ils reviennent juste avant que tu les oublies (1, 3, 7, 16, 35 puis 90 jours).

LES MOTS VOYAGEURS — dans chaque destination, les mots partis de l'arabe et arrivés là-bas : sucre, café, coton, zéro, algèbre. Ceux-là, tu les connais déjà.

TON RYTHME — choisis ton cap (une langue précise ou la route d'Ibn Battuta), ton objectif quotidien, et un rappel à l'heure qui t'arrange. Une nuit de caravansérail protège ta série quand la journée a été trop courte. Sauvegarde ton voyage quand tu veux : il est à toi.

GRATUIT, POUR TOUJOURS — pas de compte, pas de publicité, pas d'abonnement, pas de vies à attendre, aucune collecte de données. Tout fonctionne hors-ligne, en avion comme au fond du Rif.

Interface en français et en arabe, avec affichage RTL complet. Mode nuit « Nuit d'encre ». Guide du voyageur intégré.

Fait au Maroc, avec l'amour du voyage. Le code est ouvert : github.com/Warimvp/rihla
```

### Description — العربية (à coller en 5.15)

```
سنة 1325 غادر ابن بطوطة طنجة في أعظم رحلة في قرنه. «رحلة» تعيدك إلى دربه: 14 لغة، 14 وجهة، وجواز سفر تملؤه الأختام.

14 لغة من العالم: العربية، الإسبانية، البرتغالية، الإيطالية، الألمانية، الإنجليزية، التركية، الروسية، الفارسية، السواحلية، الهندية، الصينية، الكورية، اليابانية — من غرناطة إلى طوكيو. وتختار أنت لغة الشرح: تعلّم الإنجليزية بشرح عربي، أو العربية بشرح فرنسي.

خمسة مستويات لكل وجهة: البقاء، المحادثة، الحكايات، الحياة اليومية، والفروق. بطاقات كلمات مع النطق، ثم تمارين متنوعة: الفهم، الاستماع، الإنتاج، التهجئة، قراءة الخط، ترتيب الجملة، والتعرّف على الكلمة من صورة دون ترجمة. أكمل 24 مرحلة واحصل على تأشيرة المدينة.

5 ألعاب للمراجعة: زليج الأزواج، السوق بالمؤقّت، القافلة للتهجئة، الأذن للاستماع الخالص، والمبارزة بين لاعبين على هاتف واحد.

مرحلة اليوم: تحدٍّ يومي يمزج كل اللغات، واحد للجميع.

الدفتر: مراجعة متباعدة — كل مرحلة تُنجزها تودع كلماتها فيه، فتعود إليك قبل أن تنساها (1، 3، 7، 16، 35 ثم 90 يوماً).

الكلمات المسافرة: في كل وجهة، كلمات خرجت من العربية ووصلت إلى هناك — السكر، القهوة، القطن، الصفر، الجبر. هذه تعرفها منذ زمن.

على إيقاعك: اختر وجهتك، هدفك اليومي، وتذكيراً في الساعة التي تناسبك. وليلة في الخان تحمي سلسلتك حين يقصر اليوم. واحفظ رحلتك متى شئت: هي ملكك.

مجاني إلى الأبد: بلا حساب، بلا إعلانات، بلا اشتراك، بلا قلوب تنتظرها، وبلا أي جمع للبيانات. كل شيء يشتغل بدون أنترنت.

الواجهة بالفرنسية والعربية مع دعم كامل للكتابة من اليمين إلى اليسار. وضع ليلي «ليل الحبر». ودليل المسافر داخل التطبيق.

صُنع في المغرب بحب السفر. الشيفرة مفتوحة: github.com/Warimvp/rihla
```

> Le champ **« Nouveautés »** n'existe pas pour une première version : il n'apparaîtra qu'à la v1.1.
> Texte prêt pour ce jour-là : « Les mots voyageurs : dans chaque destination, les mots partis de l'arabe. »

---

## 7 · Téléverser le binaire

1. `pnpm ios:release` → `ios/build/export/App.ipa` ✔ **fait** (1.0 build 5, 1,4 Mo, signé `Apple Distribution: Yassir legmara (Q9L7244W3Z)`, profil « iOS Team Store Provisioning Profile », `get-task-allow=false`)
2. Dépôt ✔ **fait** — sans Transporter ni Organizer, en réutilisant le compte Apple déjà connecté dans Xcode :

   ```bash
   xcodebuild -exportArchive -archivePath ios/build/App.xcarchive \
     -exportOptionsPlist <plist method=app-store-connect + destination=upload> \
     -allowProvisioningUpdates
   ```

   Le plist de dépôt est le même que `ios/ExportOptions.plist` avec `destination` = `upload` au lieu de `export`.
   ⚠️ Les numéros de build 3 et 4 étaient **déjà consommés** chez Apple : pour le prochain dépôt, `pnpm version:build` mène à 6.
3. Attendre 5 à 30 min : le build apparaît dans App Store Connect → onglet de la version → **Build** → **+**
4. Conformité à l'exportation : **rien à répondre**, `ITSAppUsesNonExemptEncryption = false` est déjà dans `ios/App/App/Info.plist`
5. Facultatif mais recommandé : installer ce build par **TestFlight** sur ton iPhone et jouer une leçon entière avant de soumettre

> **19/09/2026 — le build 5 a été rejeté sous « Guideline 2.1 — Information Needed ».** Ce n'est pas
> un défaut de l'app : Apple réclame des informations parce que le compte est neuf. Aucun nouveau
> build à déposer — tout est au **§ 13**.

---

## 8 · Le texte anglais pour Apple — un seul, pour les deux champs

**Les deux champs sont plafonnés à 4 000 caractères** : le champ « Notes » des Informations pour
l'examen, et — découvert à l'usage le 20/09 — **la zone de réponse du Centre de résolution aussi**.
D'où un texte unique, à coller aux deux endroits : **3867 caractères, 3872 octets**, soit 128 de marge
quel que soit le mode de comptage. Il répond aux six demandes du rejet 2.1 dans l'ordre d'Apple, et
reste vrai tant que le binaire est celui de la 1.0 (hors-ligne) — le jour où le jeu en ligne entre
dans le build, le réécrire (§ 12).

```
Thank you for the review. Build 1.0 (5) is unchanged; here are the six points.

Rihla ("the journey" in Arabic) is a 100% offline vocabulary-learning app: no server, no ads, no analytics, no tracking. All content ships inside the binary; progress stays on the device. The source of this build is public: commit 0bd486d of https://github.com/Warimvp/rihla

1. RECORDING: attached, captured on a physical iPhone running the latest iOS, starting with launching the app, in Airplane Mode throughout to show it is fully offline. It follows the whole typical flow described in point 3, including a complete lesson up to the validated step. There is NO account registration, login or deletion (no account exists), NO user-generated content (nothing can be created, posted, shared or received, so nothing to report or block), and NO paid content or feature. Those flows do not exist, so they are not in the recording. Settings does offer "Effacer mon progrès" (erase my progress), which deletes everything stored on the device.

2. PURPOSE: beginner vocabulary in 14 languages for French- and Arabic-speaking learners, mainly in Morocco, where many have little mobile data and cannot pay a subscription. Free forever, works in airplane mode, and the language of the definitions is chosen independently of the interface language (e.g. English learned with Arabic definitions). 14 destinations along Ibn Battuta's 1325 route, 24 lessons each: 336 lessons, 2,688 words. Teenagers and adults, no mature content (4+).

3. ACCESS: no credentials, no demo account, no sample file, nothing to configure. Interface is French and Arabic only, by design for that audience.
- First launch: "Où va ta rihla ?" - tap a destination.
- Tab "Carte": itinerary; "Commencer" starts a lesson (cards flip on tap, speaker icon speaks the word, turtle icon speaks it slowly, then a quiz; 75% correct validates the step). Also the daily challenge and the spaced-repetition notebook (Le Carnet).
- Tab "Apprendre": the 24 steps in 5 levels, and five review games (the last, Le Duel, is two players on one device).
- Tab "Passeport": visa stamps, kilometres, weekly activity.
- Tab "Réglages": interface language, dark mode, language of definitions, daily goal, sounds, optional local reminder, save/restore, erase progress, and the built-in "Guide du voyageur".
Pronunciation uses the system speech synthesizer only; speaker icons are hidden for languages with no voice installed on the device - deliberate, not a bug. Spanish has one on every device; others install from iOS Settings > Accessibility > Spoken Content > Voices.

4. EXTERNAL SERVICES: none. No backend of mine, no data provider, authentication, payment processor, AI service, analytics, crash reporting, ad SDK or CDN. The app requests no remote URL. Apple system frameworks only, through Capacitor 8 (open-source shell compiled in): AVSpeechSynthesis for speech, UserNotifications for the optional reminder (local only, no push server), WKWebView local storage. The app leaves itself only from Settings: "Proposer une amélioration" opens my GitHub issue page in Safari, "Partager le lien" opens the system share sheet. No in-app browser.

5. REGIONS: one binary, identical everywhere - no geolocation, no region gating, no regional content or pricing (free), no server, so nothing can differ by country. All 14 languages are available from first launch; the only device-dependent difference is the installed system voices.

6. NO REGULATED INDUSTRY, NO PROTECTED MATERIAL: no health, financial, gambling, dating or government service (the "chez le médecin" lesson is vocabulary only, no medical advice). Every lesson, word, translation and drawing is my own work; no dictionary or third-party text is reproduced, no trademarks, no licensed IP, no API key. The bundled fonts (SIL Open Font License) are the only third-party component.
```

---

## 9 · Ordre des opérations et validation finale

1. [ ] § 0 — pré-requis (contrat, Transporter)
2. [ ] § 1 — créer l'app
3. [ ] § 2 — App Information, FR puis AR, **y compris le statut DSA** (§ 2.9)
4. [ ] § 3 — classification par âge → 4+
5. [ ] § 4 — confidentialité → « Données non collectées » → **Publier**
6. [ ] § 5.1 — les 7 captures 6,9″
7. [ ] § 5.2 à 5.16 — les champs de la version, FR puis AR
8. [ ] § 7 — `pnpm ios:release`, Transporter, puis sélectionner le build
9. [ ] § 5.11 — informations pour l'examen (⬜ A.1, A.2, A.3)
10. [ ] **Ajouter pour examen** → **Soumettre** (IDFA : Non)
11. [ ] Examen : ~24 à 48 h. Statut « En attente de mise en vente » → tu publies quand tu veux (§ 5.12)

---

## 10 · Pièges connus et parades

| Risque | Parade |
|---|---|
| **Ligne directrice 4.2** (minimum de fonctionnalité) — les apps web encapsulées sont visées | Les notes du § 8 le désamorcent : 100 % hors-ligne, 5 jeux interactifs, progression locale, aucune requête réseau (polices embarquées, vérifié en dézippant le `.ipa`). Si rejet malgré tout : ajouter le retour haptique natif (plugin Capacitor Haptics) et resoumettre |
| **2.1 — App Completeness** : l'examinateur ne trouve pas quoi faire | Les notes donnent le parcours en 4 étapes |
| **Pas de voix TTS sur l'appareil de test** : l'examinateur croit l'audio cassé | Expliqué dans les notes (§ 8) — les boutons son sont masqués quand la voix manque, c'est volontaire |
| **ITMS-90717** (canal alpha dans l'icône) | L'icône source a bien un canal alpha, mais **totalement opaque**, et le catalogue compilé la marque `Opaque: True` — ça passe. Si Apple refuse quand même : réenregistrer `ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png` sans alpha (Aperçu → Exporter, décocher Alpha) |
| **ITMS-91053** (manifeste de confidentialité manquant) — avertissement par e-mail après téléversement | Les frameworks Capacitor et Cordova embarquent déjà le leur ; la cible App n'utilise aucune « required reason API ». Si l'e-mail arrive quand même, ajouter un `PrivacyInfo.xcprivacy` à la cible App avec la raison `CA92.1` (UserDefaults) |
| **ITMS-4238** (build déjà téléversé) — pour les mises à jour | `pnpm version:build` avant `pnpm ios:release` |
| **Fiche retirée de l'UE** | Statut DSA non déclaré (§ 2.9) |

---

## 11 · ⚠️ Le jour où la publicité est activée

La fiche ci-dessus promet « pas de publicité » et déclare « Données non collectées ». Ces deux réponses
deviennent **fausses** dès qu'un fournisseur est branché dans `src/lib/pub.js`. Il faut alors :
refaire le questionnaire de confidentialité (identifiants + données d'usage), passer en statut
**trader** avec adresse publique (§ 2.9), retirer « pas de publicité » des descriptions FR et AR et du
texte promotionnel, ajouter le consentement UMP + ATT, et mettre à jour la page de confidentialité.
Stratégie complète : note « Monétiser Rihla ».

---

## 12 · ⚠️ Le jour où le jeu en ligne entre dans le build iOS

Le serveur (`serveur/`, Worker Cloudflare, `https://rihla-serveur.rihla-serveur.workers.dev`) est
déployé et l'app web (GitHub Pages) le connaît par la variable de dépôt `VITE_RIHLA_SERVEUR`. Le
build iOS ne l'embarque que si la variable est dans `.env` au moment de `pnpm ios:sync`. Le jour où
c'est le cas, la fiche « Données non collectées » devient fausse. À refaire dans § 4 :

| # | Question | Réponse |
|---|---|---|
| 4.2 | Collectez-vous des données ? | **Oui** |
| Type | **Identifiants → ID utilisateur** (l'identifiant tiré au hasard sur l'appareil, `rihla.voyageur`) | Utilisation : *Fonctionnalité de l'app*. Lié à l'identité de l'utilisateur : **Non** (aucun compte). Utilisé pour le suivi : **Non** |
| Type | **Contenu utilisateur → Contenu de jeu** (pseudonyme, scores, temps) | Utilisation : *Fonctionnalité de l'app*. Lié à l'identité : **Non**. Suivi : **Non** |
| 4.3 | URL des choix de confidentialité | Laisser vide — le choix se fait dans l'app (« Réglages → Jeu en ligne ») |

Déjà à jour : la page de confidentialité (`public/confidentialite/index.html`, FR + AR, section
« Le jeu en ligne (facultatif) »), le Guide du voyageur et l'écran de consentement dans l'app.
Rien à changer aux descriptions : « sans compte » reste vrai — une collecte opt-in sous identifiant
aléatoire n'est pas un compte. Les notes pour l'examinateur (§ 8) devront mentionner que le jeu en
ligne est facultatif et testable sans second appareil grâce au Barid (lien collé).

---

## 13 · Rejet « Guideline 2.1 — Information Needed » du 19/09/2026

Soumission `5b6c8f16-e0aa-4e16-9c16-1643b4434942`, build **1.0 (5)**. Ce n'est **pas** un rejet de
fonctionnalité ni de qualité : Apple pose ces six questions à tout compte développeur au passé
d'examen limité. Rien à corriger dans l'app, **rien à redéposer** — une réponse au Centre de
résolution, plus une vidéo, suffisent.

### 13.1 Ce que contient exactement le binaire examiné (vérifié, pas supposé)

Le point décisif : le build 5 a été fabriqué **avant** le travail « en ligne » du 19 septembre.

| Vérification | Résultat |
|---|---|
| **Origine du binaire** (reproduction, 20/09) | `vite build` sur un worktree à `0bd486d` redonne les huit fichiers **octet pour octet** (`index.html`, `sw.js`, `manifest.webmanifest`, les cinq `assets/`), mêmes noms hachés, même inventaire. Le binaire examiné **est** ce commit — Apple peut le refaire |
| Tests à cet état | 17 fichiers, **167 tests verts** (les 222 d'aujourd'hui incluent le Barid et le jeu en ligne) |
| `Barid`, `Course`, `Classement`, `enligne`, `workers.dev` dans le bundle | **absents** — le seul « barid » trouvé est *baridi*, « froid » en swahili |
| Requêtes réseau | deux `fetch(` dans tout le bundle : le préchargeur de modules de Vite (fichiers locaux) et une branche jamais appelée de `@capacitor/core`. **Aucune URL distante n'est demandée** |
| Liens sortants | deux, tous deux dans Réglages : « Proposer une amélioration » (issues GitHub, dans Safari) et « Partager le lien » (feuille de partage système). Aucun navigateur interne |
| URL Wiktionary présentes dans le bundle | ce sont les champs `preuve` des mots voyageurs — **des données, jamais affichées** : aucun composant ne lit `preuve` (seul le test le fait) |

Donc « Données non collectées », « aucun compte », « aucun contenu généré par l'utilisateur » et
« 100 % hors-ligne » sont **exacts pour ce build**. C'est ce qui rend la réponse simple : il n'y a
rien à nuancer.

### 13.2 La marche à suivre

1. **App Store Connect → l'app → Centre de résolution → Répondre** : coller le texte du § 8 et
   **joindre la vidéo** (§ 13.3) — la version recompressée, pas l'originale de 379 Mo.
2. **La version → Informations pour l'examen → Notes** : coller le **même** texte. Les deux champs
   annoncent que ce build vient du commit public `0bd486d` — c'est vérifié par reproduction
   (§ 13.1), donc vérifiable par l'examinateur : autant le dire. Apple le demande
   noir sur blanc, « for reference on future submissions » — et il resservira à chaque mise à jour.
3. Vérifier au passage le **contact d'examen** (§ 5.11.b à d) : nom, téléphone au format `+212…`,
   e-mail. Un contact vide est exactement le genre de détail qui fait durer un 2.1.
4. Si la version affiche encore un bouton **« Soumettre pour examen »** après la réponse, le cliquer.
   Le build reste le **5** : ne pas lancer `pnpm version:build`, ne rien re-téléverser.

### 13.3 L'enregistrement d'écran — le seul morceau que je ne peux pas produire

Apple exige : **appareil physique**, **dernier iOS**, et la vidéo **commence par le lancement de
l'app**. Trois minutes suffisent.

**Avant de filmer**

1. iPhone à jour : Réglages → Général → Mise à jour logicielle.
2. Installer **le build 5 lui-même** par TestFlight (il est déjà traité chez Apple, c'est le binaire
   examiné — aucun dépôt à refaire). Supprimer d'abord une éventuelle copie installée par Xcode :
   la vidéo doit partir d'une installation neuve, pour que « Où va ta rihla ? » apparaisse.
3. Voix espagnole présente : Réglages → Accessibilité → Contenu énoncé → Voix → Espagnol. C'est la
   première destination, et la voix la plus sûrement installée.
4. Sonnerie **non** coupée, volume haut : l'enregistrement capte le son de l'app, et l'examinateur
   doit entendre la prononciation.
5. Micro de l'enregistrement **coupé** (appui long sur le bouton d'enregistrement du Centre de
   contrôle) : pas de commentaire, pas de bruit de pièce.
6. Filmer depuis l'**écran d'accueil iOS**, pas depuis le bouton « Ouvrir » de TestFlight.

> ⚠️ **Ne pas filmer une app construite depuis `main` aujourd'hui.** La branche contient désormais le
> Barid — qui s'affiche même sans serveur, en carte d'accueil et en 6e jeu. La vidéo montrerait des
> fonctions **absentes du binaire examiné**, ce qui est exactement ce qu'un examinateur relève.
> TestFlight donne le bon binaire ; à défaut, bâtir depuis l'état d'alors, sans toucher à `main` :
>
> ```bash
> git worktree add /tmp/rihla-build5 0bd486d
> ```

**Le plan de tournage (~3 min)**

| Temps | À l'écran | Pourquoi |
|---|---|---|
| 0:00 | Centre de contrôle ouvert, **Mode Avion activé** bien visible, puis refermé | une seule image prouve le point 4 : l'app ne parle à personne |
| 0:05 | Écran d'accueil, appui sur l'icône Rihla, lancement à froid | Apple l'exige : « begin with launching the app » |
| 0:12 | « Où va ta rihla ? » → choisir **Grenade (espagnol)** | premier lancement, et une voix qui existe partout |
| 0:25 | Onglet **Carte** : l'itinéraire, les destinations, les km | ce que l'app est, en un coup d'œil |
| 0:35 | « Commencer » → les **8 cartes-mots** (compteur « 1/8 ») : en retourner trois avec « Voir la réponse » / « Suivant », toucher le haut-parleur puis la tortue, enchaîner les cinq autres vite | le cœur de l'app, et le TTS système audible |
| 1:05 | Le quiz : **8 questions**, une par mot, dans l'ordre comprendre → écouter → produire → épeler puis à nouveau (avec des substitutions : lire, voir, dictée). Laisser le bandeau de correction à l'écran | la variété des exercices — l'antidote au soupçon « site web encapsulé » (4.2) |
| 1:35 | Fin d'étape : XP, série, bouton « Étape suivante » | la boucle de progression |
| 1:45 | Onglet **Apprendre**, dans l'ordre réel de l'écran : le carnet de route, les 24 étapes sur 5 niveaux, les mots voyageurs — puis **défiler jusqu'en bas**, les jeux y sont | la profondeur du contenu embarqué |
| 2:05 | Les cinq jeux : 15 s du **Souk**, puis ouvrir **Le Duel** pour montrer la moitié haute pivotée | prouve que le duel est à deux sur un seul téléphone, sans réseau |
| 2:25 | Retour **Carte** : « L'étape du jour » (répondre à deux questions), la carte du Carnet, la barre d'objectif | le rituel quotidien |
| 2:40 | Onglet **Passeport** : tampons de visa, km, semaine d'activité | |
| 2:50 | **Réglages** : Langue de l'interface → العربية (bascule RTL immédiate), retour au français ; Apparence → Nuit ; ouvrir « Guide du voyageur », faire défiler deux sections | FR/AR, mode nuit, et surtout : aucun écran ne demande de compte |

**Après** : Photos → Partager → Enregistrer dans Fichiers, puis joindre dans le Centre de résolution.
Si le téléversement est refusé pour la taille, raccourcir la vidéo (Photos → Modifier → rogner la
durée) plutôt que de la ré-encoder.

### 13.4 La réponse

C'est **le texte du § 8**, tel quel — le Centre de résolution plafonne lui aussi à 4 000 caractères,
donc il n'y a plus qu'un seul texte à maintenir, collé aux deux endroits. La vidéo part en pièce
jointe du même message.

### 13.5 Décision : le jeu en ligne n'entre pas dans la 1.0

Tentant de profiter de la réponse pour déposer un build 6 avec le Barid et La Course. À ne pas faire :

- « Données non collectées » deviendrait **faux** : tout le § 4 serait à refaire (§ 12) ;
- les pseudonymes visibles dans les classements sont du **contenu généré par l'utilisateur** : Apple
  exige alors signalement et blocage (ligne directrice 1.2), et les réponses 3.4 et 3.6 du
  questionnaire d'âge changent ;
- répondre à une demande d'informations **en changeant le binaire au même moment**, avec un compte
  à l'historique limité, c'est rouvrir l'examen à zéro.

La 1.0 reste l'app hors-ligne, telle qu'elle a été examinée. Le Barid, La Course et les classements
sortent en **1.1** — avec `pnpm version:build`, le § 12 appliqué et le § 8 réécrit.
