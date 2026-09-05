// Épellation partagée entre la Caravane et les leçons : on épelle la
// romanisation quand l'écriture cible n'est pas latine, avec des tuiles
// mélangées et deux lettres intruses.
import { melanger } from './quiz.js'

export const DISTRACTEURS = 'aeinorstlu'
export const LONGUEUR_MAX = 10

export const nettoyer = (texte) =>
  texte
    .toLowerCase()
    .replace(/[¿?¡!.,…？]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

// La cible épelable d'un mot, ou null si elle est trop courte/longue.
export function cibleEpellation(mot) {
  const cible = nettoyer(mot.r ?? mot.t)
  return cible.length >= 2 && cible.length <= LONGUEUR_MAX ? cible : null
}

export function construireLettres(cible, alea = Math.random) {
  const aPlacer = cible.split('').filter((c) => c !== ' ')
  const extras = Array.from({ length: 2 }, () => DISTRACTEURS[Math.floor(alea() * DISTRACTEURS.length)])
  return melanger([...aPlacer, ...extras], alea).map((c, cle) => ({ c, cle }))
}

// Reconstruit le texte saisi en réinsérant les espaces des fentes.
export function assembler(fentes, placees) {
  const resultat = []
  let curseur = 0
  for (const c of fentes) resultat.push(c === ' ' ? ' ' : (placees[curseur++]?.c ?? ''))
  return resultat.join('')
}
