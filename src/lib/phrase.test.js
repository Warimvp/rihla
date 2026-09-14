import { describe, expect, it } from 'vitest'
import { LANGUES } from '../data/langues.js'
import { mulberry32 } from './quiz.js'
import { INTRUS, ciblePhrase, construireTuilesMots, estPhraseJuste, jetonsPhrase } from './phrase.js'

const enTuiles = (jetons) => jetons.map((m) => ({ m }))

describe('jetonsPhrase', () => {
  it('coupe aux espaces et retire la ponctuation, qui désignerait le début et la fin', () => {
    expect(jetonsPhrase('¿A qué te dedicas?')).toEqual(['A', 'qué', 'te', 'dedicas'])
    expect(jetonsPhrase('La cuenta, por favor')).toEqual(['La', 'cuenta', 'por', 'favor'])
  })

  it('ne fait pas de tuile du « … » d’une phrase à compléter', () => {
    expect(jetonsPhrase('esm-é man … ast')).toEqual(['esm-é', 'man', 'ast'])
  })
})

describe('ciblePhrase', () => {
  it('à partir de trois mots seulement', () => {
    expect(ciblePhrase({ t: 'Por favor' })).toBe(null)
    expect(ciblePhrase({ t: 'Me llamo…' })).toBe(null)
    expect(ciblePhrase({ t: 'Wie geht es dir?' })).toEqual(['Wie', 'geht', 'es', 'dir'])
  })

  it('passe par la romanisation : le chinois n’a pas d’espaces, son pinyin si', () => {
    expect(ciblePhrase({ t: '你是哪里人？', r: 'nǐ shì nǎlǐ rén ?' })).toEqual(['nǐ', 'shì', 'nǎlǐ', 'rén'])
    expect(ciblePhrase({ t: '你是哪里人？' })).toBe(null)
  })
})

describe('construireTuilesMots', () => {
  const jetons = ['La', 'cuenta', 'por', 'favor']
  const autres = [{ t: 'Por favor' }, { t: 'El menú' }, { t: 'Agua sin gas' }, { t: 'Gracias' }]

  it('donne toute la phrase, plus deux intrus qui n’y sont pas', () => {
    const tuiles = construireTuilesMots(jetons, autres, mulberry32(3))
    expect(tuiles).toHaveLength(jetons.length + INTRUS)
    const textes = tuiles.map((t) => t.m)
    for (const j of jetons) expect(textes).toContain(j)
    const intrus = textes.filter((m) => !jetons.includes(m))
    expect(intrus).toHaveLength(INTRUS)
    // « Por » (majuscule) est le « por » de la phrase : jamais un intrus.
    for (const m of intrus) expect(jetons.map((j) => j.toLowerCase())).not.toContain(m.toLowerCase())
    expect(new Set(tuiles.map((t) => t.cle)).size).toBe(tuiles.length)
  })

  it('ne prend JAMAIS pour intrus un mot de la phrase, quelle que soit la graine', () => {
    // Seuls « El » et « menú » ne sont pas déjà dans la phrase (« Por » = « por »).
    const recouvrants = [{ t: 'Por favor' }, { t: 'la cuenta' }, { t: 'El menú' }]
    for (let graine = 1; graine <= 20; graine++) {
      const reste = construireTuilesMots(jetons, recouvrants, mulberry32(graine)).map((t) => t.m)
      for (const j of jetons) reste.splice(reste.indexOf(j), 1)
      expect(reste.sort(), `graine ${graine}`).toEqual(['El', 'menú'])
    }
  })

  it('est déterministe à graine égale', () => {
    const a = construireTuilesMots(jetons, autres, mulberry32(9)).map((t) => t.m)
    const b = construireTuilesMots(jetons, autres, mulberry32(9)).map((t) => t.m)
    expect(a).toEqual(b)
  })
})

describe('estPhraseJuste', () => {
  const jetons = ['How', 'much', 'is', 'it']
  it('exige tous les mots, dans l’ordre, et rien d’autre', () => {
    expect(estPhraseJuste(jetons, enTuiles(['How', 'much', 'is', 'it']))).toBe(true)
    expect(estPhraseJuste(jetons, enTuiles(['much', 'How', 'is', 'it']))).toBe(false)
    expect(estPhraseJuste(jetons, enTuiles(['How', 'much', 'is']))).toBe(false)
    expect(estPhraseJuste(jetons, enTuiles(['How', 'much', 'is', 'that']))).toBe(false)
  })
})

describe('sur les 14 langues', () => {
  it('chaque phrase ordonnable trouve ses deux intrus dans sa leçon — chinois et japonais compris', () => {
    const parLangue = {}
    for (const langue of LANGUES) {
      for (const lecon of langue.lecons) {
        for (const mot of lecon.mots) {
          const jetons = ciblePhrase(mot)
          if (!jetons) continue
          parLangue[langue.id] = (parLangue[langue.id] ?? 0) + 1
          const tuiles = construireTuilesMots(jetons, lecon.mots.filter((m) => m.id !== mot.id), mulberry32(1))
          expect(tuiles, `${langue.id}:${mot.id}`).toHaveLength(jetons.length + INTRUS)
          // Ôtée la phrase, il ne reste que des intrus — aucun n'est un de ses mots.
          const reste = tuiles.map((x) => x.m)
          for (const j of jetons) reste.splice(reste.indexOf(j), 1)
          const dansLaPhrase = new Set(jetons.map((j) => j.toLowerCase()))
          expect(reste.filter((m) => dansLaPhrase.has(m.toLowerCase())), `${langue.id}:${mot.id}`).toEqual([])
        }
      }
    }
    expect(parLangue.zh).toBeGreaterThan(0)
    expect(parLangue.ja).toBeGreaterThan(0)
    expect(Object.values(parLangue).reduce((a, b) => a + b, 0)).toBeGreaterThan(600)
  })
})
