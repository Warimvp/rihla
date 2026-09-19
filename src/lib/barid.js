// Le Barid (البريد) — le courrier du voyageur. Sous les Mamelouks, des relais
// de cavaliers et des pigeons portaient une lettre du Caire à Damas en
// quelques jours. Ici, un DÉFI part dans un message (WhatsApp, SMS, ce qu'on
// veut) sous la forme d'un lien ; l'ami joue les MÊMES dix questions — tirage
// déterministe par graine, comme l'étape du jour — chrono en main, et renvoie
// son résultat par le même chemin. Sans compte, sans serveur : personne ne
// sait qui joue avec qui, et l'app reste 100 % locale.
//
// Tout ici est pur : la lettre est un objet, son code un texte, le progrès
// une valeur — l'écran (Barid.jsx) ne fait que les brancher.
import { melanger, mulberry32 } from './quiz.js'

export const NB_QUESTIONS_BARID = 10
export const VERSION_LETTRE = 1
export const TOUTE_LA_ROUTE = '*'
export const LONGUEUR_NOM = 24
export const XP_PAR_BONNE = 2
export const XP_VICTOIRE = 10
export const CLE_LIEN = 'barid'
export const BASE_LIEN = 'https://warimvp.github.io/rihla/'

const GRAINE_MAX = 2147483647
const TEMPS_MAX = 99999
const SEL = 'rihla-barid-1'

export const nouvelleGraine = (alea = Math.random) => 1 + Math.floor(alea() * (GRAINE_MAX - 1))

// ————— Le tirage —————
// Dix questions, une langue (ou toute la route) : on alterne « comprendre »
// (le mot cible → son sens) et « produire » (le sens → le mot cible). Les
// distracteurs viennent TOUJOURS de la langue du mot : sur « produire » les
// options sont des mots cibles, mêler les langues trahirait la réponse — et
// les sens sont uniques dans une langue, donc jamais deux options synonymes.
export function construireBarid(langues, langueId, graine, nbQuestions = NB_QUESTIONS_BARID) {
  const retenues = langueId === TOUTE_LA_ROUTE ? langues : langues.filter((l) => l.id === langueId)
  if (!retenues.length) return []
  const alea = mulberry32(graine % GRAINE_MAX)
  const paires = retenues.flatMap((langue) =>
    langue.lecons.flatMap((lecon) => lecon.mots.map((mot) => ({ langue, mot })))
  )
  const tirage = melanger(paires, alea).slice(0, nbQuestions)
  return tirage.map(({ langue, mot }, i) => {
    const vivier = paires.filter((p) => p.langue === langue).map((p) => p.mot)
    const options = [mot]
    for (const autre of melanger(vivier, alea)) {
      if (options.length === 4) break
      if (!options.some((o) => o.id === autre.id)) options.push(autre)
    }
    return { langue, mot, type: i % 2 === 0 ? 'comprendre' : 'produire', options: melanger(options, alea) }
  })
}

export const estBonneOption = (question, option) => option.id === question.mot.id

// ————— Le verdict —————
// Le score d'abord ; à score égal, le plus rapide ; sinon égalité (un temps
// absent ou nul ne départage personne).
export function verdict(moi, adversaire) {
  if (moi.s !== adversaire.s) return moi.s > adversaire.s ? 'gagne' : 'perdu'
  const tm = Number(moi.t)
  const ta = Number(adversaire.t)
  if (!Number.isFinite(tm) || !Number.isFinite(ta) || tm === ta) return 'egal'
  return tm < ta ? 'gagne' : 'perdu'
}

export const xpBarid = (score, verdictObtenu) =>
  XP_PAR_BONNE * score + (verdictObtenu === 'gagne' ? XP_VICTOIRE : 0)

// ————— Le nom —————
// Libre, court, sans caractère de contrôle : il voyage dans un lien et
// s'affiche chez l'autre.
export const nettoyerNom = (nom) =>
  String(nom ?? '')
    .replace(/\p{C}/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, LONGUEUR_NOM)

// ————— La lettre —————
// Trois formes, un seul format :
//   • un défi        { v, n, l, g, s, t }              — « j'ai fait s/10 en t s sur la graine g »
//   • une réponse    { v, n, re: { l, g, s, t, s0, t0 } } — « sur TON défi g, j'ai fait s/t ; tu avais s0/t0 »
//   • une riposte    les deux à la fois : la réponse ET un nouveau défi.
// `re` répète le score du premier envoyeur (s0/t0) pour que la réponse se
// lise même sur un appareil où ce défi n'a jamais été joué.

