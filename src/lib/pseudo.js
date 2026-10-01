// Le filtre des pseudonymes — ce que le voyageur écrit dans « Ton nom de
// voyageur » est du texte libre qui s'affiche chez des INCONNUS (classements,
// adversaire d'une Course). Ce module dit si un pseudonyme peut être montré :
// ni coordonnées (numéro, @, lien, messagerie), ni insulte.
//
// Une DISSUASION, jamais une garantie — ne pas écrire « modéré » :
//   • il rate ce qu'on n'a pas prévu (une insulte nouvelle, une orthographe
//     inventée, une langue absente de la liste) ;
//   • il ne remplace ni le signalement ni le blocage que l'App Store exige des
//     contenus saisis par les utilisateurs (docs/app-store.md, ligne 1.2) ;
//   • la liste est courte exprès : une grossièreté forte par entrée, pas de
//     mots seulement impolis. UN FAUX POSITIF SUR UN PRÉNOM EST PIRE QU'UN
//     FAUX NÉGATIF — dans le doute, le mot n'y est pas.
//
// Local et pur : aucune requête, aucun service tiers (un pseudo envoyé à une
// API de modération serait une donnée perso de plus, et rien ne marcherait
// hors-ligne). Pas de lookbehind : l'app tourne dans de vieux WebKit.
//
// Où l'appeler — et où surtout PAS :
//   • À l'ÉCRITURE et à l'AFFICHAGE : `nomPublic` (barid.js), le serveur, les
//     écrans qui montrent un nom venu d'ailleurs.
//   • JAMAIS dans `nettoyerNom` ni dans `canoniser` (barid.js) : l'empreinte
//     d'une lettre du Barid se calcule sur le nom nettoyé, et une liste qui
//     évolue rendrait « abîmées » des lettres déjà parties.
//   • Pas à chaque frappe d'un champ qui se remet à jour : le champ garde ce
//     que le voyageur tape ; seule la valeur qui SORT est filtrée.
//
// Comment ça marche : le texte est normalisé (diacritiques, tatwil, chiffres
// arabes, formes pleine chasse, lettres cyrilliques jumelles…), découpé en
// mots, puis chaque mot — seul, accolé à ses voisins (« nik mok », « c o n »)
// ou sans ses chiffres de bord (« merde2008 ») — est replié selon TROIS
// écritures et comparé à la liste de cette écriture :
//   leet    FR/EN, où 0 1 3 4 5 7 @ $ valent des lettres (« c0nn4rd ») ;
//   darija  l'arabizi, où 5 6 7 8 9 sont des lettres arabes (« 9a7ba ») ;
//   arabe   l'écriture arabe, sans voyelles brèves ni allongement.
// Une lettre étirée à trois exemplaires ou plus se compare aussi ramenée à
// un ou deux (« fuuuck », « connnard »). Deux exemplaires restent légitimes :
// « Putte » n'est pas « pute » étirée, « Niger » n'est pas « nigger ». Le prix :
// « fuuck » passe — une dissuasion, on l'a dit.

// ————— La liste (à relire par un locuteur natif) —————
// Mot entier seulement, sauf RACINES (cherchées DANS un mot) : une racine ne
// doit se trouver dans aucun nom réel — « salope » est dans « Salopek »,
// « salaud » dans « Salauddin », « couille » dans « Couillet » : ces trois-là
// sont donc des MOTS ENTIERS, jamais des racines. `pseudo.test.js` passe un
// corpus de prénoms, les destinations et tous les mots de l'app au filtre.
const MOTS_LEET = [
  // français
  'merde', 'pute', 'putes', 'salope', 'salopes', 'salopard', 'salaud', 'salauds',
  'petasse', 'pouffiasse', 'couille', 'couilles', 'nique', 'niquer', 'ntm', 'fdp',
  'nique ta mere', 'ordure', 'pourriture', 'enfoire', 'enfoires',
  'sale arabe', 'sale negre', 'sale noir', 'sale juif', 'youpin', 'bicot',
  // anglais
  'shit', 'shits', 'cunt', 'whore', 'slut', 'pussy', 'wanker', 'dickhead', 'nigga', 'niggas',
]
const RACINES_LEET = [
  'fuck', 'connard', 'connasse', 'encule', 'putain', 'bougnoul',
  'bitch', 'bastard', 'asshole', 'bullshit', 'cocksuck', 'nigger',
]

