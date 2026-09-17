// Les mots voyageurs : partis de l'arabe, arrivés jusqu'à une destination de
// la route — directement, ou par d'autres langues (le persan pour le hindi,
// l'Europe pour l'Asie de l'Est).
//
// Règle d'or : AUCUN mot sans preuve. Chaque étymologie a été vérifiée sur
// Wiktionary (lien dans `preuve`). Un emprunt douteux n'entre pas, ni un
// « pseudo-arabisme » : शुक्रिया (merci, en hindi) est forgé en indo-aryen sur
// شكر, il n'est pas venu de l'arabe — il n'est pas ici.
//
// Champs :
// - t      : le mot dans la langue de la destination ;
// - r      : sa romanisation, pour les écritures non latines (style de langues.js) ;
// - arabe  : l'étymon, sans voyelles brèves ; arabeR : sa translittération ;
// - fr, ar : le sens ;
// - chemin : les langues traversées entre l'arabe et la destination (ids de
//            `t.voyageurs.langues`), absent si l'emprunt est direct ;
// - preuve : la page Wiktionary qui l'atteste.

export const DEPART = 'ar'

const W = 'https://en.wiktionary.org/wiki/'

export const VOYAGEURS = {
  es: [
    { t: 'aceite', arabe: 'الزيت', arabeR: 'az-zayt', fr: 'l’huile', ar: 'الزيت', preuve: `${W}aceite#Spanish` },
    { t: 'azúcar', arabe: 'سكر', arabeR: 'soukkar', fr: 'le sucre', ar: 'سكر', preuve: `${W}azúcar#Spanish` },
    { t: 'almohada', arabe: 'مخدة', arabeR: 'mikhadda', fr: 'l’oreiller', ar: 'مخدة', preuve: `${W}almohada#Spanish` },
    { t: 'alcalde', arabe: 'القاضي', arabeR: 'al-qâdî', fr: 'le maire (en arabe : le juge)', ar: 'رئيس البلدية (بالعربية: القاضي)', preuve: `${W}alcalde#Spanish` },
    // Wiktionary hésite entre « wa-šāʾa llāh » et « law šāʾa llāh » : on
    // n'écrit que ce que les deux formules ont en commun.
    { t: 'ojalá', arabe: 'شاء الله', arabeR: 'châ’a llâh', fr: 'pourvu que (« si Dieu le veut »)', ar: 'إن شاء الله', preuve: `${W}ojalá#Spanish` },
  ],
  pt: [
    { t: 'azeite', arabe: 'زيت', arabeR: 'zayt', fr: 'l’huile', ar: 'زيت', preuve: `${W}azeite#Portuguese` },
    { t: 'açúcar', arabe: 'السكر', arabeR: 'as-soukkar', fr: 'le sucre', ar: 'السكر', preuve: `${W}açúcar#Portuguese` },
    { t: 'alface', arabe: 'الخس', arabeR: 'al-khass', fr: 'la laitue', ar: 'الخس', preuve: `${W}alface#Portuguese` },
    { t: 'almofada', arabe: 'المخدة', arabeR: 'al-mikhadda', fr: 'le coussin', ar: 'المخدة', preuve: `${W}almofada#Portuguese` },
    { t: 'armazém', arabe: 'المخزن', arabeR: 'al-makhzan', fr: 'l’entrepôt', ar: 'المخزن', preuve: `${W}armazém#Portuguese` },
    { t: 'oxalá', arabe: 'شاء الله', arabeR: 'châ’a llâh', fr: 'pourvu que (« si Dieu le veut »)', ar: 'إن شاء الله', chemin: ['es'], preuve: `${W}oxalá#Portuguese` },
  ],
  it: [
    { t: 'zucchero', arabe: 'سكر', arabeR: 'soukkar', fr: 'le sucre', ar: 'سكر', preuve: `${W}zucchero#Italian` },
    { t: 'magazzino', arabe: 'مخازن', arabeR: 'makhâzin', fr: 'l’entrepôt (en arabe : les entrepôts)', ar: 'مخزن', preuve: `${W}magazzino#Italian` },
    { t: 'cotone', arabe: 'قطن', arabeR: 'qoutoun', fr: 'le coton', ar: 'قطن', preuve: `${W}cotone#Italian` },
    { t: 'zero', arabe: 'صفر', arabeR: 'sifr', fr: 'zéro (en arabe : rien)', ar: 'صفر', chemin: ['la'], preuve: `${W}zero#Italian` },
    { t: 'tariffa', arabe: 'تعرفة', arabeR: 'ta’rifa', fr: 'le tarif', ar: 'تعرفة', preuve: `${W}tariffa#Italian` },
  ],
  de: [
    { t: 'Kaffee', arabe: 'قهوة', arabeR: 'qahwa', fr: 'le café', ar: 'قهوة', chemin: ['ota', 'it', 'fr'], preuve: `${W}Kaffee#German` },
    { t: 'Zucker', arabe: 'سكر', arabeR: 'soukkar', fr: 'le sucre', ar: 'سكر', chemin: ['it'], preuve: `${W}Zucker#German` },
    { t: 'Matratze', arabe: 'مطرح', arabeR: 'matrah', fr: 'le matelas', ar: 'مرتبة', chemin: ['fr'], preuve: `${W}Matratze#German` },
    { t: 'Alkohol', arabe: 'الكحل', arabeR: 'al-kohl', fr: 'l’alcool (en arabe : le khôl)', ar: 'الكحول (بالعربية: الكحل)', chemin: ['la'], preuve: `${W}Alkohol#German` },
    { t: 'Algebra', arabe: 'الجبر', arabeR: 'al-jabr', fr: 'l’algèbre', ar: 'الجبر', chemin: ['la'], preuve: `${W}Algebra#German` },
  ],
  en: [
    { t: 'coffee', arabe: 'قهوة', arabeR: 'qahwa', fr: 'le café', ar: 'قهوة', chemin: ['ota', 'it', 'nl'], preuve: `${W}coffee#English` },
    { t: 'sugar', arabe: 'سكر', arabeR: 'soukkar', fr: 'le sucre', ar: 'سكر', chemin: ['it', 'fr'], preuve: `${W}sugar#English` },
    { t: 'cotton', arabe: 'قطن', arabeR: 'qoutoun', fr: 'le coton', ar: 'قطن', chemin: ['it', 'fr'], preuve: `${W}cotton#English` },
    // Le relais avant le français (Ibérie musulmane ou turc) n'est pas tranché :
    // seul le français, attesté, est nommé.
    { t: 'sofa', arabe: 'صفة', arabeR: 'souffa', fr: 'le canapé (en arabe : une banquette)', ar: 'أريكة', chemin: ['fr'], preuve: `${W}sofa#English` },
    { t: 'giraffe', arabe: 'زرافة', arabeR: 'zourâfa', fr: 'la girafe', ar: 'زرافة', chemin: ['it', 'fr'], preuve: `${W}giraffe#English` },
  ],
  tr: [
    { t: 'merhaba', arabe: 'مرحبا', arabeR: 'marhaban', fr: 'bonjour', ar: 'مرحبا', preuve: `${W}merhaba` },
    { t: 'kitap', arabe: 'كتاب', arabeR: 'kitâb', fr: 'le livre', ar: 'كتاب', preuve: `${W}kitap` },
    { t: 'kalem', arabe: 'قلم', arabeR: 'qalam', fr: 'le stylo', ar: 'قلم', chemin: ['fa'], preuve: `${W}kalem` },
    { t: 'saat', arabe: 'ساعة', arabeR: 'sâ’a', fr: 'l’heure, la montre', ar: 'ساعة', preuve: `${W}saat` },
    { t: 'dünya', arabe: 'دنيا', arabeR: 'dounyâ', fr: 'le monde', ar: 'العالم', preuve: `${W}dünya` },
    { t: 'hayat', arabe: 'حياة', arabeR: 'hayât', fr: 'la vie', ar: 'حياة', preuve: `${W}hayat` },
  ],
  fa: [
    { t: 'کتاب', r: 'ketâb', arabe: 'كتاب', arabeR: 'kitâb', fr: 'le livre', ar: 'كتاب', preuve: `${W}کتاب` },
    { t: 'قلم', r: 'ghalam', arabe: 'قلم', arabeR: 'qalam', fr: 'le stylo', ar: 'قلم', preuve: `${W}قلم` },
    { t: 'ساعت', r: 'sâ’at', arabe: 'ساعة', arabeR: 'sâ’a', fr: 'l’heure, la montre', ar: 'ساعة', preuve: `${W}ساعت` },
    { t: 'دنیا', r: 'donyâ', arabe: 'دنيا', arabeR: 'dounyâ', fr: 'le monde', ar: 'العالم', preuve: `${W}دنیا` },
    { t: 'مدرسه', r: 'madrésé', arabe: 'مدرسة', arabeR: 'madrasa', fr: 'l’école', ar: 'مدرسة', preuve: `${W}مدرسه` },
    { t: 'فکر', r: 'fekr', arabe: 'فكر', arabeR: 'fikr', fr: 'la pensée', ar: 'فكر', preuve: `${W}فکر` },
  ],
  sw: [
    { t: 'safari', arabe: 'سفر', arabeR: 'safar', fr: 'le voyage', ar: 'سفر', preuve: `${W}safari` },
    { t: 'habari', arabe: 'خبر', arabeR: 'khabar', fr: 'les nouvelles', ar: 'الأخبار', preuve: `${W}habari` },
    { t: 'kitabu', arabe: 'كتاب', arabeR: 'kitâb', fr: 'le livre', ar: 'كتاب', preuve: `${W}kitabu` },
    { t: 'rafiki', arabe: 'رفيق', arabeR: 'rafîq', fr: 'l’ami', ar: 'صديق', preuve: `${W}rafiki` },
    { t: 'dunia', arabe: 'دنيا', arabeR: 'dounyâ', fr: 'le monde', ar: 'العالم', preuve: `${W}dunia` },
    { t: 'saa', arabe: 'ساعة', arabeR: 'sâ’a', fr: 'l’heure', ar: 'ساعة', preuve: `${W}saa` },
  ],
  hi: [
    { t: 'किताब', r: 'kitâb', arabe: 'كتاب', arabeR: 'kitâb', fr: 'le livre', ar: 'كتاب', chemin: ['fa'], preuve: `${W}किताब` },
    { t: 'दुनिया', r: 'douniyâ', arabe: 'دنيا', arabeR: 'dounyâ', fr: 'le monde', ar: 'العالم', chemin: ['fa'], preuve: `${W}दुनिया` },
    { t: 'वक़्त', r: 'vaqt', arabe: 'وقت', arabeR: 'waqt', fr: 'le temps', ar: 'وقت', chemin: ['fa'], preuve: `${W}वक़्त` },
    { t: 'ख़बर', r: 'khabar', arabe: 'خبر', arabeR: 'khabar', fr: 'la nouvelle', ar: 'خبر', chemin: ['fa'], preuve: `${W}ख़बर` },
    { t: 'क़लम', r: 'qalam', arabe: 'قلم', arabeR: 'qalam', fr: 'le stylo', ar: 'قلم', chemin: ['fa'], preuve: `${W}क़लम` },
  ],
  // Au bout de la route, les mots ne sont arrivés qu'après une longue chaîne
  // européenne dont un maillon au moins n'est pas nommé par Wiktionary : on
  // dit « par l'Europe », pas davantage. Les « canapés » (沙发, 소파, ソファー),
  // où le passage de l'arabe au français n'est pas attesté, ne sont pas ici.
  ru: [
    { t: 'магазин', r: 'magazin', arabe: 'مخازن', arabeR: 'makhâzin', fr: 'le magasin (en arabe : les entrepôts)', ar: 'متجر', chemin: ['europe'], preuve: `${W}магазин` },
    { t: 'кофе', r: 'kofié', arabe: 'قهوة', arabeR: 'qahwa', fr: 'le café', ar: 'قهوة', chemin: ['europe'], preuve: `${W}кофе` },
    { t: 'жираф', r: 'jiraf', arabe: 'زرافة', arabeR: 'zourâfa', fr: 'la girafe', ar: 'زرافة', chemin: ['europe'], preuve: `${W}жираф` },
    { t: 'алгебра', r: 'alguiébra', arabe: 'الجبر', arabeR: 'al-jabr', fr: 'l’algèbre', ar: 'الجبر', chemin: ['europe'], preuve: `${W}алгебра` },
  ],
  zh: [
    { t: '咖啡', r: 'kāfēi', arabe: 'قهوة', arabeR: 'qahwa', fr: 'le café', ar: 'قهوة', chemin: ['europe'], preuve: `${W}咖啡` },
  ],
  ko: [
    { t: '커피', r: 'kŏpi', arabe: 'قهوة', arabeR: 'qahwa', fr: 'le café', ar: 'قهوة', chemin: ['europe'], preuve: `${W}커피` },
    { t: '시럽', r: 'sirŏp', arabe: 'شراب', arabeR: 'charâb', fr: 'le sirop (en arabe : la boisson)', ar: 'شراب', chemin: ['europe'], preuve: `${W}시럽` },
  ],
  ja: [
    { t: 'コーヒー', r: 'kôhî', arabe: 'قهوة', arabeR: 'qahwa', fr: 'le café', ar: 'قهوة', chemin: ['europe'], preuve: `${W}コーヒー` },
    { t: 'アルコール', r: 'aroukôrou', arabe: 'الكحل', arabeR: 'al-kohl', fr: 'l’alcool (en arabe : le khôl)', ar: 'الكحول (بالعربية: الكحل)', chemin: ['europe'], preuve: `${W}アルコール` },
    { t: 'シロップ', r: 'shiroppou', arabe: 'شراب', arabeR: 'charâb', fr: 'le sirop (en arabe : la boisson)', ar: 'شراب', chemin: ['europe'], preuve: `${W}シロップ` },
  ],
}

export const motsVoyageurs = (langueId) => VOYAGEURS[langueId] ?? []

export const totalVoyageurs = () => Object.values(VOYAGEURS).reduce((n, mots) => n + mots.length, 0)
