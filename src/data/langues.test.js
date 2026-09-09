import { describe, expect, it } from 'vitest'
import { LANGUES } from './langues.js'

// Garde-fou du contenu : les sens sont partagés par index entre toutes les
// langues — si une langue oublie une leçon ou un mot, ça doit casser ici.
describe('données des langues', () => {
  it('chaque destination a les 24 leçons complètes et alignées, niveaux compris', () => {
    for (const langue of LANGUES) {
      expect(langue.lecons.map((l) => l.id)).toEqual([
        'salutations',
        'enroute',
        'atable',
        'nombres',
        'marche',
        'jours',
        'couleurs',
        'famille',
        'rencontre',
        'debrouille',
        'exprimer',
        'meteo',
        'heure',
        'hotel',
        'sante',
        'telephone',
        'transport',
        'ville',
        'maison',
        'corps',
        'travail',
        'souvenirs',
        'projets',
        'opinions',
      ])
      expect(langue.lecons.map((l) => l.niveau)).toEqual([
        1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5,
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

  it('aucun doublon dans une même langue : ids et textes cibles restent distincts', () => {
    for (const langue of LANGUES) {
      const mots = langue.lecons.flatMap((l) => l.mots)
      expect(new Set(mots.map((m) => m.id)).size, `ids · ${langue.id}`).toBe(mots.length)
      // Deux mots au texte identique donneraient deux tuiles jumelles au Zellige
      // ou deux bonnes réponses au quiz : le contenu doit rester discriminant.
      expect(new Set(mots.map((m) => m.t)).size, `textes · ${langue.id}`).toBe(mots.length)
    }
  })

  it('les sens partagés sont uniques : deux options ne peuvent pas dire la même chose', () => {
    const mots = LANGUES[0].lecons.flatMap((l) => l.mots)
    expect(new Set(mots.map((m) => m.fr)).size, 'sens FR').toBe(mots.length)
    expect(new Set(mots.map((m) => m.ar)).size, 'sens AR').toBe(mots.length)
  })

  it('les écritures non latines portent toutes une romanisation', () => {
    for (const id of ['fa', 'hi', 'zh', 'ja', 'ar', 'ru', 'ko']) {
      const langue = LANGUES.find((l) => l.id === id)
      for (const lecon of langue.lecons) {
        for (const mot of lecon.mots) {
          expect(mot.r?.length, `${id} · ${lecon.id} · ${mot.id}`).toBeGreaterThan(0)
        }
      }
    }
  })
})
