import { afterEach, describe, expect, it } from 'vitest'
import { parler, peutParler, voixPour } from './tts.js'

const voix = (lang, nom = lang, extra = {}) => ({ lang, name: nom, ...extra })

describe('voixPour', () => {
  it('prend la voix exacte quand elle existe', () => {
    const liste = [voix('fr-FR'), voix('sw-KE'), voix('en-GB')]
    expect(voixPour(liste, 'sw-KE').lang).toBe('sw-KE')
  })

  it('accepte une autre région de la MÊME langue', () => {
    const liste = [voix('fr-FR'), voix('sw-TZ')]
    expect(voixPour(liste, 'sw-KE').lang).toBe('sw-TZ')
  })

  it('préfère la région exacte au repli régional', () => {
    const liste = [voix('sw-TZ'), voix('sw-KE')]
    expect(voixPour(liste, 'sw-KE').lang).toBe('sw-KE')
  })

  it('ne se rabat JAMAIS sur une autre langue', () => {
    const liste = [voix('fr-FR'), voix('en-US'), voix('es-ES')]
    expect(voixPour(liste, 'sw-KE')).toBe(null)
    expect(voixPour(liste, 'fa-IR')).toBe(null)
  })

  it('rend null sur une liste vide ou un code absent', () => {
    expect(voixPour([], 'sw-KE')).toBe(null)
    expect(voixPour(undefined, 'sw-KE')).toBe(null)
    expect(voixPour([voix('sw-KE')], '')).toBe(null)
    expect(voixPour([voix('sw-KE')], undefined)).toBe(null)
  })

  it('ignore la casse et le séparateur des étiquettes système', () => {
    expect(voixPour([voix('SW_KE')], 'sw-KE').lang).toBe('SW_KE')
    expect(voixPour([voix('ar_sa')], 'ar-SA').lang).toBe('ar_sa')
  })

  it('départage plusieurs candidates : la voix par défaut, sinon une locale', () => {
    const liste = [voix('ar-EG'), voix('ar-MA', 'Maroc', { localService: true }), voix('ar-SA', 'Défaut', { default: true })]
    expect(voixPour(liste, 'ar-DZ').name).toBe('Défaut')
    expect(voixPour([voix('ar-EG'), voix('ar-MA', 'Maroc', { localService: true })], 'ar-DZ').name).toBe('Maroc')
  })
})

// Simule un appareil : `window` global, liste de voix donnée.
function poserAppareil(listeVoix) {
  const dites = []
  class Utterance {
    constructor(texte) {
      this.text = texte
    }
  }
  globalThis.SpeechSynthesisUtterance = Utterance
  globalThis.window = {
    SpeechSynthesisUtterance: Utterance,
    speechSynthesis: {
      getVoices: () => listeVoix,
      cancel: () => {},
      speak: (phrase) => dites.push(phrase),
    },
  }
  return dites
}

afterEach(() => {
  delete globalThis.window
  delete globalThis.SpeechSynthesisUtterance
})

describe('peutParler', () => {
  it('est faux sans API de synthèse vocale', () => {
    expect(peutParler('sw-KE')).toBe(false)
  })

  it('répond par LANGUE, pas par présence de l’API', () => {
    poserAppareil([voix('fr-FR'), voix('ar-SA')])
    expect(peutParler('ar-SA')).toBe(true)
    expect(peutParler('sw-KE')).toBe(false)
  })

  it('reste permissif tant que la liste des voix est vide (chargement asynchrone)', () => {
    poserAppareil([])
    expect(peutParler('sw-KE')).toBe(true)
  })
})

describe('parler', () => {
  it('passe la voix trouvée à l’utterance, pas seulement le code', () => {
    const dites = poserAppareil([voix('fr-FR'), voix('sw-TZ', 'Swahili')])
    expect(parler('jambo', 'sw-KE')).toBe(true)
    expect(dites).toHaveLength(1)
    expect(dites[0].voice.name).toBe('Swahili')
    expect(dites[0].lang).toBe('sw-TZ')
  })

  it('se tait plutôt que de prononcer le swahili avec une voix française', () => {
    const dites = poserAppareil([voix('fr-FR'), voix('en-US')])
    expect(parler('jambo', 'sw-KE')).toBe(false)
    expect(dites).toHaveLength(0)
  })

  it('tente quand même la lecture tant que la liste est inconnue', () => {
    const dites = poserAppareil([])
    expect(parler('jambo', 'sw-KE')).toBe(true)
    expect(dites[0].lang).toBe('sw-KE')
    expect(dites[0].voice).toBe(undefined)
  })
})
