import { describe, expect, it } from 'vitest'
import { LANGUES } from './langues.js'

// Garde-fou du contenu : les sens sont partagés par index entre toutes les
// langues — si une langue oublie une leçon ou un mot, ça doit casser ici.
describe('données des langues', () => {
  it('chaque destination a les 6 leçons complètes et alignées', () => {
    for (const langue of LANGUES) {
      expect(langue.lecons.map((l) => l.id)).toEqual([
        'salutations',
        'enroute',
        'atable',
        'nombres',
        'marche',
        'jours',
      ])
      for (const lecon of langue.lecons) {
        expect(lecon.mots).toHaveLength(8)
        expect(new Set(lecon.mots.map((m) => m.id)).size).toBe(8)
        for (const mot of lecon.mots) {
          expect(mot.t?.length).toBeGreaterThan(0)
          expect(mot.fr?.length).toBeGreaterThan(0)
          expect(mot.ar?.length).toBeGreaterThan(0)
        }
      }
    }
  })

  it('les écritures non latines portent toutes une romanisation', () => {
    for (const id of ['fa', 'hi', 'zh', 'ja']) {
      const langue = LANGUES.find((l) => l.id === id)
      for (const lecon of langue.lecons) {
        for (const mot of lecon.mots) {
          expect(mot.r?.length, `${id} · ${lecon.id} · ${mot.id}`).toBeGreaterThan(0)
        }
      }
    }
  })
})
