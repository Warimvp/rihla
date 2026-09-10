// Moteur de quiz : pur et déterministe quand on lui injecte un générateur,
// pour être testable (et cassable — un test qui ne peut pas échouer ne prouve rien).
import { cibleEpellation, construireLettres } from './epellation.js'

// Petit générateur pseudo-aléatoire seedable (mulberry32).
export function mulberry32(graine) {
  let a = graine >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Copie mélangée (Fisher-Yates).
export function melanger(tableau, alea = Math.random) {
  const copie = tableau.slice()
  for (let i = copie.length - 1; i > 0; i--) {
    const j = Math.floor(alea() * (i + 1))
    ;[copie[i], copie[j]] = [copie[j], copie[i]]
  }
  return copie
}

// 3 distracteurs pris dans la même leçon (jamais le mot lui-même, jamais deux fois le même).
export function choisirDistracteurs(mots, mot, n, alea = Math.random) {
  const autres = mots.filter((m) => m.id !== mot.id)
  return melanger(autres, alea).slice(0, n)
}

// Une question par mot, en variant les exercices (façon Duolingo) :
// - 'comprendre' : on montre le mot dans la langue cible, on choisit son sens ;
// - 'ecouter'    : on ENTEND seulement le mot, on choisit son sens ;
// - 'produire'   : on montre le sens, on choisit le mot dans la langue cible ;
// - 'epeler'     : on montre le sens, on épelle le mot avec des tuiles-lettres ;
// et, un tour sur deux, deux substitutions :
// - 'lire'       : à la place de 'comprendre' — on montre le mot dans son
//                  ÉCRITURE seule, on choisit sa romanisation (si le mot en a
//                  une : sept langues sur quatorze) ;
// - 'voir'       : à la place de 'produire' — on montre une IMAGE du concept,
//                  on choisit le mot cible, sans passer par le français ni par
//                  l'arabe. L'image est une capacité INJECTÉE
//                  (`capacites.aVisuel(mot)`), jamais importée ici : un test
//                  peut la donner ou la retirer, donc peut échouer.
// Replis : sans audio, 'ecouter' redevient 'comprendre' ; un mot trop long
// pour l'épellation redevient 'produire' ; sans romanisation, 'lire' reste
// 'comprendre' ; sans image, 'voir' reste 'produire'. Le cycle reste à quatre
// et les substitutions ne touchent que le second tour : une leçon de huit
// garde ainsi un exercice de chaque sorte.
export const CYCLE_EXERCICES = ['comprendre', 'ecouter', 'produire', 'epeler']
export const TYPES_EXERCICES = [...CYCLE_EXERCICES, 'lire', 'voir']

const jamais = () => false

export function construireQuiz(mots, alea = Math.random, capacites = { audio: true }) {
  const aVisuel = capacites.aVisuel ?? jamais
  const romanises = mots.filter((m) => m.r)
  return melanger(mots, alea).map((mot, i) => {
    const base = CYCLE_EXERCICES[i % CYCLE_EXERCICES.length]
    const secondTour = Math.floor(i / CYCLE_EXERCICES.length) % 2 === 1
    let type = base
    if (base === 'ecouter' && !capacites.audio) type = 'comprendre'
    if (base === 'comprendre' && secondTour && mot.r && romanises.length >= 4) type = 'lire'
    if (base === 'produire' && secondTour && aVisuel(mot)) type = 'voir'
    if (type === 'epeler') {
      const cible = cibleEpellation(mot)
      if (cible) return { mot, type, cible, fentes: cible.split(''), lettres: construireLettres(cible, alea) }
      type = 'produire'
    }
    // Les options de « lire » sont des romanisations : les distracteurs doivent en avoir une.
    const vivier = type === 'lire' ? romanises : mots
    return { mot, type, options: melanger([mot, ...choisirDistracteurs(vivier, mot, 3, alea)], alea) }
  })
}

export const estBonne = (question, option) => option.id === question.mot.id
