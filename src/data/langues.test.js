import { describe, expect, it } from 'vitest'
import { sensPour } from '../i18n.js'
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

  it('suit la route : quinze destinations rangées par distance, Paris entre Lisbonne et Venise', () => {
    expect(LANGUES.map((l) => l.id)).toEqual([
      'es', 'pt', 'fr', 'it', 'de', 'en', 'tr', 'ar', 'ru', 'fa', 'sw', 'hi', 'zh', 'ko', 'ja',
    ])
    const km = LANGUES.map((l) => l.km)
    expect(km).toEqual([...km].sort((a, b) => a - b))
    for (const langue of LANGUES) expect(langue.tts, langue.id).toMatch(/^[a-z]{2}-[A-Z]{2}$/)
  })

  it('le français et l’arabe sont les deux langues des définitions : leurs mots cibles SONT les sens', () => {
    // C'est ce qui oblige `sensPour` à basculer sur l'autre langue — et ce
    // qui garantit que la destination ne dérive pas du programme commun.
    const typo = (texte) => texte.replaceAll("'", '’')
    for (const [id, champ] of [['fr', 'fr'], ['ar', 'ar']]) {
      const langue = LANGUES.find((l) => l.id === id)
      for (const mot of langue.lecons.flatMap((l) => l.mots)) {
        expect(mot.t, `${id}:${mot.id}`).toBe(typo(mot[champ]))
        expect(sensPour(mot, id, id), `${id}:${mot.id}`).not.toBe(mot[champ])
      }
    }
    // Écriture latine : pas de romanisation, donc pas d'exercice « lire ».
    expect(LANGUES.find((l) => l.id === 'fr').lecons.flatMap((l) => l.mots).some((m) => m.r)).toBe(false)
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