const entier = (valeur, min, max) =>
  Number.isInteger(valeur) && valeur >= min && valeur <= max ? valeur : null

const canoniserDefi = (l) => ({
  l: String(l.l ?? ''),
  g: entier(l.g, 1, GRAINE_MAX),
  s: entier(l.s, 0, NB_QUESTIONS_BARID),
  t: entier(l.t, 0, TEMPS_MAX),
})

// Ordre des clés FIXE : l'empreinte se calcule sur ce texte, quel que soit
// l'ordre dans lequel un client a sérialisé la lettre.
function canoniser(lettre) {
  const propre = { v: lettre.v, n: nettoyerNom(lettre.n) }
  if (lettre.g !== undefined || lettre.s !== undefined) Object.assign(propre, canoniserDefi(lettre))
  if (lettre.re && typeof lettre.re === 'object') {
    propre.re = {
      ...canoniserDefi(lettre.re),
      s0: entier(lettre.re.s0, 0, NB_QUESTIONS_BARID),
      t0: entier(lettre.re.t0, 0, TEMPS_MAX),
    }
  }
  return propre
}

const lettreValide = (l, idsLangues) => {
  const langueOk = (id) => id === TOUTE_LA_ROUTE || !idsLangues || idsLangues.includes(id)
  const defiOk = (d) => d.g !== null && d.s !== null && d.t !== null && d.l !== ''
  if (l.g !== undefined && !defiOk(l)) return 'abime'
  if (l.re && (!defiOk(l.re) || l.re.s0 === null || l.re.t0 === null)) return 'abime'
  if (l.g === undefined && !l.re) return 'abime'
  if (l.g !== undefined && !langueOk(l.l)) return 'langue'
  if (l.re && !langueOk(l.re.l)) return 'langue'
  return null
}

// FNV-1a 32 bits, salé : une DISSUASION, pas une signature. Retoucher le
// score dans le lien demande de recalculer l'empreinte, donc de lire ce
// code — entre amis, ça suffit ; un serveur ne ferait pas mieux sans compte.
function empreinte(texte) {
  let h = 0x811c9dc5
  for (const octet of new TextEncoder().encode(texte)) {
    h ^= octet
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h.toString(36)
}

const versBase64Url = (texte) => {
  let binaire = ''
  for (const octet of new TextEncoder().encode(texte)) binaire += String.fromCharCode(octet)
  return btoa(binaire).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const depuisBase64Url = (code) => {
  const b64 = code.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (code.length % 4)) % 4)
  const binaire = atob(b64)
  return new TextDecoder().decode(Uint8Array.from(binaire, (c) => c.charCodeAt(0)))
}

export function encoderLettre(lettre) {
  const propre = canoniser({ ...lettre, v: VERSION_LETTRE })
  const texte = JSON.stringify(propre)
  return versBase64Url(JSON.stringify({ ...propre, c: empreinte(texte + SEL) }))
}

export const lienLettre = (code, base = BASE_LIEN) => `${base}#${CLE_LIEN}=${code}`

// Le code peut arriver nu, dans un lien, ou noyé dans tout un message
// (« Défi Rihla · Amine a fait 8/10… https://…/#barid=eyJ2… À toi ! »).
export function extraireCodes(texte) {
  const brut = String(texte ?? '')
  const codes = []
  const motif = new RegExp(`${CLE_LIEN}=([A-Za-z0-9_-]+)`, 'g')
  for (const m of brut.matchAll(motif)) codes.push(m[1])
  for (const jeton of brut.split(/\s+/)) {
    if (/^[A-Za-z0-9_-]{16,}$/.test(jeton) && !codes.includes(jeton)) codes.push(jeton)
  }
  return codes
}

