// La phrase dans l'ordre : on reconstruit une phrase avec des tuiles-mots.
//
// Même cible que l'épellation : la romanisation quand l'écriture n'est pas
// latine, le texte sinon. Le chinois et le japonais n'ont pas d'espaces entre
// les mots — leur pinyin et leur romaji, si : ils entrent par là. Toutes les
// tuiles sont donc en écriture latine (rangée en dir="ltr", même en arabe).
//
// La ponctuation ne fait pas de tuile : « ¿ » et « ? » désigneraient la
// première et la dernière. Les majuscules restent — la première guide l'ordre,
// comme dans la phrase écrite.
import { melanger } from './quiz.js'

export const MOTS_MIN = 3
export const INTRUS = 2

export const jetonsPhrase = (texte) =>
  String(texte ?? '')
    .split(/\s+/)
    .map((j) => j.replace(/[¿?¡!.,…？！、。:;«»"]/g, ''))
    .filter(Boolean)

// Les mots à remettre dans l'ordre, ou null si le mot n'est pas une phrase.
export function ciblePhrase(mot) {
  const jetons = jetonsPhrase(mot.r ?? mot.t)
  return jetons.length >= MOTS_MIN ? jetons : null
}

// Toute la phrase, plus deux intrus pris dans les autres mots de la leçon
// (même source : romanisation ou texte) — jamais un mot déjà dans la phrase,
// sans quoi deux tuiles jumelles rendraient la correction arbitraire.
export function construireTuilesMots(jetons, autres, alea = Math.random) {
  const dejaLa = new Set(jetons.map((j) => j.toLowerCase()))
  const vivier = []
  for (const autre of autres) {
    for (const j of jetonsPhrase(autre.r ?? autre.t)) {
      const cle = j.toLowerCase()
      if (!dejaLa.has(cle)) {
        dejaLa.add(cle)
        vivier.push(j)
      }
    }
  }
  const intrus = melanger(vivier, alea).slice(0, INTRUS)
  return melanger([...jetons, ...intrus], alea).map((m, cle) => ({ m, cle }))
}

// Juste = exactement les mots de la phrase, dans son ordre (le texte compte,
// pas la tuile : deux « no » sont interchangeables).
export const estPhraseJuste = (jetons, placees) =>
  placees.length === jetons.length && placees.every((p, i) => p.m === jetons[i])