// Arabizi. q, k et 9 se confondent, 7 vaut h, 5 vaut kh, 8 vaut gh ; le reste
// s'écrit comme on l'entend, d'où quelques variantes. Le 3 (le ʿayn) et le 2
// (la hamza) restent des chiffres : « 3ahira » ne doit pas devenir « ahira »,
// un prénom.
const MOTS_DARIJA = [
  '9a7ba', '9e7ba', '9a7ab', 'charmouta', 'sharmouta', 'charmota', 'sharmota',
  '3ahira', '7mar', '7mara', 'kelb', 'kelba', 'zebi', 'zebbi', 'zbi', 'zbbi', 'zob',
  '5anzir', 'khanzir', 'khawal', '5awal', 'mnayek', 'mnayk', 'dayouth',
  'nik mok', 'nik omek', 'nik oumek', 'nik ommok', 'nik mk',
  'kes mok', 'kes omek', 'kes oumek', 'kes mk', 'kess mok', 'kess omek', 'kess oumek', 'kess mk',
]

// Écriture arabe (voyelles brèves, tatwil et variantes de lettres sont déjà
// ramenés à une seule forme : أ إ آ → ا, ى → ي, ة → ه).
const MOTS_ARABE = [
  'كلب', 'كلبة', 'كلبك', 'حمار', 'حمارة', 'خنزير', 'خنزيرة',
  'زب', 'زبي', 'كس', 'كسمك', 'كس امك', 'كس اختك', 'كس امها',
  'قحبة', 'قحبتك', 'قحاب', 'شرموط', 'شرموطة', 'عاهرة', 'عاهر',
  'منيوك', 'منيك', 'ينيك', 'نيك امك', 'نيك مك', 'نكمك',
  'ديوث', 'خول', 'لوطي', 'مخنث', 'ولد الزنا', 'ابن الزنا', 'ملعون الوالدين',
]

// Sans écran de messagerie : un pseudonyme est un nom, pas une adresse.
const MESSAGERIES_LEET = [
  'whatsapp', 'whatsap', 'watsap', 'watsapp', 'wtsp', 'wtsap', 'telegram', 'telegramme',
  'snapchat', 'insta', 'instagram', 'tiktok', 'viber', 'facebook',
]
const MESSAGERIES_ARABE = [
  'واتساب', 'واتس', 'تلغرام', 'تليجرام', 'تيليجرام', 'تلجرام',
  'انستا', 'انستغرام', 'انستجرام', 'سناب', 'سنابشات', 'فيسبوك', 'تيكتوك',
]

// ————— Normalisation —————
// Jumelles cyrilliques et grecques : « fuсk » avec un с cyrillique est du latin.
const JUMELLES = {
  а: 'a', е: 'e', о: 'o', р: 'p', с: 'c', х: 'x', у: 'y', і: 'i', ѕ: 's', ј: 'j', һ: 'h',
  α: 'a', ο: 'o', ρ: 'p', ι: 'i', ν: 'v', υ: 'u', ε: 'e',
}
// Ce que la décomposition Unicode ne sépare pas.
const A_PART = {
  ø: 'o', ł: 'l', đ: 'd', ß: 'ss', æ: 'ae', œ: 'oe', ı: 'i',
  ى: 'ي', ة: 'ه', ٱ: 'ا', ک: 'ك', ی: 'ي', ہ: 'ه', ھ: 'ه', ۃ: 'ه', ء: '',
}
const CHIFFRES_ARABES = /[\u0660-\u0669\u06F0-\u06F9]/g

// Minuscules, sans diacritiques ni voyelles brèves arabes (la décomposition
// NFKD sépare aussi أ إ آ ؤ ئ de leur hamza), sans caractères invisibles ni
// tatwil, formes pleine chasse ramenées à la normale, chiffres arabes en
// chiffres latins.
function normaliser(texte) {
  return String(texte ?? '')
    .normalize('NFKD')
    .replace(/[\p{M}\p{Cf}\u0640]/gu, '')
    .toLowerCase()
    .replace(CHIFFRES_ARABES, (c) => String(c.charCodeAt(0) & 0xf))
    .replace(/[^\u0000-\u007f]/g, (c) => JUMELLES[c] ?? A_PART[c] ?? c)
}

