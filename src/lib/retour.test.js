import { describe, expect, it, vi } from 'vitest'
import { EVENEMENT_RETOUR, profondeurDe, retenirRetour } from './retour.js'

describe('le retour du système', () => {
  it('lit la profondeur que porte une entrée de l’historique, et rien d’autre', () => {
    expect(profondeurDe({ rihla: 1 })).toBe(1)
    expect(profondeurDe({ rihla: 3 })).toBe(3)
    // La page d'arrivée, un lien #barid=…, l'état d'une autre app : zéro.
    for (const etat of [null, undefined, {}, { rihla: 0 }, { rihla: -1 }, { rihla: '2' }, { rihla: 1.5 }, { autre: 1 }, 'x']) {
      expect(profondeurDe(etat), JSON.stringify(etat)).toBe(0)
    }
  })

  it('laisse l’écran retenir le voyageur : l’événement est annulé, la demande posée', () => {
    const cible = new EventTarget()
    const surDemande = vi.fn()
    const lacher = retenirRetour(surDemande, cible)
    // dispatchEvent rend false quand quelqu'un a retenu le retour.
    expect(cible.dispatchEvent(new Event(EVENEMENT_RETOUR, { cancelable: true }))).toBe(false)
    expect(surDemande).toHaveBeenCalledTimes(1)
    // Désabonné, l'écran ne retient plus rien : le retour ferme.
    lacher()
    expect(cible.dispatchEvent(new Event(EVENEMENT_RETOUR, { cancelable: true }))).toBe(true)
    expect(surDemande).toHaveBeenCalledTimes(1)
  })
})