function decoderCode(code, idsLangues) {
  let lu
  try {
    lu = JSON.parse(depuisBase64Url(code))
  } catch {
    return { ok: false, erreur: 'illisible' }
  }
  if (!lu || typeof lu !== 'object' || Array.isArray(lu) || lu.v === undefined) return { ok: false, erreur: 'inconnu' }
  if (lu.v !== VERSION_LETTRE) return { ok: false, erreur: 'version' }
  const { c, ...reste } = lu
  const propre = canoniser(reste)
  if (typeof c !== 'string' || c !== empreinte(JSON.stringify(propre) + SEL)) return { ok: false, erreur: 'abime' }
  const erreur = lettreValide(propre, idsLangues)
  return erreur ? { ok: false, erreur } : { ok: true, lettre: propre }
}

// Tolérant sur l'emballage (lien, message entier, code nu), strict sur le
// contenu : la première lecture qui aboutit gagne, sinon l'erreur de la
// première tentative — ou « illisible » s'il n'y avait rien à lire.
export function decoderLettre(texte, idsLangues = null) {
  const codes = extraireCodes(texte)
  if (!codes.length) return { ok: false, erreur: 'illisible' }
  let premiere = null
  for (const code of codes) {
    const resultat = decoderCode(code, idsLangues)
    if (resultat.ok) return resultat
    premiere ??= resultat
  }
  return premiere
}

// ————— Le progrès —————
// `progres.barid[graine] = { l, s, t, jour, adv?: { n, s, t }, verdict? }` :
// ma partie sur cette graine, puis celle de l'adversaire quand elle arrive.
// Idempotent : rouvrir la même réponse n'ajoute pas une victoire.

const entrees = (progres) => progres.barid ?? {}

export function enregistrerPartie(progres, { graine, langueId, score, temps }, jour) {
  const existante = entrees(progres)[graine]
  return {
    ...progres,
    barid: { ...entrees(progres), [graine]: { ...existante, l: langueId, s: score, t: temps, jour } },
  }
}

// L'adversaire a joué ma graine (ou j'ai joué la sienne : même chose vue
// d'ici). Sans partie locale, `moi` fournit mon score tel qu'il voyage dans
// la lettre — sinon le verdict resterait inconnu sur un autre appareil.
// `verdictImpose` : la Course (serveur) tranche elle-même, forfait compris —
// on n'a alors pas à recalculer.
export function enregistrerAdversaire(progres, graine, adversaire, jour, moi = null, verdictImpose = null) {
  const existante = entrees(progres)[graine] ?? (moi ? { l: moi.l, s: moi.s, t: moi.t, jour } : null)
  if (!existante) return progres
  const adv = { n: nettoyerNom(adversaire.n), s: adversaire.s, t: adversaire.t }
  const entree = { ...existante, adv, verdict: verdictImpose ?? verdict({ s: existante.s, t: existante.t }, adv) }
  return { ...progres, barid: { ...entrees(progres), [graine]: entree } }
}

// Fin d'une partie jouée ici : ma partie est inscrite ; si je relevais le
// défi de quelqu'un, le verdict tombe tout de suite et les XP suivent.
export function terminerBarid(progres, { graine, langueId, score, temps, adversaire = null, verdictImpose = null }, jour) {
  let suivant = enregistrerPartie(progres, { graine, langueId, score, temps }, jour)
  let verdictObtenu = null
  if (adversaire) {
    suivant = enregistrerAdversaire(suivant, graine, adversaire, jour, null, verdictImpose)
    verdictObtenu = suivant.barid[graine].verdict
  }
  const xpGagne = xpBarid(score, verdictObtenu)
  return { progres: { ...suivant, xp: suivant.xp + xpGagne }, verdict: verdictObtenu, xpGagne }
}

// Une réponse arrive à l'un de mes défis : le verdict s'inscrit, sans XP —
// ouvrir un lien ne rapporte rien, seule une partie jouée en rapporte.
export const accuserReponse = (progres, re, nom, jour) =>
  enregistrerAdversaire(progres, re.g, { n: nom, s: re.s, t: re.t }, jour, { l: re.l, s: re.s0, t: re.t0 })

export function bilanBarid(progres) {
  const bilan = { gagnes: 0, perdus: 0, egalites: 0, joues: 0 }
  for (const entree of Object.values(entrees(progres))) {
    bilan.joues += 1
    if (entree.verdict === 'gagne') bilan.gagnes += 1
    else if (entree.verdict === 'perdu') bilan.perdus += 1
    else if (entree.verdict === 'egal') bilan.egalites += 1
  }
  return bilan
}