// Une écriture = une table de substitution (caractère → lettres), appliquée à
// la liste ET au texte. Les lettres répétées ne s'écrasent pas ici : voir
// `etirements`.
const LEET = { 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', 7: 't', '@': 'a', $: 's' }
const DARIJA = { 5: 'kh', 6: 't', 7: 'h', 8: 'gh', 9: 'k', '@': 'a', $: 's', q: 'k' }

const substituer = (table) => (s) => [...s].map((c) => table[c] ?? c).join('')

const ECRITURES = {
  leet: { plier: substituer(LEET), mots: new Set(), racines: [], prefixes: [] },
  darija: { plier: substituer(DARIJA), mots: new Set(), racines: [], prefixes: ['ya', 'el', 'al', 'l'] },
  arabe: { plier: substituer({}), mots: new Set(), racines: [], prefixes: ['وال', 'بال', 'يا', 'ال'] },
}
// Un mot plié, puis ses versions « étirées » : trois lettres identiques ou
// plus se ramènent à une ou à deux.
const etirements = (plie) => {
  const formes = new Set([plie])
  if (/(.)\1{2,}/su.test(plie)) {
    formes.add(plie.replace(/(.)\1{2,}/gsu, '$1'))
    formes.add(plie.replace(/(.)\1{2,}/gsu, '$1$1'))
  }
  return [...formes]
}
// Un préfixe (« l9a7ba », « الكلب ») ne s'ôte que d'un mot assez long : sinon
// « ألكس » (Alex) deviendrait « كس ».
const RESTE_MINIMUM = { leet: 0, darija: 4, arabe: 3 }

const charger = (ecriture, mots, racines = []) => {
  // Une expression de plusieurs mots (« nik mok ») se compare accolée : elle
  // attrape aussi « nikmok », et « nik » + « mok » écrits à part.
  for (const mot of mots) ECRITURES[ecriture].mots.add(ECRITURES[ecriture].plier(normaliser(mot).replace(/\s+/g, '')))
  for (const racine of racines) ECRITURES[ecriture].racines.push(ECRITURES[ecriture].plier(normaliser(racine)))
}
charger('leet', MOTS_LEET, RACINES_LEET)
charger('darija', MOTS_DARIJA)
charger('arabe', MOTS_ARABE)

const MESSAGERIES = {
  leet: new Set(MESSAGERIES_LEET.map((m) => ECRITURES.leet.plier(m))),
  arabe: new Set(MESSAGERIES_ARABE.map((m) => ECRITURES.arabe.plier(normaliser(m)))),
}

// ————— Découpage —————
const separer = (normal) => normal.split(/[^\p{L}\p{N}@$]+/u).filter(Boolean)

// Les mots du texte (`seuls`), plus ce que l'on fait pour les contourner : des
// lettres isolées recollées (« c o n n a r d ») restent des `seuls`, des voisins
// accolés (« nik mok », « ta mère ») sont des `accoles`. Une racine ne se
// cherche que dans un mot seul : « shaBI TCHand » contient « bitch » à cheval
// sur deux mots, et aucun voisinage ne doit fabriquer une insulte.
function decouper(normal) {
  const bruts = separer(normal)
  const seuls = [...bruts]
  const accoles = []
  let i = 0
  while (i < bruts.length) {
    let j = i
    while (j < bruts.length && [...bruts[j]].length === 1) j += 1
    if (j - i >= 3) seuls.push(bruts.slice(i, j).join(''))
    i = Math.max(j, i + 1)
  }
  for (let d = 0; d < bruts.length; d++) {
    for (let n = 2; n <= 3 && d + n <= bruts.length; n++) accoles.push(bruts.slice(d, d + n).join(''))
  }
  return { seuls, accoles }
}

// « merde2008 », « 2008merde » : la même chose sans les chiffres de bord.
const sansChiffresDeBord = (mot) => mot.replace(/^\d+|\d+$/gu, '')

const variantes = (mot) => {
  const propre = sansChiffresDeBord(mot)
  return propre && propre !== mot ? [mot, propre] : [mot]
}

const retirerPrefixe = (ecriture, plie) => {
  for (const prefixe of ECRITURES[ecriture].prefixes) {
    if (plie.startsWith(prefixe) && plie.length - prefixe.length >= RESTE_MINIMUM[ecriture]) return plie.slice(prefixe.length)
  }
  return null
}

// Un mot seul : la liste, ses préfixes (« l9a7ba », « الكلب ») et les racines.
const correspondSeul = (ecriture, plie) => {
  const { mots: liste, racines } = ECRITURES[ecriture]
  return etirements(plie).some((v) => {
    if (liste.has(v) || racines.some((r) => v.includes(r))) return true
    const reste = retirerPrefixe(ecriture, v)
    return reste !== null && liste.has(reste)
  })
}

const ECRITURES_NOMS = Object.keys(ECRITURES)

/** Vrai si le texte contient une grossièreté de la liste (voir en tête). */
export function contientInsulte(texte) {
  const { seuls, accoles } = decouper(normaliser(texte))
  for (const mot of seuls) {
    for (const variante of variantes(mot)) {
      if (ECRITURES_NOMS.some((e) => correspondSeul(e, ECRITURES[e].plier(variante)))) return true
    }
  }
  for (const mot of accoles) {
    if (ECRITURES_NOMS.some((e) => etirements(ECRITURES[e].plier(mot)).some((v) => ECRITURES[e].mots.has(v)))) return true
  }
  return false
}

// ————— Les coordonnées —————
// Chaque motif est borné (étiquettes de domaine ≤ 63 caractères, courriel
// cherché à partir de son @) : un texte démesuré collé dans le champ ne doit
// pas faire ramer le téléphone — les expressions à départ libre, comme
// `[a-z]+@`, sont quadratiques sur une longue suite de lettres.
const TLD = 'com|net|org|info|biz|io|me|co|ma|fr|tv|cc|ly|gl|gg|xyz|app|dev|link|site|online|top|club|shop|store|live|tk|ml|ga|cf|dz|tn|eg'
// Un numéro : huit chiffres ou plus, avec ou sans espaces, points, tirets,
// parenthèses entre eux (« 06 12 34 56 78 », « +212 6-12-34-56-78 »).
const NUMERO = /\d(?:[\s.\-_/()+]*\d){7,}/u
const ARROBASE = /(?:^|[^\p{L}\p{N}])@[\p{L}\p{N}_.]{2,}/u
const FOURNISSEUR = /^(?:gmail|hotmail|yahoo|outlook|icloud|live|msn|proton|protonmail|gmx|aol|yandex)(?![\p{L}\p{N}])/u
const DOMAINE = /^[\p{L}\p{N}-]{1,63}\.\p{L}{2,}/u
const LIEN = new RegExp(
  `(?:https?|ftp)://|www\\.|(?:^|[^\\p{L}\\p{N}])(?:[\\p{L}\\p{N}-]{2,63}\\.(?:${TLD})|(?:t|wa)\\.me)(?![\\p{L}\\p{N}])`,
  'u'
)

// « yassine@gmail.com », « karim@gmail » : on part de chaque @, pas du début.
function aUnCourriel(normal) {
  for (let i = normal.indexOf('@'); i !== -1; i = normal.indexOf('@', i + 1)) {
    const apres = normal.slice(i + 1, i + 90)
    if (FOURNISSEUR.test(apres)) return true
    if (i > 0 && /[\p{L}\p{N}._-]/u.test(normal[i - 1]) && DOMAINE.test(apres)) return true
  }
  return false
}

// « ali (dot) com », « ali . com », « ali point ma » : le point dit en toutes lettres.
const pointsEcrits = (normal) =>
  normal
    .replace(/\s+/gu, ' ')
    .replace(/ ?[[({] ?(?:dot|point) ?[\])}] ?/gu, '.')
    .replace(/ (?:dot|point) (?=(?:com|net|org|info|me|co|ma|fr|io)(?![\p{L}\p{N}]))/gu, '.')
    .replace(/ ?\. ?/gu, '.')

/** Vrai si le texte laisse un moyen de joindre quelqu'un : numéro, @, lien, messagerie. */
export function contientContact(texte) {
  const normal = normaliser(texte)
  if (NUMERO.test(normal) || ARROBASE.test(normal) || aUnCourriel(normal)) return true
  if (LIEN.test(pointsEcrits(normal))) return true
  const { seuls } = decouper(normal)
  for (const mot of seuls) {
    for (const variante of variantes(mot)) {
      if (etirements(ECRITURES.leet.plier(variante)).some((v) => MESSAGERIES.leet.has(v))) return true
      if (etirements(ECRITURES.arabe.plier(variante)).some((v) => MESSAGERIES.arabe.has(v))) return true
    }
  }
  return false
}

// ————— L'interface publique —————
/** `null` si le pseudonyme peut être montré, sinon la raison : 'contact' | 'insulte'. */
export function verifierPseudo(nom) {
  if (contientContact(nom)) return 'contact'
  if (contientInsulte(nom)) return 'insulte'
  return null
}

export const pseudoAcceptable = (nom) => verifierPseudo(nom) === null

// Le repli est le nom vide : l'écran dit « Un voyageur » / « مسافر » (déjà
// traduit). Un nom accepté est rendu tel quel, sans retouche.
export const pseudoPropre = (nom) => (typeof nom === 'string' && nom !== '' && pseudoAcceptable(nom) ? nom : '')
