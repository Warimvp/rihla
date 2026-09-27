import { describe, expect, it } from 'vitest'
import { localeDuSysteme } from './i18n.js'
import { langueDuSens, sensPour } from './i18n.js'

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

// La langue dans laquelle le sens s'écrit : c'est elle que <Sens> pose en
// `lang`, elle ne doit jamais contredire le texte que rend `sensPour`.
describe('langueDuSens', () => {
  it('est la langue des définitions', () => {
    expect(langueDuSens('fr', 'tr')).toBe('fr')
    expect(langueDuSens('ar', 'tr')).toBe('ar')
  })

  it('bascule avec le sens quand la destination est la langue des définitions', () => {
    expect(langueDuSens('fr', 'fr')).toBe('ar')
    expect(langueDuSens('ar', 'ar')).toBe('fr')
    // Paris est toujours expliquée en arabe, Le Caire toujours en français.
    expect(langueDuSens('ar', 'fr')).toBe('ar')
    expect(langueDuSens('fr', 'ar')).toBe('fr')
  })

  it('désigne toujours la langue du texte rendu, même pour une source inattendue', () => {
    for (const source of ['fr', 'ar', 'auto', undefined]) {
      for (const destination of ['fr', 'ar', 'es', undefined]) {
        expect(mot[langueDuSens(source, destination)], `${source} → ${destination}`).toBe(sensPour(mot, source, destination))
      }
    }
  })
})
