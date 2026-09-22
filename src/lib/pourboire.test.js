import { describe, expect, it } from 'vitest'
import { CLE_POURBOIRE, lienPourboire } from './pourboire.js'

const ADRESSE = 'https://ko-fi.com/rihla'

describe('le pourboire', () => {
  it('n’existe pas sans adresse — le web est identique à avant', () => {
    expect(lienPourboire({ adresse: '', natif: false })).toBe(null)
    expect(lienPourboire({ adresse: undefined, natif: false })).toBe(null)
  })

  it('n’existe JAMAIS sur un appareil natif, même avec une adresse embarquée', () => {
    // Le garde-fou de la ligne directrice 3.1.1 : un lien de paiement dans
    // l'app iOS, c'est un rejet. Retirer ce verrou doit casser ce test.
    expect(lienPourboire({ adresse: ADRESSE, natif: true })).toBe(null)
  })

  it('exige https', () => {
    expect(lienPourboire({ adresse: 'http://ko-fi.com/rihla', natif: false })).toBe(null)
    expect(lienPourboire({ adresse: 'ko-fi.com/rihla', natif: false })).toBe(null)
    expect(lienPourboire({ adresse: 'javascript:alert(1)', natif: false })).toBe(null)
  })

  it('rend l’adresse sur le web, espaces en trop compris', () => {
    expect(lienPourboire({ adresse: `  ${ADRESSE}  `, natif: false })).toBe(ADRESSE)
  })

  it('lit la clé locale quand rien n’est passé — et la refuse sur natif', () => {
    const avant = globalThis.localStorage
    globalThis.localStorage = { getItem: (c) => (c === CLE_POURBOIRE ? ADRESSE : null) }
    try {
      expect(lienPourboire({ natif: false })).toBe(ADRESSE)
      expect(lienPourboire({ natif: true })).toBe(null)
    } finally {
      if (avant === undefined) delete globalThis.localStorage
      else globalThis.localStorage = avant
    }
  })
})
