import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { LANGUES } from '../data/langues.js'
import { VOYAGEURS } from '../data/voyageurs.js'
import { getDictionary } from '../i18n.js'
import { contientContact, contientInsulte, pseudoAcceptable, pseudoPropre, verifierPseudo } from './pseudo.js'

// ————— Ce qui doit PASSER —————
// Un faux positif sur un prénom est pire qu'un faux négatif : ce corpus est le
// garde-fou de la liste. Chaque ajout de mot s'y heurte d'abord.
const PRENOMS = [
  // Maroc et monde arabe, en lettres latines
  'Yassine', 'Amine', 'Mohamed', 'Mohammed', 'Ahmed', 'Hmad', 'Hmida', 'Youssef', 'Ayoub', 'Hamza',
  'Karim', 'Samir', 'Rachid', 'Said', 'Hicham', 'Mehdi', 'Zakaria', 'Anas', 'Imane', 'Salma',
  'Fatima Zahra', 'Khadija', 'Aicha', 'Nadia', 'Meryem', 'Hajar', 'Soukaina', 'Ghita', 'Houda', 'Sanaa',
  'Layla', 'Kenza', 'Oumaima', 'Ikram', 'Abdelilah', 'Abdelkader', 'Abdelhak', 'Abderrahmane', 'Abdellah',
  'Salaheddine', 'Salauddin', 'Nourredine', 'Taoufik', 'Mustapha', 'Brahim', 'Hassan', 'Hussein', 'Bouchra',
  'Zineb', 'Soumia', 'Wafae', 'Hanane', 'Latifa', 'Malika', 'Driss', 'Idriss', 'Younes', 'Badr', 'Reda',
  'Walid', 'Othmane', 'Soufiane', 'Tarik', 'Jamal', 'Jalal', 'Kamal', 'Zouhair', 'Zoubir', 'Zobir', 'Zoubida',
  'Chaimae', 'Charaf', 'Chafik', 'Lahcen', 'Lahbib', 'Kalthoum', 'Kelthoum', 'Khawla', 'Zahira', 'Taher',
  'Zaher', 'Ibn Battuta', 'Ibn Khaldoun', 'Al Idrissi', 'El Mansouri', 'Ait Ben Haddou',
  // Noms que la chasse aux gros mots a déjà condamnés ailleurs (problème de Scunthorpe)
  'Scunthorpe', 'Dickens', 'Cockburn', 'Hancock', 'Assad', 'Bassam', 'Massimo', 'Constantin', 'Couillet',
  'Salopek', 'Putte', 'Van de Putte', 'Conard', 'Fagot', 'Niger', 'Nigerian', 'Salé', 'Shitrit', 'Analyst',
  'Cassandra', 'Passion', 'Bassist', 'Mishit', 'Titouan', 'Peniston', 'Sussex', 'Zebra', 'Zébulon',
  // Des mots et des prénoms qui CONTIENNENT une entrée de la liste : le jour où
  // l'un d'eux devient une « racine », ce corpus le condamne.
  'Monique', 'Dominique', 'Véronique', 'Unique', 'Technique', 'Salopette', 'Computer', 'Dispute', 'Député',
  'Réputation', 'Merdeka', 'Shiitake', 'Shitake', 'Zbiri', 'Kelbi', 'Ordurier', 'Bicoter', 'Youpi',
  // France, Europe, monde
  'Mathieu', 'Léa', 'Chloé', 'Jean-Pierre', 'Marie-Claire', 'Hélène', 'François', 'Zoé', 'Noël', 'Maël',
  'Gaëtan', 'Thérèse', 'Jérôme', 'Sébastien', 'Alexandre', 'Stéphanie', 'Anaïs', 'Carlos', 'María', 'José',
  'João', 'Giuseppe', 'Francesca', 'Mehmet', 'Ayşe', 'Emre', 'Elif', 'Hossein', 'Reza', 'Fatemeh', 'Priya',
  'Rahul', 'Ananya', 'Sergueï', 'Сергей', 'Мария', 'Дмитрий', 'Αλέξανδρος', '田中', '김민수', 'Yuki', 'Wei',
  'Li Na', 'Alex', 'Max', 'Nick', 'Nik', 'Kelly', 'Kaiser', 'Salma Y@ssine', 'M@ria',
  // Des surnoms, des chiffres, du jeu
  'Ibn Battuta 1325', 'Yassine_2008', 'Karim1998', 'Ahmed 2010', 'Mehdi-06', 'Anas.k', 'Team Rihla',
  'Voyageur 42', 'Capitaine', 'Karim1234567', 'Dr.Cohen', 'Mr Smith',
  // Écriture arabe
  'محمد', 'أحمد', 'ياسين', 'أمين', 'كريم', 'يوسف', 'سلمى', 'ليلى', 'فاطمة', 'خديجة', 'عائشة', 'زينب',
  'حمزة', 'عبد الله', 'عبد الرحمن', 'ابن بطوطة', 'رحلة', 'مسافر', 'الشاذلي', 'الكلبي', 'الحمداني', 'سارة',
  'مريم', 'ألكس', 'أم كلثوم', 'كمال', 'بسمة', 'هاجر', 'ريم', 'زبير', 'زبيدة', 'خولة', 'ماكس', 'نيك',
  'الاسكندر', 'كسرى', 'ياسين 2008',
]

