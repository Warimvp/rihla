# Fiche Google Play — Rihla

Textes à coller dans la Play Console (« Présence sur le Store → Fiche principale »), dans l'ordre de la page.
Les limites de Google : **titre 30**, **description courte 80**, **description complète 4 000** caractères.
`src/lib/fiche-google-play.test.js` LIT ce fichier : il refuse un dépassement ET un chiffre qui ne colle pas
au code (nombre de destinations, d'étapes, de mots). Pour les modifier, ne changer que les blocs ci-dessous.

- Langue par défaut : **français (France) – fr-FR** ; traductions **العربية (ar)** et **English (en-US)**.
- Catégorie : **Éducation** (Enseignement). Application, **gratuite** (irréversible : Google ne permet pas de repasser une application gratuite en payante).
- Coordonnées : e-mail `contact@legantis.net` · site `https://warimvp.github.io/rihla/` · téléphone `+212 6 72 75 90 97` (celui de la société, publié sur legantis.net).
- Politique de confidentialité : `https://warimvp.github.io/rihla/confidentialite/` (FR + AR, en ligne).
- Visuels : voir `docs/google-play.md` § 5 (`pnpm android:icones` pour l'icône 512, `node scripts/captures-google-play.mjs` puis `node scripts/presentation-google-play.mjs` pour le reste).
- ⚠️ Les textes arabes et anglais sont des adaptations des textes de la fiche App Store : **à faire relire par un lecteur natif** avant la mise en production.

---

## Français (fr-FR)

### Titre

```
Rihla — les langues du monde
```

### Description courte

```
Apprends 15 langues sur la route d'Ibn Battuta. Hors ligne, sans compte.
```

### Description complète

```
En 1325, Ibn Battuta quittait Tanger pour le plus grand voyage de son siècle. Rihla (« le voyage ») te fait reprendre sa route : 15 langues, 15 destinations, un passeport à tamponner.

Apprends d'étape en étape
Chaque destination compte 24 étapes de 8 mots, réparties en 5 niveaux : Survie, Conversation, Récits, Le quotidien et Nuances. Tu retournes des cartes-mots, tu écoutes la prononciation (la synthèse vocale de ton téléphone, selon les voix installées), puis tu réponds à des questions variées : comprendre, écouter, épeler, lire l'écriture, remettre une phrase dans l'ordre, retrouver un mot d'après une image. À 75 % de bonnes réponses, l'étape est validée ; les 24 validées, tu décroches le visa de la ville.

Les langues du voyage
Espagnol, portugais, français, italien, allemand, anglais, turc, arabe, russe, persan, swahili, hindi, mandarin, coréen, japonais : de Grenade à Tokyo, chaque langue est une destination sur ta carte. Tu choisis la langue de tes définitions : l'anglais expliqué en arabe, ou l'arabe expliqué en français.

Pour réviser
• Cinq jeux : le memory Zellige, le Souk chrono, la Caravane d'épellation, l'Oreille et le Duel à deux sur un seul téléphone.
• L'étape du jour : dix questions qui mélangent toutes les langues, les mêmes pour tous les voyageurs.
• Le Carnet : la révision espacée. Chaque étape validée y verse ses mots, qui reviennent juste avant que tu les oublies.
• Les mots voyageurs : sucre, café, coton, zéro, algèbre… les mots partis de l'arabe et arrivés dans chaque langue.
• Le Barid : défie un ami par message ; il joue les mêmes dix questions et riposte.

À ton rythme
Choisis ton cap (une langue précise, ou la route d'Ibn Battuta), ton objectif quotidien et, si tu le veux, un rappel à l'heure qui t'arrange. Une nuit de caravansérail protège ta série quand la journée a été trop courte. Sauvegarde ton voyage quand tu veux : il est à toi.

Sans compte, sans publicité, sans abonnement
Rihla est gratuite : pas de compte, pas de publicité, pas d'abonnement, pas de vies à attendre. Tout fonctionne hors ligne, dans le bus comme au fond du Rif. L'application ne collecte aucune donnée et n'a même pas l'autorisation d'accéder à Internet.

Interface en français et en arabe (écriture de droite à gauche comprise), mode nuit, guide du voyageur intégré.

Fait au Maroc, avec l'amour du voyage. Le code est ouvert : github.com/Warimvp/rihla
```

---

## العربية (ar)

### Titre

```
رحلة — لغات العالم
```

### Description courte

```
تعلّم 15 لغة على طريق ابن بطوطة. بلا إنترنت وبلا حساب.
```

### Description complète

```
سنة 1325 غادر ابن بطوطة طنجة في أعظم رحلة في قرنه. «رحلة» تعيدك إلى دربه: 15 لغة، 15 وجهة، وجواز سفر تملؤه الأختام.

تعلّم مرحلة بعد مرحلة
في كل وجهة 24 مرحلة من 8 كلمات، موزّعة على 5 مستويات: البقاء، المحادثة، الحكايات، الحياة اليومية، والفروق. تقلب بطاقات الكلمات، وتستمع إلى النطق (صوت هاتفك، بحسب الأصوات المثبّتة)، ثم تجيب عن أسئلة متنوعة: الفهم، الاستماع، التهجئة، قراءة الخط، ترتيب الجملة، والتعرّف على الكلمة من صورة. عند 75٪ من الإجابات الصحيحة تُعتمد المرحلة؛ وإذا أكملت المراحل الأربع والعشرين حصلت على تأشيرة المدينة.

لغات الرحلة
الإسبانية، البرتغالية، الفرنسية، الإيطالية، الألمانية، الإنجليزية، التركية، العربية، الروسية، الفارسية، السواحلية، الهندية، الصينية، الكورية، اليابانية — من غرناطة إلى طوكيو، كل لغة وجهة على خريطتك. وتختار أنت لغة الشرح: تعلّم الإنجليزية بشرح عربي، أو العربية بشرح فرنسي.

للمراجعة
• خمس ألعاب: زليج الأزواج، السوق بالمؤقّت، القافلة للتهجئة، الأذن للاستماع الخالص، والمبارزة بين لاعبين على هاتف واحد.
• مرحلة اليوم: عشرة أسئلة تمزج كل اللغات، واحدة للجميع.
• الدفتر: مراجعة متباعدة — كل مرحلة تُنجزها تودع كلماتها فيه، فتعود إليك قبل أن تنساها.
• الكلمات المسافرة: السكر، القهوة، القطن، الصفر، الجبر… كلمات خرجت من العربية ووصلت إلى كل لغة.
• البريد: تحدَّ صديقاً برسالة؛ يلعب الأسئلة العشرة نفسها ويردّ.

على إيقاعك
اختر وجهتك (لغة بعينها أو طريق ابن بطوطة)، وهدفك اليومي، وتذكيراً في الساعة التي تناسبك إن شئت. وليلة في الخان تحمي سلسلتك حين يقصر اليوم. واحفظ رحلتك متى شئت: هي ملكك.

بلا حساب، بلا إعلانات، بلا اشتراك
«رحلة» مجانية: بلا حساب، بلا إعلانات، بلا اشتراك، بلا قلوب تنتظرها. كل شيء يشتغل بدون إنترنت، في الحافلة كما في أعماق الريف. لا يجمع التطبيق أي بيانات، ولا يملك حتى إذن الوصول إلى الإنترنت.

الواجهة بالفرنسية والعربية مع دعم كامل للكتابة من اليمين إلى اليسار، ووضع ليلي، ودليل المسافر داخل التطبيق.

صُنع في المغرب بحب السفر. الشيفرة مفتوحة: github.com/Warimvp/rihla
```

---

## English (en-US)

### Titre

```
Rihla: languages of the world
```

### Description courte

```
Learn 15 languages along Ibn Battuta's road. Works offline, no account.
```

### Description complète

```
In 1325, Ibn Battuta left Tangier on the greatest journey of his century. Rihla ("the journey") takes you back onto his road: 15 languages, 15 destinations, one passport to stamp.

Learn step by step
Every destination has 24 steps of 8 words, grouped into 5 levels: Survival, Conversation, Stories, Everyday life and Nuances. You flip word cards, listen to the pronunciation (your phone's text-to-speech, depending on the voices installed), then answer varied questions: understand, listen, spell, read the script, put a sentence back in order, find a word from a picture. At 75% correct the step is validated; validate all 24 and you earn the city's visa.

The languages of the journey
Spanish, Portuguese, French, Italian, German, English, Turkish, Arabic, Russian, Persian, Swahili, Hindi, Mandarin, Korean, Japanese: from Granada to Tokyo, every language is a destination on your map. You choose the language of the definitions: English explained in Arabic, or Arabic explained in French.

To review
• Five games: the Zellige memory, the timed Souk, the spelling Caravan, the Ear, and the Duel for two on one phone.
• The step of the day: ten questions that mix every language, the same for every traveller.
• The Notebook: spaced repetition. Each validated step drops its words in, and they come back just before you forget them.
• Travelling words: sugar, coffee, cotton, zero, algebra... the words that left Arabic and arrived in each language.
• The Barid: challenge a friend by message; they play the same ten questions and reply.

At your own pace
Pick your heading (one language, or Ibn Battuta's road), your daily goal and, if you like, a reminder at a time that suits you. A caravanserai night protects your streak when the day was too short. Back up your journey whenever you want: it is yours.

No account, no ads, no subscription
Rihla is free: no account, no ads, no subscription, no lives to wait for. Everything works offline, on the bus as in the depths of the Rif. The app collects no data and does not even have permission to access the Internet.

Interface in French and Arabic (full right-to-left support), night mode, built-in traveller's guide.

Made in Morocco, with a love of travel. The code is open: github.com/Warimvp/rihla
```
