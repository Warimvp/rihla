import { describe, expect, it } from 'vitest'
import { construireDefi, estBonneOption, NB_QUESTIONS_DEFI } from './defi.js'
import { LANGUES } from '../data/langues.js'

const cle = (q) => `${q.langue.id}:${q.mot.id}`

describe('construireDefi', () => {
  it('donne le même tirage pour la même date (graine partagée)', () => {
    const a = construireDefi(LANGUES, '2026-08-30').map(cle)
    const b = construireDefi(LANGUES, '2026-08-30').map(cle)
    expect(a).toEqual(b)
  })

  it('change de tirage quand la date change', () => {
    const a = construireDefi(LANGUES, '2026-08-30').map(cle)
    const b = construireDefi(LANGUES, '2026-08-31').map(cle)
    expect(a).not.toEqual(b)
  })

  it('pose 10 questions mélangeant plusieurs langues', () => {
    const defi = construireDefi(LANGUES, '2026-08-30')
    expect(defi).toHaveLength(NB_QUESTIONS_DEFI)
    expect(new Set(defi.map((q) => q.langue.id)).size).toBeGreaterThan(2)
  })

  it('propose 4 options de concepts distincts dont exactement la bonne', () => {
    for (const question of construireDefi(LANGUES, '2026-08-30')) {
      expect(question.options).toHaveLength(4)
      expect(new Set(question.options.map((o) => o.id)).size).toBe(4)
      const bonnes = question.options.filter((o) => estBonneOption(question, o))
      expect(bonnes).toHaveLength(1)
    }
  })
})
