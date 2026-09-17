import { describe, expect, it } from 'vitest'
import { getDictionary } from '../i18n.js'
import { LANGUES } from './langues.js'
import { DEPART, VOYAGEURS, motsVoyageurs, totalVoyageurs } from './voyageurs.js'

// Ces mots affirment une histoire : chacun doit porter sa preuve, et rien
// dans la forme ne doit trahir une saisie à la hâte.
const ECRITURE_ARABE = /^[؀-ۿ\s]+$/
const LATIN = /^[\p{Script=Latin}\s'’\-ʾʿ]+$/u
const romanisees = new Set(LANGUES.filter((l) => l.lecons[0].mots.every((m) => m.r)).map((l) => l.id))
const fr = getDictionary('fr')
const ar = getDictionary('ar')

describe('les mots voyageurs', () => {
  it('ne connaissent que des destinations de la route, et Le Caire n’en a pas : il est le départ', () => {
    const ids = new Set(LANGUES.map((l) => l.id))
    for (const id of Object.keys(VOYAGEURS)) expect(ids.has(id), id).toBe(true)
    expect(motsVoyageurs(DEPART)).toEqual([])
    expect(motsVoyageurs('inconnue')).toEqual([])
  })

  it('chacun a son origine écrite en arabe, sa translittération, ses sens FR et AR, et sa preuve Wiktionary', () => {
    for (const [id, mots] of Object.entries(VOYAGEURS)) {
      for (const mot of mots) {
        const nom = `${id}:${mot.t}`
        expect(mot.t?.trim(), nom).toBeTruthy()
        expect(mot.arabe, nom).toMatch(ECRITURE_ARABE)
        expect(mot.arabeR, nom).toMatch(LATIN)
        expect(mot.fr?.trim(), nom).toBeTruthy()
        // Le sens arabe peut porter une glose entre parenthèses, jamais de latin.
        expect(mot.ar, nom).toMatch(/[؀-ۿ]/)
        expect(mot.ar, nom).not.toMatch(/[A-Za-z]/)
        expect(mot.preuve, nom).toMatch(/^https:\/\/(en|fr)\.wiktionary\.org\/wiki\/\S+$/)
      }
    }
  })

  it('portent une romanisation exactement quand l’écriture de la destination n’est pas latine', () => {
    for (const [id, mots] of Object.entries(VOYAGEURS)) {
      for (const mot of mots) {
        if (romanisees.has(id)) expect(mot.r, `${id}:${mot.t}`).toMatch(/\S/)
        else expect(mot.r, `${id}:${mot.t}`).toBeUndefined()
      }
    }
  })

  it('nomment chaque langue de leur chemin en français ET en arabe', () => {
    for (const mots of Object.values(VOYAGEURS)) {
      for (const mot of mots) {
        for (const etape of mot.chemin ?? []) {
          expect(fr.voyageurs.langues[etape], etape).toBeTruthy()
          expect(ar.voyageurs.langues[etape], etape).toBeTruthy()
        }
      }
    }
  })

  it('n’apparaissent qu’une fois par destination, et le compte du Caire les compte tous', () => {
    let total = 0
    for (const mots of Object.values(VOYAGEURS)) {
      expect(new Set(mots.map((m) => m.t)).size).toBe(mots.length)
      total += mots.length
    }
    expect(totalVoyageurs()).toBe(total)
  })
})
