import { describe, expect, it } from 'vitest'
import { localeDuSysteme } from './i18n.js'
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

describe('la langue du premier lancement', () => {
  it('est l’arabe quand le téléphone est en arabe, le français sinon', () => {
    expect(localeDuSysteme(['ar-MA', 'fr-FR'])).toBe('ar')
    expect(localeDuSysteme(['ar'])).toBe('ar')
    expect(localeDuSysteme('AR-eg')).toBe('ar')
    // Seule la langue PRÉFÉRÉE compte : l'arabe en second ne fait pas basculer.
    expect(localeDuSysteme(['fr-MA', 'ar-MA'])).toBe('fr')
    expect(localeDuSysteme(['en-US'])).toBe('fr')
    // « arn » (mapudungun) n'est pas de l'arabe.
    expect(localeDuSysteme(['arn-CL'])).toBe('fr')
    for (const rien of [null, undefined, [], '', {}]) expect(localeDuSysteme(rien)).toBe('fr')
  })
})
