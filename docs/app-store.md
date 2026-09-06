# Dossier App Store — Rihla

Tout ce qu'il faut copier-coller dans App Store Connect. Le `.ipa` signé est produit par :
`pnpm ios:sync` → `xcodebuild archive` → `xcodebuild -exportArchive` (voir `ios/ExportOptions.plist`) → `ios/build/export/App.ipa`.

## Fiche

| Champ | Valeur |
|---|---|
| Nom | **Rihla — les langues du monde** (si « Rihla » seul est pris) |
| Sous-titre (30 c. max) | `Apprends en voyageant. Gratuit.` |
| Bundle ID | `ma.rihla.app` |
| SKU | `rihla-001` |
| Catégorie | Éducation (secondaire : Voyages) |
| Prix | Gratuit — aucun achat intégré |
| Classification d'âge | 4+ (aucun contenu sensible) |
| URL de confidentialité | `https://warimvp.github.io/rihla/confidentialite/` |
| URL d'assistance | `https://github.com/Warimvp/rihla` |
| Copyright | © 2026 Yassir Legmara |

## Description (FR)

> En 1325, Ibn Battuta quittait Tanger pour le plus grand voyage de son siècle. Rihla (« le voyage ») te fait reprendre sa route : 14 langues, 14 destinations, un passeport à tamponner.
>
> **14 LANGUES DU MONDE** — arabe, espagnol, portugais, italien, allemand, anglais, turc, russe, persan, swahili, hindi, mandarin, coréen, japonais : de Grenade à Tokyo, chaque langue est une destination sur ta carte. Et tu choisis la langue de tes définitions : apprends l'anglais avec des sens en arabe, ou l'arabe avec des sens en français.
>
> **TROIS NIVEAUX PAR DESTINATION** — Survie (les mots), Conversation (faire connaissance, se débrouiller) et Récits (à l'hôtel, chez le médecin, au téléphone). Cartes-mots avec prononciation, puis des exercices variés : compréhension, écoute pure, production, épellation. Valide tes 12 étapes et décroche le visa de la ville.
>
> **5 JEUX POUR RÉVISER** — le memory Zellige, le Souk chrono, la Caravane d'épellation, l'Oreille (compréhension orale) et le Duel à deux sur un seul téléphone.
>
> **L'ÉTAPE DU JOUR** — un défi quotidien qui mélange toutes les langues, le même pour tous les voyageurs.
>
> **LE CARNET** — la révision espacée : les mots reviennent juste avant que tu les oublies (1, 2, 4, 8, 16 jours).
>
> **TON RYTHME** — choisis ton cap (une langue précise ou la route d'Ibn Battuta), ton objectif quotidien, et un rappel à l'heure qui t'arrange. Sauvegarde ton voyage quand tu veux : il est à toi.
>
> **GRATUIT, POUR TOUJOURS** — pas de compte, pas de publicité, pas d'abonnement, aucune collecte de données. Tout fonctionne hors-ligne, en avion comme au fond du Rif.
>
> Interface en français et en arabe (avec affichage RTL complet). Mode nuit « Nuit d'encre ».
>
> Fait au Maroc, avec l'amour du voyage. Le code est ouvert : github.com/Warimvp/rihla

## Description (AR)

> سنة 1325 غادر ابن بطوطة طنجة في أعظم رحلة في قرنه. «رحلة» تعيدك إلى دربه: 14 لغة، 14 وجهة، وجواز سفر تملؤه الأختام.
>
> • 14 لغة من العالم: العربية، الإسبانية، البرتغالية، الإيطالية، الألمانية، الإنجليزية، التركية، الروسية، الفارسية، السواحلية، الهندية، الصينية، الكورية، اليابانية — وتختار أنت لغة الشرح (تعلّم الإنجليزية بشرح عربي، أو العربية بشرح فرنسي).
> • ثلاثة مستويات لكل وجهة: البقاء، المحادثة، الحكايات. بطاقات كلمات مع النطق ثم تمارين متنوعة. أكمل 12 مرحلة واحصل على تأشيرة المدينة.
> • 5 ألعاب للمراجعة، ومرحلة اليوم، ودفتر المراجعة المتباعدة.
> • مجاني إلى الأبد: بلا حساب، بلا إعلانات، بلا جمع للبيانات — ويعمل بدون أنترنت.
>
> واجهة بالفرنسية والعربية. صُنع في المغرب بحب السفر.

## Mots-clés (100 c. max)

`langues,apprendre,arabe,vocabulaire,espagnol,turc,japonais,russe,voyage,gratuit,hors-ligne,maroc`

## Nouveautés v1.0

> Premier départ de Tanger : 14 langues, 1 344 mots et phrases sur 3 niveaux, 5 jeux, l'étape du jour, le carnet de révision espacée, l'objectif quotidien, le rappel, la sauvegarde du voyage, mode nuit, langue des définitions au choix, FR/AR.

## Questionnaire « Confidentialité de l'app »

Réponse unique : **« Données non collectées »** (Data Not Collected) — aucune donnée n'est collectée, l'app n'a ni compte, ni analytique, ni pub, ni serveur. → donne le badge « Données non collectées » sur la fiche.

## Captures d'écran (obligatoires)

- Taille requise : **6,9″ — 1320 × 2868 px** (iPhone 16/17 Pro Max ; le simulateur les produit à la bonne taille).
- Jeu conseillé (5-6 captures, mode clair + 1-2 en nuit) : l'écran « Où va ta rihla ? », l'Itinéraire, une carte-mot, le Souk, le Passeport (semaine + visas), le Duel, l'Accueil en mode nuit.
- L'iPad n'est pas obligatoire si l'app est déclarée iPhone uniquement.

## ⚠️ Le jour où la publicité est activée

La fiche ci-dessus promet « pas de publicité » et « Données non collectées ». Ces deux
réponses deviennent FAUSSES dès qu'un fournisseur de pub est branché (`src/lib/pub.js`) :
il faut alors refaire le questionnaire de confidentialité (identifiants + données d'usage),
retirer la mention « pas de publicité » de la description FR et AR, et mettre à jour la
page de confidentialité. Voir la note de stratégie « Monétiser Rihla ».

## Checklist de soumission

1. [ ] appstoreconnect.apple.com → Mes apps → « + » → Nouvelle app (iOS, nom, `ma.rihla.app`, SKU, français principal)
2. [ ] Coller description/mots-clés/URLs ci-dessus (+ localisation arabe)
3. [ ] Téléverser `ios/build/export/App.ipa` via l'app **Transporter** (Mac App Store, gratuite) ou Xcode → Organizer
4. [ ] Ajouter les captures 6,9″
5. [ ] Questionnaire confidentialité : « Données non collectées » · Classification 4+
6. [ ] « Soumettre pour examen » (examen : ~24-48 h)

## Rejet possible & parade

Ligne directrice **4.2 (minimum de fonctionnalité)** : certaines apps web-encapsulées sont refusées. Arguments Rihla : 100 % hors-ligne, jeux interactifs, progression locale, aucun contenu distant. Si rejet malgré tout : ajouter le retour haptique natif (plugin Capacitor Haptics) et resoumettre avec une note d'examen expliquant le fonctionnement hors-ligne.
