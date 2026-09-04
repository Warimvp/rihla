import { describe, expect, it } from 'vitest'
import { sensPour } from './i18n.js'

const mot = { fr: 'Merci', ar: 'شكرا' }

describe('sensPour', () => {
  it('respecte la langue des définitions choisie', () => {
    expect(sensPour(mot, 'fr', 'tr')).toBe('Merci')
    expect(sensPour(mot, 'ar', 'tr')).toBe('شكرا')
  })

  it('bascule sur l’autre langue quand on apprend justement celle des définitions', () => {
    expect(sensPour(mot, 'ar', 'ar')).toBe('Merci')
    expect(sensPour(mot, 'fr', 'fr')).toBe('شكرا')
  })
})
