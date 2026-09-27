// Les crédits des photos des villes : auteur, licence, source — des données
// pures, lisibles par l'app (src/data/photos.js) comme par le script qui
// fabrique les fichiers (scripts/photos.mjs).
//
// AUCUNE photo sans crédit : la plupart de ces licences (CC BY, CC BY-SA)
// exigent de nommer l'auteur, la licence, la source, et de dire que l'image a
// été modifiée. Les photos restent sous LEUR licence — pas sous celle du code.

export const COMMONS = 'https://commons.wikimedia.org/wiki/File:'

export const LICENCES = {
  'CC0': 'https://creativecommons.org/publicdomain/zero/1.0/',
  'Domaine public': 'https://creativecommons.org/publicdomain/mark/1.0/',
  'CC BY 3.0': 'https://creativecommons.org/licenses/by/3.0/',
  'CC BY-SA 2.0': 'https://creativecommons.org/licenses/by-sa/2.0/',
  'CC BY-SA 3.0': 'https://creativecommons.org/licenses/by-sa/3.0/',
  'CC BY-SA 4.0': 'https://creativecommons.org/licenses/by-sa/4.0/',
}

// `fichier` : le nom exact sur Wikimedia Commons (la source). `cadrage` : le
// point de l'image à garder au centre quand elle est rognée (object-position).
export const CREDITS = {
  es: {
    fichier: 'Granada_-_View_from_Mirador_de_San_Nicolás_-_02.jpg',
    auteur: 'Diego Delso',
    licence: 'CC BY-SA 4.0',
    fr: 'L’Alhambra et la Sierra Nevada',
    ar: 'قصر الحمراء وجبال سييرا نيفادا',
  },
  pt: {
    fichier: 'Lisbon_Torre_de_Belém_BW_2018-10-03_16-35-39.jpg',
    auteur: 'Berthold Werner',
    licence: 'CC BY-SA 4.0',
    // La tour est haute : on garde son sommet.
    cadrage: '50% 18%',
    fr: 'La tour de Belém',
    ar: 'برج بيليم',
  },
  fr: {
    fichier: 'Notre-Dame_de_Paris_and_Île_de_la_Cité_at_dusk_140516_1.jpg',
    auteur: 'DXR',
    licence: 'CC BY-SA 3.0',
    fr: 'Notre-Dame et l’île de la Cité, au crépuscule',
    ar: 'كاتدرائية نوتردام وجزيرة المدينة عند الغسق',
  },
  it: {
    fichier: "Saint_Mark's_Campanile_and_Palazzo_Ducale,_Venice,_September_2017_-2.jpg",
    auteur: 'Martin Falbisoner',
    licence: 'CC BY-SA 4.0',
    fr: 'Le campanile de Saint-Marc et le palais des Doges',
    ar: 'برج أجراس القديس مرقس وقصر الدوق',
  },
  de: {
    fichier: 'Wien,_Stephansdom,_Blick_vom_Südturm_--_2018_--_3271-3.jpg',
    auteur: 'Dietmar Rabich',
    licence: 'CC BY-SA 4.0',
    fr: 'Vienne, vue de la tour de Stephansdom',
    ar: 'فيينا من برج كاتدرائية القديس ستيفان',
  },
  en: {
    fichier: 'Big_Ben_at_sunset_-_2014-10-27_17-30.jpg',
    auteur: 'Colin',
    licence: 'CC BY-SA 4.0',
    fr: 'La tour de l’horloge, au coucher du soleil',
    ar: 'برج الساعة عند غروب الشمس',
  },
  tr: {
    fichier: 'Hagia_Sophia_Mars_2013.jpg',
    auteur: 'Arild Vågen',
    licence: 'CC BY-SA 3.0',
    cadrage: '50% 36%',
    fr: 'Sainte-Sophie',
    ar: 'آيا صوفيا',
  },
  ar: {
    fichier: 'All_Gizah_Pyramids.jpg',
    auteur: 'Ricardo Liberato',
    licence: 'CC BY-SA 2.0',
    fr: 'Les pyramides de Gizeh',
    ar: 'أهرامات الجيزة',
  },
  // Saraï a été rasée en 1395 : il n'en reste rien à photographier. Elle
  // s'élevait sur l'Akhtouba, un bras de la Volga — c'est lui qu'on montre.
  ru: {
    fichier: 'Achtuba.JPG',
    auteur: 'High Contrast',
    licence: 'CC BY 3.0',
    fr: 'L’Akhtouba, le bras de la Volga où s’élevait Saraï',
    ar: 'نهر أختوبا، فرع الفولغا حيث قامت ساراي',
  },
  fa: {
    fichier: 'Si-o-se-Pol.jpg',
    auteur: 'Reza Haji-pour',
    licence: 'CC BY 3.0',
    fr: 'Le Si-o-se-pol, le pont aux trente-trois arches',
    ar: 'جسر سي وسه بل، جسر الثلاث والثلاثين قنطرة',
  },
  sw: {
    fichier: 'The_Fort_Jesus_Mombasa,_Kenya.JPG',
    auteur: 'Zahra Abdulmajid',
    licence: 'CC BY-SA 3.0',
    // Vers le bas : les remparts, sans le mât ni les fils au-dessus.
    cadrage: '50% 88%',
    fr: 'Fort Jesus, au-dessus du vieux port',
    ar: 'قلعة يسوع فوق الميناء القديم',
  },
  hi: {
    fichier: 'A_Potrait_view_of_Qutub_Minar.jpg',
    auteur: 'IM3847',
    licence: 'CC BY-SA 4.0',
    // Le minaret est haut : on garde son sommet, et un peu des ruines à son pied.
    cadrage: '50% 26%',
    fr: 'Le Qutub Minar',
    ar: 'قطب منار',
  },
  zh: {
    fichier: 'Hall_of_Prayer_for_Good_Harvest.JPG',
    auteur: 'Fong Chen',
    licence: 'Domaine public',
    // Vers le haut : le temple et le ciel, plutôt que la foule du parvis.
    cadrage: '50% 8%',
    fr: 'Le temple du Ciel',
    ar: 'معبد السماء',
  },
  ko: {
    fichier: 'Front_view_of_Heungnyemun_Gate_in_Gyeongbokgung_Palace_Seoul_South_Korea.jpg',
    auteur: 'Basile Morin',
    licence: 'CC BY-SA 4.0',
    fr: 'La porte Heungnyemun, au palais Gyeongbokgung',
    ar: 'بوابة هونغنيمون في قصر غيونغبوكغونغ',
  },
  ja: {
    fichier: 'Meiji_Shrine_Minami-sando-torii_2023-01-26.jpg',
    auteur: 'Asanagi',
    licence: 'CC0',
    fr: 'Un torii du sanctuaire Meiji',
    ar: 'بوابة توري في ضريح ميجي',
  },
}

export const sourceDe = (credit) => `${COMMONS}${encodeURIComponent(credit.fichier)}`