describe('les pseudonymes qui passent', () => {
  it.each(PRENOMS)('%s', (nom) => {
    expect(verifierPseudo(nom)).toBeNull()
    expect(pseudoPropre(nom)).toBe(nom)
  })

  // Tout ce que l'app écrit elle-même doit pouvoir devenir un pseudonyme sans
  // que le filtre hausse un sourcil : si un mot de la liste se retrouve un jour
  // dans le vocabulaire (ou dans une phrase du Guide), ce test le dit.
  it('laisse passer chaque mot, romanisation, sens et nom de destination de l’app', () => {
    const textes = new Set()
    for (const langue of LANGUES) {
      for (const cle of ['nomFr', 'nomAr', 'ville', 'villeAr']) if (langue[cle]) textes.add(langue[cle])
      for (const lecon of langue.lecons) {
        for (const mot of lecon.mots) for (const cle of ['t', 'r', 'fr', 'ar']) if (mot[cle]) textes.add(mot[cle])
      }
    }
    for (const mots of Object.values(VOYAGEURS)) {
      for (const mot of mots) for (const cle of ['t', 'arabe', 'arabeR', 'fr', 'ar']) if (mot[cle]) textes.add(mot[cle])
    }
    // Un corpus vide ne prouverait rien.
    expect(textes.size).toBeGreaterThan(3000)
    const refuses = [...textes].filter((texte) => verifierPseudo(texte) !== null)
    expect(refuses).toEqual([])
  })

  it('ne trouve aucune insulte dans les textes de l’interface, français comme arabe', () => {
    const chaines = []
    const parcourir = (x) => {
      if (typeof x === 'string') chaines.push(x)
      else if (Array.isArray(x)) x.forEach(parcourir)
      else if (x && typeof x === 'object') Object.values(x).forEach(parcourir)
    }
    parcourir(getDictionary('fr'))
    parcourir(getDictionary('ar'))
    expect(chaines.length).toBeGreaterThan(500)
    expect(chaines.filter(contientInsulte)).toEqual([])
  })
})

