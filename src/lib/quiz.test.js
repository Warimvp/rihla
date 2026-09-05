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

  it('ne met pas systématiquement la bonne réponse à la même place', () => {
    const positions = new Set(
      quiz.filter((q) => q.options).map((q) => q.options.findIndex((o) => estBonne(q, o)))
    )
    expect(positions.size).toBeGreaterThan(1)
  })
})
