import { describe, expect, it } from 'vitest'
import { construireQuiz, estBonne, melanger, mulberry32 } from './quiz.js'

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

  it('alterne compréhension et production', () => {
    expect(quiz.map((q) => q.type)).toEqual(
      quiz.map((_, i) => (i % 2 === 0 ? 'comprendre' : 'produire'))
    )
  })

  it('propose 4 options uniques dont exactement une bonne', () => {
    for (const question of quiz) {
      expect(question.options).toHaveLength(4)
      expect(new Set(question.options.map((o) => o.id)).size).toBe(4)
      const bonnes = question.options.filter((o) => estBonne(question, o))
      expect(bonnes).toHaveLength(1)
      expect(bonnes[0].id).toBe(question.mot.id)
    }
  })

  it('ne met pas systématiquement la bonne réponse à la même place', () => {
    const positions = new Set(
      quiz.map((q) => q.options.findIndex((o) => estBonne(q, o)))
    )
    expect(positions.size).toBeGreaterThan(1)
  })
})
