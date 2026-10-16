// Quelle graine donne, dans l'app, la suite de questions voulue ? Le moteur (src/lib/quiz.js) est pur :
// on le rejoue ici avec le même générateur que celui posé dans la page par scripts/app.mjs.
import { LANGUES } from '../../src/data/langues.js'
import { construireQuiz, mulberry32 } from '../../src/lib/quiz.js'

export const quizDeGraine = (langueId, leconId, graine) => {
  const lecon = LANGUES.find((l) => l.id === langueId).lecons.find((l) => l.id === leconId)
  const alea = mulberry32(graine)
  const construire = () => construireQuiz(lecon.mots, alea, { audio: true, aVisuel: () => false })
  // React.StrictMode (dev) appelle le useMemo de la leçon DEUX fois sur le même flux : c'est le second tirage qu'on voit.
  construire()
  return construire()
}

if (process.argv[1].endsWith('graines.mjs')) {
  const [langueId, leconId, ...voulu] = process.argv.slice(2) // ex: en salutations jemappelle:comprendre oui:ecouter merci:ordonner|produire stp:epeler
  const attendu = voulu.map((v) => v.split(':'))
  const trouvees = []
  for (let g = 1; g <= 60000 && trouvees.length < 12; g++) {
    const quiz = quizDeGraine(langueId, leconId, g)
    if (attendu.every(([id, types], i) => quiz[i].mot.id === id && types.split('|').includes(quiz[i].type))) trouvees.push(g)
  }
  console.log(trouvees)
  const lecon = LANGUES.find((l) => l.id === langueId).lecons.find((l) => l.id === leconId)
  console.log(lecon.mots.map((m) => `${m.id}=${m.t}`).join('  '))
  if (trouvees[0]) console.log(quizDeGraine(langueId, leconId, trouvees[0]).slice(0, 5).map((q) => `${q.type}:${q.mot.id}:${q.mot.t}`))
}
