import { describe, expect, it } from 'vitest'
import { CYCLE_EXERCICES, construireQuiz, estBonne, melanger, mulberry32 } from './quiz.js'
import { assembler, cibleEpellation } from './epellation.js'

const MOTS = [
  { id: 'bonjour', t: 'Merhaba', fr: 'Bonjour', ar: 'مرحبا' },
  { id: 'merci', t: 'Teşekkürler', fr: 'Merci', ar: 'شكرا' },
  { id: 'oui', t: 'Evet', fr: 'Oui', ar: 'نعم' },
  { id: 'non', t: 'Hayır', fr: 'Non', ar: 'لا' },
  { id: 'stp', t: 'Lütfen', fr: "S'il te plaît", ar: 'من فضلك' },
  { id: 'aurevoir', t: 'Hoşça kal', fr: 'Au revoir', ar: 'مع السلامة' },
  { id: 'cava', t: 'Nasılsın?', fr: 'Comment ça va ?', ar: 'كيف حالك؟' },
  { id: 'jemappelle', t: 'Benim adım…', fr: 'Je m’appelle…', ar: 'اسمي…' },
]

describe('melanger', () => {
  it('garde exactement les mêmes éléments', () => {
    const melange = melanger(MOTS, mulberry32(7))
    expect(melange).toHaveLength(MOTS.length)
    expect(new Set(melange.map((m) => m.id))).toEqual(new Set(MOTS.map((m) => m.id)))
  })

  it('est déterministe à graine égale', () => {
    const a = melanger(MOTS, mulberry32(42)).map((m) => m.id)
    const b = melanger(MOTS, mulberry32(42)).map((m) => m.id)
    expect(a).toEqual(b)
  })
})

describe('construireQuiz', () => {
  const quiz = construireQuiz(MOTS, mulberry32(1))

  it('pose une question par mot, chaque mot une seule fois', () => {
    expect(quiz).toHaveLength(MOTS.length)
    expect(new Set(quiz.map((q) => q.mot.id)).size).toBe(MOTS.length)
  })

  it('suit le cycle des exercices, avec repli épellation → production si le mot est trop long', () => {
    quiz.forEach((question, i) => {
      const base = CYCLE_EXERCICES[i % CYCLE_EXERCICES.length]
      if (base === 'epeler') {
        expect(question.type).toBe(cibleEpellation(question.mot) ? 'epeler' : 'produire')
      } else {
        expect(question.type).toBe(base)
      }
    })
    expect(quiz.some((q) => q.type === 'ecouter')).toBe(true)
  })

  it('sans audio, les questions d’écoute redeviennent de la compréhension', () => {
    const sansAudio = construireQuiz(MOTS, mulberry32(1), { audio: false })
    expect(sansAudio.some((q) => q.type === 'ecouter')).toBe(false)
    sansAudio.forEach((question, i) => {
      if (CYCLE_EXERCICES[i % CYCLE_EXERCICES.length] === 'ecouter') {
        expect(question.type).toBe('comprendre')
      }
    })
  })

  it('les questions à choix proposent 4 options uniques dont exactement une bonne', () => {
    const aChoix = quiz.filter((q) => q.type !== 'epeler')
    expect(aChoix.length).toBeGreaterThan(0)
    for (const question of aChoix) {
      expect(question.options).toHaveLength(4)
      expect(new Set(question.options.map((o) => o.id)).size).toBe(4)
      const bonnes = question.options.filter((o) => estBonne(question, o))
      expect(bonnes).toHaveLength(1)
      expect(bonnes[0].id).toBe(question.mot.id)
    }
  })

  it('les questions d’épellation portent la cible, ses fentes et toutes ses lettres', () => {
    const epellations = quiz.filter((q) => q.type === 'epeler')
    expect(epellations.length).toBeGreaterThan(0)
    for (const question of epellations) {
      expect(question.cible).toBe(cibleEpellation(question.mot))
      expect(question.fentes.join('')).toBe(question.cible)
      const attendues = question.cible.split('').filter((c) => c !== ' ')
      expect(question.lettres).toHaveLength(attendues.length + 2)
      const disponibles = question.lettres.map((l) => l.c)
      for (const lettre of attendues) {
        const iDispo = disponibles.indexOf(lettre)
        expect(iDispo).toBeGreaterThanOrEqual(0)
        disponibles.splice(iDispo, 1)
      }
      expect(assembler(question.fentes, question.cible.split('').filter((c) => c !== ' ').map((c) => ({ c })))).toBe(question.cible)
    }
  })

  // Second tour = questions 5 à 8 d'une leçon de huit.
  const ROMANISES = MOTS.map((m) => ({ ...m, t: `${m.t}-ecrit`, r: `${m.id} (lu)` }))

  it('« lire » remplace la compréhension du second tour quand le mot a une romanisation', () => {
    const quiz = construireQuiz(ROMANISES, mulberry32(1))
    expect(quiz[0].type).toBe('comprendre')
    expect(quiz[4].type).toBe('lire')
    expect(quiz[4].options).toHaveLength(4)
    expect(quiz[4].options.every((o) => o.r)).toBe(true)
    expect(quiz.filter((q) => q.type === 'lire')).toHaveLength(1)
    // Sans romanisation : jamais.
    expect(construireQuiz(MOTS, mulberry32(1)).some((q) => q.type === 'lire')).toBe(false)
  })

  it('« voir » remplace la production du second tour quand une image est injectée', () => {
    const avec = construireQuiz(MOTS, mulberry32(1), { audio: true, aVisuel: () => true })
    expect(avec[2].type).toBe('produire')
    expect(avec[6].type).toBe('voir')
    expect(avec[6].options).toHaveLength(4)
    expect(avec[6].options.filter((o) => estBonne(avec[6], o))).toHaveLength(1)
    // Sans image pour CE mot, la question reste une production.
    const seulement = construireQuiz(MOTS, mulberry32(1), { audio: true, aVisuel: (mot) => mot.id === 'jamais' })
    expect(seulement[6].type).toBe('produire')
    // Et sans capacité du tout (l'appel historique) : jamais.
    expect(quiz.some((q) => q.type === 'voir')).toBe(false)
  })

  it('ne met pas systématiquement la bonne réponse à la même place', () => {
    const positions = new Set(
      quiz.filter((q) => q.options).map((q) => q.options.findIndex((o) => estBonne(q, o)))
    )
    expect(positions.size).toBeGreaterThan(1)
  })
})
