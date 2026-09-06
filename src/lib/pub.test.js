import { describe, expect, it } from 'vitest'
import {
  ETAPES_ENTRE_INTERSTITIELS,
  MINUTES_ENTRE_INTERSTITIELS,
  compterEtape,
  marquerInterstitiel,
  peutMontrerInterstitiel,
  pubsDisponibles,
  regarderPourUneNuit,
} from './pub.js'

const MINUTE = 60_000

describe('quota des interstitielles', () => {
  it('exige à la fois assez d’étapes ET assez de temps', () => {
    const maintenant = 10_000_000
    const recent = { derniere: maintenant - 2 * MINUTE, etapesDepuis: 5 }
    expect(peutMontrerInterstitiel(recent, maintenant)).toBe(false)

    const peuDEtapes = { derniere: maintenant - 30 * MINUTE, etapesDepuis: 1 }
    expect(peutMontrerInterstitiel(peuDEtapes, maintenant)).toBe(false)

    const ok = { derniere: maintenant - MINUTES_ENTRE_INTERSTITIELS * MINUTE, etapesDepuis: ETAPES_ENTRE_INTERSTITIELS }
    expect(peutMontrerInterstitiel(ok, maintenant)).toBe(true)
  })

  it('compte les étapes et repart à zéro après un affichage', () => {
    let etat = { derniere: 0, etapesDepuis: 0 }
    etat = compterEtape(compterEtape(etat))
    expect(etat.etapesDepuis).toBe(2)
    expect(peutMontrerInterstitiel(etat, 1_000_000)).toBe(false)
    etat = compterEtape(etat)
    expect(peutMontrerInterstitiel(etat, 1_000_000)).toBe(true)
    etat = marquerInterstitiel(1_000_000)
    expect(etat.etapesDepuis).toBe(0)
    expect(peutMontrerInterstitiel(etat, 1_000_000)).toBe(false)
  })
})

describe('sans fournisseur branché', () => {
  it('l’app se comporte comme si la pub n’existait pas', async () => {
    expect(pubsDisponibles()).toBe(false)
    await expect(regarderPourUneNuit()).resolves.toBe('indisponible')
  })
})
