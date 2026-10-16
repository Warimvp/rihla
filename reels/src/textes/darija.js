// Tous les textes des pubs en darija marocaine (écriture arabe). Un seul endroit à relire / corriger.
// Les lignes sont des tableaux de mots ; { t, accent: true } = mot en safran. L'ordre est celui de la lecture (de droite à gauche).

export const PUB1 = {
  kicker: 'طنجة · 1325',
  // « En 1325, Ibn Battuta quittait Tanger… »
  titre1: [['فسنة', '1325،'], ['ابن', 'بطوطة'], ['خرج', 'من', 'طنجة…']],
  // « Aujourd'hui, c'est à ton tour de voyager. » — « ton tour » en safran
  titre2: [['اليوم،'], ['جا', { t: 'الدور', accent: true }, { t: 'ديالك', accent: true }], ['باش', 'تسافر.']],
  pastilleDestination: 'ختار وجهتك',
  pastilleEtapes: 'تعلّم، مرحلة بمرحلة',
  pastilleExercices: 'تمارين متنوعة',
  mer: 'البحر الأبيض المتوسط',
  villes: { tanger: 'طنجة', grenade: 'غرناطة', venise: 'البندقية', istanbul: 'إسطنبول', caire: 'القاهرة', sarai: 'ساراي', ispahan: 'أصفهان', delhi: 'دلهي', mombasa: 'مومباسا', tokyo: 'طوكيو' },
  // « 15 langues. Un monde à découvrir. »
  final: [['15', 'لغة.'], ['عالم', 'كامل'], ['باش', 'تكتاشفو.']],
}

export const PUB4 = {
  // « Pas de Wi-Fi ? Aucun problème. » — « problème » en safran
  titre: [['ماكاينش', 'الويفي؟'], ['ماكاين', { t: 'مشكل.', accent: true }]],
  modeAvion: 'وضع الطيران',
  pastilleSansReseau: 'الدروس والألعاب والمراجعة، بلا نيت',
  pastilleCapture: 'لقطة من التطبيق، النيت مقطوع',
  // « Gratuit. Sans abonnement. Hors ligne. »
  final: [['بلاش.'], ['بلا', 'اشتراك.'], ['كيخدم', 'بلا', 'نيت.']],
}

export const COMMUN = {
  marque: 'MaRihla',
  badgePetit: 'كاين فـ',
  badgeGrand: 'App Store',
  uneApp: 'تطبيق من',
  mentionPhotos: 'صور المدن فالتطبيق : Wikimedia Commons، والمؤلفون والرخص مذكورين فالتطبيق.',
}