// ————— Ce qui doit être REFUSÉ —————
describe('les insultes', () => {
  const FRANCAIS = ['connard', 'Connasse', 'salope', 'sale pute', 'putain', 'merde', 'enculé', 'enculer', 'ntm', 'FDP',
    'nique ta mère', 'niquetamere', 'couilles', 'pétasse', 'pouffiasse', 'bougnoul', 'salaud', 'ordure', 'sale arabe']
  const ANGLAIS = ['fuck', 'fucker', 'motherfucker', 'shit', 'bullshit', 'bitch', 'bastard', 'asshole', 'cunt', 'whore', 'slut',
    'wanker', 'dickhead', 'nigger', 'nigga']
  const DARIJA = ['zebi', 'zbi', 'zob', 'zebbi', '9a7ba', 'ka7ba', 'qa7ba', 'qahba', '7mar', 'hmar', 'kelb', 'kelba',
    'charmouta', 'sharmouta', '3ahira', 'khawal', '5awal', '5anzir', 'khanzir', 'mnayek', 'dayouth', 'nik mok', 'nikmok',
    'Nik Omek', 'kes mok', 'kess omek']
  const ARABE = ['كلب', 'الكلب', 'يا كلب', 'ياكلب', 'كلبة', 'حمار', 'الحمار', 'خنزير', 'زب', 'كس', 'كسمك', 'كس امك', 'قحبة',
    'القحبة', 'ولد القحبة', 'ابن الكلب', 'شرموط', 'شرموطة', 'عاهرة', 'منيوك', 'نيك امك', 'نكمك', 'ديوث', 'خول', 'لوطي',
    'مخنث', 'ولد الزنا']

  it.each([...FRANCAIS, ...ANGLAIS])('en français ou en anglais : %s', (texte) => {
    expect(verifierPseudo(texte)).toBe('insulte')
    expect(pseudoPropre(texte)).toBe('')
  })

  it.each(DARIJA)('en darija écrite en chiffres et en lettres : %s', (texte) => {
    expect(verifierPseudo(texte)).toBe('insulte')
    expect(pseudoPropre(texte)).toBe('')
  })

  it.each(ARABE)('en arabe : %s', (texte) => {
    expect(verifierPseudo(texte)).toBe('insulte')
    expect(pseudoPropre(texte)).toBe('')
  })

  it('la darija se reconnaît avec ses articles et ses appels (l9a7ba, lhmar, elkelb, yakelb)', () => {
    for (const texte of ['l9a7ba', 'lhmar', 'elkelb', 'yakelb', 'wld l9a7ba', 'ibn lkelb']) {
      expect(verifierPseudo(texte), texte).toBe('insulte')
    }
  })

  it('refuse l’insulte au milieu d’un pseudonyme, mais pas un mot qui la contient par hasard', () => {
    expect(verifierPseudo('Amine connard')).toBe('insulte')
    expect(verifierPseudo('Yassine zebi 2008')).toBe('insulte')
    expect(verifierPseudo('super_connard_12')).toBe('insulte')
    expect(verifierPseudo('Amine le fuckeur')).toBe('insulte')
    // La racine se cherche DANS un mot ; un mot entier ne se cherche que seul.
    expect(verifierPseudo('Salopek')).toBeNull()
    expect(verifierPseudo('Couillet')).toBeNull()
    expect(verifierPseudo('Salauddin')).toBeNull()
    expect(verifierPseudo('Zobir Karim')).toBeNull()
    // Jamais à cheval sur deux mots : « shaBI TCHand » cache « bitch ».
    expect(verifierPseudo('shabi tchand ?')).toBeNull()
  })

  it('ne confond pas une lettre étirée avec un nom à lettre double', () => {
    // Trois exemplaires ou plus : on étire, on ramène. Deux : c'est une graphie.
    expect(verifierPseudo('fuuuuuck')).toBe('insulte')
    expect(verifierPseudo('connnnnard')).toBe('insulte')
    expect(verifierPseudo('zebbbbbi')).toBe('insulte')
    expect(verifierPseudo('كلللللب')).toBe('insulte')
    expect(verifierPseudo('Niger')).toBeNull()
    expect(verifierPseudo('Putte')).toBeNull()
    expect(verifierPseudo('Conard')).toBeNull()
    expect(verifierPseudo('Fagot')).toBeNull()
  })
})

describe('les contournements les plus courants', () => {
  it.each([
    ['des accents et des cédilles', 'cônnârd'],
    ['des majuscules en désordre', 'cOnNaRd'],
    ['des espaces entre les lettres', 'c o n n a r d'],
    ['des points entre les lettres', 'c.o.n.n.a.r.d'],
    ['des tirets bas', 'z_e_b_i'],
    ['des chiffres pour des lettres (FR/EN)', 'c0nn4rd'],
    ['des chiffres pour des lettres (FR/EN)', 'm3rde'],
    ['des chiffres pour des lettres (FR/EN)', '5h1t'],
    ['un @ ou un $ pour une lettre', '$alope'],
    ['des chiffres collés au bord', 'merde2008'],
    ['des chiffres collés au bord', '2008merde'],
    ['un caractère invisible', 'fu\u200Bck'],
    ['des lettres pleine chasse', 'ｆｕｃｋ'],
    ['une lettre cyrillique jumelle', 'fuсk'],
    ['un tatwil entre les lettres arabes', 'كـــلـــب'],
    ['des voyelles brèves arabes', 'كَلْب'],
    ['des chiffres arabes pour les lettres de la darija', '٧mar'],
    ['une hamza ou un alif varié', 'ألقحبة'],
    ['des mots collés', 'niqueTaMère'],
  ])('%s : %s', (_, texte) => {
    expect(verifierPseudo(texte)).toBe('insulte')
  })
})

