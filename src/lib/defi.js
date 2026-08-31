// L'étape du jour : 10 questions tirées dans TOUTES les langues, avec une
// graine dérivée de la date — même tirage pour tout le monde, chaque jour.
import { melanger, mulberry32 } from './quiz.js'

export const NB_QUESTIONS_DEFI = 10

// Les options sont des concepts (id partagé entre langues) : la bonne réponse
// se juge au concept, jamais deux options avec le même sens.
export function construireDefi(langues, jour, nbQuestions = NB_QUESTIONS_DEFI) {
  const graine = Number(jour.replaceAll('-', '')) % 2147483647
  const alea = mulberry32(graine)
  const paires = langues.flatMap((langue) =>
    langue.lecons.flatMap((lecon) => lecon.mots.map((mot) => ({ langue, mot })))
  )
  const tirage = melanger(paires, alea).slice(0, nbQuestions)
  return tirage.map(({ langue, mot }) => {
    const options = [mot]
    for (const paire of melanger(paires, alea)) {
      if (options.length === 4) break
      if (!options.some((option) => option.id === paire.mot.id)) options.push(paire.mot)
    }
    return { langue, mot, options: melanger(options, alea) }
  })
}

export const estBonneOption = (question, option) => option.id === question.mot.id
