// Le Carnet : la révision espacée du voyageur (système de Leitner, 6 rangs).
// Chaque étape validée verse ses mots au carnet ; un mot revient à intervalles
// croissants — bonne réponse : il monte d'un rang, erreur : retour au rang 1.
// Tout est pur et daté en 'YYYY-MM-DD' local, comme la progression.

import { melanger } from './quiz.js'

// Le dernier rang plafonnait à 16 jours : une destination terminée (192 mots)
// y renvoyait 12 mots par jour — toute la session — et la file ne se vidait
// plus dès la deuxième destination. Six rangs jusqu'à 90 jours.
export const INTERVALLES = [1, 3, 7, 16, 35, 90]
export const RANG_MAX = INTERVALLES.length
export const TAILLE_SESSION = 12
export const XP_PAR_MOT = 3

export const cleMot = (langueId, motId) => `${langueId}:${motId}`

const plusJours = (jour, n) => {
  const [y, m, d] = jour.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10)
}

// Les mots d'une étape validée entrent au carnet — sans écraser ceux qui
// voyagent déjà. Un mot réussi pendant la leçon part du rang 2 : la leçon
// vient de mesurer qu'il tient, jeter cette information reviendrait à faire
// démarrer la répétition espacée les yeux fermés. Un mot raté part du rang 1.
export function ajouterAuCarnet(progres, langueId, mots, jour, reussis = {}) {
  const carnet = { ...(progres.carnet ?? {}) }
  for (const mot of mots) {
    const cle = cleMot(langueId, mot.id)
    if (!carnet[cle]) carnet[cle] = { boite: reussis[mot.id] ? 2 : 1, jour }
  }
  return { ...progres, carnet }
}

export const echeance = (entree) => plusJours(entree.jour, INTERVALLES[entree.boite - 1])

export const estDue = (entree, jour) => echeance(entree) <= jour

export const prochaineBoite = (boite, bonne) => (bonne ? Math.min(RANG_MAX, boite + 1) : 1)

// Réponse à une révision : le mot change de rang et repart d'aujourd'hui.
export function reviserMot(progres, langueId, motId, bonne, jour) {
  const cle = cleMot(langueId, motId)
  const entree = progres.carnet?.[cle]
  if (!entree) return progres
  return {
    ...progres,
    carnet: { ...progres.carnet, [cle]: { boite: prochaineBoite(entree.boite, bonne), jour } },
  }
}

// Les mots dus aujourd'hui, les plus anciens d'abord, toutes langues mêlées.
export function motsDus(progres, langues, jour) {
  const dus = []
  for (const [cle, entree] of Object.entries(progres.carnet ?? {})) {
    if (!estDue(entree, jour)) continue
    const [langueId, motId] = cle.split(':')
    const langue = langues.find((l) => l.id === langueId)
    const mot = langue?.lecons.flatMap((lecon) => lecon.mots).find((m) => m.id === motId)
    if (langue && mot) dus.push({ langue, mot, entree })
  }
  return dus.sort((a, b) => (a.entree.jour < b.entree.jour ? -1 : a.entree.jour > b.entree.jour ? 1 : a.entree.boite - b.entree.boite))
}

export const tailleCarnet = (progres) => Object.keys(progres.carnet ?? {}).length

// Dans combien de jours le prochain mot reviendra (null si carnet vide).
export function joursAvantProchaine(progres, jour) {
  const entrees = Object.values(progres.carnet ?? {})
  if (!entrees.length) return null
  const plusProche = entrees.map(echeance).sort()[0]
  if (plusProche <= jour) return 0
  const [y1, m1, d1] = jour.split('-').map(Number)
  const [y2, m2, d2] = plusProche.split('-').map(Number)
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000)
}

const tousLesMots = (langue) => langue.lecons.flatMap((lecon) => lecon.mots)

// Les mots fragiles : rang 1 ou 2, c'est-à-dire tout juste appris ou tout
// juste ratés. C'est eux que la mémoire est en train de perdre.
export const RANG_FRAGILE = 2

// Compose la session : la moitié des places est réservée aux mots fragiles,
// les plus RÉCENTS d'abord (un mot raté hier passe avant un mot négligé depuis
// un mois — l'inverse le repousserait derrière tout l'arriéré, comme avant) ;
// le reste revient aux mots dus les plus anciens.
export function composerSession(dus, taille = TAILLE_SESSION) {
  const fragiles = dus
    .filter((du) => du.entree.boite <= RANG_FRAGILE)
    .sort((a, b) => (a.entree.jour > b.entree.jour ? -1 : a.entree.jour < b.entree.jour ? 1 : 0))
  const pris = fragiles.slice(0, Math.ceil(taille / 2))
  const reste = dus.filter((du) => !pris.includes(du))
  return [...pris, ...reste].slice(0, taille)
}

// La session : au plus TAILLE_SESSION mots dus, chacun avec 3 distracteurs
// pris dans SA langue, en alternant compréhension et production.
export function construireRevision(dus, alea = Math.random) {
  return composerSession(dus).map((du, i) => {
    const options = [du.mot]
    for (const autre of melanger(tousLesMots(du.langue), alea)) {
      if (options.length === 4) break
      if (!options.some((o) => o.id === autre.id)) options.push(autre)
    }
    return { ...du, type: i % 2 === 0 ? 'comprendre' : 'produire', options: melanger(options, alea) }
  })
}