describe('les coordonnées', () => {
  it.each([
    ['un numéro marocain, collé', '0612345678'],
    ['un numéro marocain, espacé', '06 12 34 56 78'],
    ['un numéro international', '+212 6 12 34 56 78'],
    ['un numéro à points', '06.12.34.56.78'],
    ['un numéro à tirets', '06-12-34-56-78'],
    ['un numéro en chiffres arabes', '٠٦١٢٣٤٥٦٧٨'],
    ['un numéro au bout d’un nom', 'Amine 0612345678'],
    ['un @ de réseau social', '@yassine'],
    ['un @ de réseau social, au milieu', 'Yassine @yass_off'],
    ['un courriel', 'yassine@gmail.com'],
    ['un courriel sans extension', 'Karim@gmail'],
    ['un lien complet', 'https://t.me/amine'],
    ['un lien court', 't.me/amine'],
    ['un lien WhatsApp', 'wa.me/212612345678'],
    ['un lien sans protocole', 'www.exemple'],
    ['un nom de domaine', 'ali.com'],
    ['un nom de domaine marocain', 'yassine.ma'],
    ['un point écrit en toutes lettres', 'ali (dot) com'],
    ['un point écrit en toutes lettres', 'ali dot com'],
    ['un point entouré d’espaces', 'ali . com'],
    ['WhatsApp', 'whatsapp'],
    ['WhatsApp, avec une faute', 'Watsap Amine'],
    ['Instagram', 'Insta: ali_off'],
    ['Telegram', 'telegram'],
    ['Snapchat', 'snapchat amine'],
    ['TikTok', 'tiktok'],
    ['WhatsApp en arabe', 'واتساب'],
    ['Telegram en arabe', 'تلغرام'],
  ])('%s : %s', (_, texte) => {
    expect(verifierPseudo(texte)).toBe('contact')
    expect(pseudoPropre(texte)).toBe('')
  })

  it('ne prend pas pour un numéro ou un lien ce qui n’en est pas un', () => {
    for (const texte of ['Karim1234567', 'Amine 1998', 'Ibn Battuta 1325', 'Dr.Cohen', 'Y@ssine', 'M@ria', '3 + 4 = 7', 'Mehdi-06', 'Yassine_2008']) {
      expect(contientContact(texte), texte).toBe(false)
    }
    // Huit chiffres, séparés ou non : un numéro.
    expect(contientContact('Karim12345678')).toBe(true)
    expect(contientContact('Karim 12 34 56 78')).toBe(true)
  })

  it('distingue la raison : coordonnées d’abord, insulte ensuite', () => {
    expect(verifierPseudo('connard 0612345678')).toBe('contact')
    expect(verifierPseudo('connard')).toBe('insulte')
    expect(verifierPseudo('Amine')).toBeNull()
  })
})

describe('l’interface publique', () => {
  it('rend un nom accepté tel quel, sans retouche, et un nom refusé vide', () => {
    expect(pseudoPropre('  Amine  El ')).toBe('  Amine  El ')
    expect(pseudoPropre('فاطمة')).toBe('فاطمة')
    expect(pseudoPropre('zebi')).toBe('')
    expect(pseudoAcceptable('Amine')).toBe(true)
    expect(pseudoAcceptable('zebi')).toBe(false)
  })

  it('ne casse pas sur ce qui n’est pas du texte', () => {
    for (const rien of [undefined, null, '', 0, 42, {}, []]) {
      expect(pseudoPropre(rien)).toBe('')
      expect(verifierPseudo(rien)).toBeNull()
    }
  })

  it('reste rapide sur un texte démesuré (un nom est court, mais rien n’empêche de coller un roman)', () => {
    // Des motifs à départ libre (« [a-z]+@ ») sont quadratiques sur une longue
    // suite de lettres : 80 000 lettres prenaient dix secondes, 50 000 trois.
    const formes = {
      roman: 'Il était une fois un voyageur nommé Ibn Battuta. '.repeat(1000),
      'un seul mot': 'a'.repeat(50000),
      'un seul mot arabe': 'ك'.repeat(50000),
      tirets: '-'.repeat(50000),
      'lettres et points': 'a.'.repeat(25000),
      'lettres et tirets': 'a-'.repeat(25000),
      'lettres et @': 'a@'.repeat(25000),
      espaces: ' '.repeat(50000),
    }
    for (const [forme, texte] of Object.entries(formes)) {
      const debut = Date.now()
      verifierPseudo(texte)
      expect(Date.now() - debut, forme).toBeLessThan(1000)
    }
  })

  it('est une liste locale : jamais un appel réseau, jamais de lookbehind (vieux WebKit)', () => {
    const source = readFileSync(new URL('./pseudo.js', import.meta.url), 'utf8')
    // Le code seul : les commentaires parlent de « pas de lookbehind ».
    const code = source.replace(/\/\/.*$/gm, '')
    expect(code).not.toMatch(/fetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|https?:\/\//)
    expect(code).not.toMatch(/\(\?<[=!]/)
    expect(source).not.toMatch(/^import /m)
  })
})
