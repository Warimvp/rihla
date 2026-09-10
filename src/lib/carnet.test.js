import { describe, expect, it } from 'vitest'
import {
  INTERVALLES,
  RANG_MAX,
  TAILLE_SESSION,
  ajouterAuCarnet,
  composerSession,
  construireRevision,
  estDue,
  joursAvantProchaine,
  motsDus,
  prochaineBoite,
  reviserMot,
  tailleCarnet,
} from './carnet.js'
import { mulberry32 } from './quiz.js'
import { progresInitial } from './progression.js'
import { LANGUES } from '../data/langues.js'

const es = LANGUES.find((l) => l.id === 'es')
const salutations = es.lecons[0]

describe('ajouterAuCarnet', () => {
  it('verse les mots au rang 1 sans écraser les entrées existantes', () => {
    let progres = ajouterAuCarnet(progresInitial(), 'es', salutations.mots, '2026-09-01')
    expect(tailleCarnet(progres)).toBe(8)
    expect(progres.carnet['es:bonjour']).toEqual({ boite: 1, jour: '2026-09-01' })

    progres = reviserMot(progres, 'es', 'bonjour', true, '2026-09-02')
    progres = ajouterAuCarnet(progres, 'es', salutations.mots, '2026-09-03')
    expect(progres.carnet['es:bonjour']).toEqual({ boite: 2, jour: '2026-09-02' })
  })

  it('un mot réussi en leçon part du rang 2, un mot raté du rang 1', () => {
    const progres = ajouterAuCarnet(progresInitial(), 'es', salutations.mots, '2026-09-01', {
      bonjour: true,
      merci: false,
    })
    expect(progres.carnet['es:bonjour']).toEqual({ boite: 2, jour: '2026-09-01' })
    expect(progres.carnet['es:merci']).toEqual({ boite: 1, jour: '2026-09-01' })
    // Un mot dont on ne sait rien (jamais interrogé) part aussi du rang 1.
    expect(progres.carnet['es:oui']).toEqual({ boite: 1, jour: '2026-09-01' })
  })
})

describe('échéances de Leitner', () => {
  it('six rangs, de 1 à 90 jours', () => {
    expect(INTERVALLES).toEqual([1, 3, 7, 16, 35, 90])
    expect(RANG_MAX).toBe(6)
  })

  it('rang 1 revient le lendemain, rang 2 après 3 jours, rang 6 après 90', () => {
    expect(estDue({ boite: 1, jour: '2026-09-01' }, '2026-09-01')).toBe(false)
    expect(estDue({ boite: 1, jour: '2026-09-01' }, '2026-09-02')).toBe(true)
    expect(estDue({ boite: 2, jour: '2026-09-01' }, '2026-09-03')).toBe(false)
    expect(estDue({ boite: 2, jour: '2026-09-01' }, '2026-09-04')).toBe(true)
    expect(estDue({ boite: 6, jour: '2026-09-01' }, '2026-11-29')).toBe(false)
    expect(estDue({ boite: 6, jour: '2026-09-01' }, '2026-11-30')).toBe(true)
  })

  it('monte d’un rang sur bonne réponse (plafond 6), retombe au rang 1 sinon', () => {
    expect(prochaineBoite(1, true)).toBe(2)
    expect(prochaineBoite(5, true)).toBe(6)
    expect(prochaineBoite(6, true)).toBe(6)
    expect(prochaineBoite(4, false)).toBe(1)

    let progres = ajouterAuCarnet(progresInitial(), 'es', salutations.mots, '2026-09-01')
    progres = reviserMot(progres, 'es', 'merci', true, '2026-09-02')
    expect(progres.carnet['es:merci']).toEqual({ boite: 2, jour: '2026-09-02' })
    progres = reviserMot(progres, 'es', 'merci', false, '2026-09-04')
    expect(progres.carnet['es:merci']).toEqual({ boite: 1, jour: '2026-09-04' })
  })
})

describe('motsDus', () => {
  it('rassemble les mots dus, les plus anciens d’abord, et ignore le reste', () => {
    let progres = ajouterAuCarnet(progresInitial(), 'es', salutations.mots.slice(0, 2), '2026-09-01')
    progres = ajouterAuCarnet(progres, 'tr', LANGUES.find((l) => l.id === 'tr').lecons[0].mots.slice(0, 2), '2026-08-30')
    const dus = motsDus(progres, LANGUES, '2026-09-02')
    expect(dus).toHaveLength(4)
    expect(dus[0].langue.id).toBe('tr')
    expect(motsDus(progres, LANGUES, '2026-09-01').map((d) => d.langue.id)).toEqual(['tr', 'tr'])
  })
})

describe('joursAvantProchaine', () => {
  it('donne l’attente avant le prochain mot, 0 si déjà dû, null si carnet vide', () => {
    expect(joursAvantProchaine(progresInitial(), '2026-09-01')).toBeNull()
    const progres = ajouterAuCarnet(progresInitial(), 'es', salutations.mots, '2026-09-01')
    expect(joursAvantProchaine(progres, '2026-09-01')).toBe(1)
    expect(joursAvantProchaine(progres, '2026-09-02')).toBe(0)
  })
})

describe('composerSession', () => {
  const entree = (id, boite, jour) => ({ mot: { id }, entree: { boite, jour } })

  it('réserve la moitié des places aux mots fragiles, les plus récents d’abord', () => {
    // 14 mots solides négligés depuis un mois, puis 5 mots fragiles récents.
    const arriere = Array.from({ length: 14 }, (_, i) => entree(`vieux${i}`, 4, '2026-08-01'))
    const fragiles = [
      entree('rate-hier', 1, '2026-09-04'),
      entree('nouveau', 1, '2026-09-03'),
      entree('rate-avant-hier', 1, '2026-09-02'),
      entree('rang2', 2, '2026-09-01'),
      entree('vieux-fragile', 1, '2026-07-01'),
    ]
    // L'ordre d'entrée est celui de motsDus : les plus anciens d'abord.
    const dus = [...fragiles, ...arriere].sort((a, b) => (a.entree.jour < b.entree.jour ? -1 : 1))
    const session = composerSession(dus, TAILLE_SESSION)
    expect(session).toHaveLength(12)
    expect(session.slice(0, 5).map((d) => d.mot.id)).toEqual(['rate-hier', 'nouveau', 'rate-avant-hier', 'rang2', 'vieux-fragile'])
    // Le reste : les solides, les plus anciens d'abord — aucun fragile perdu.
    expect(session.slice(5).every((d) => d.entree.boite === 4)).toBe(true)
    // Sans réservation, l'arriéré aurait pris toute la session sauf un.
    expect(dus.slice(0, 12).filter((d) => d.entree.boite <= 2)).toHaveLength(1)
  })

  it('ne réserve rien quand il n’y a pas de fragile, et ne double aucun mot', () => {
    const dus = Array.from({ length: 20 }, (_, i) => entree(`m${i}`, 3, `2026-08-${String(i + 1).padStart(2, '0')}`))
    const session = composerSession(dus, 12)
    expect(session.map((d) => d.mot.id)).toEqual(dus.slice(0, 12).map((d) => d.mot.id))
    expect(new Set(session).size).toBe(12)
  })
})

describe('construireRevision', () => {
  it('borne la session à 12 et propose 4 options de la même langue, dont la bonne', () => {
    let progres = progresInitial()
    for (const lecon of es.lecons.slice(0, 2)) {
      progres = ajouterAuCarnet(progres, 'es', lecon.mots, '2026-09-01')
    }
    const dus = motsDus(progres, LANGUES, '2026-09-05')
    expect(dus).toHaveLength(16)
    const session = construireRevision(dus, mulberry32(3))
    expect(session).toHaveLength(12)
    for (const question of session) {
      expect(question.options).toHaveLength(4)
      expect(new Set(question.options.map((o) => o.id)).size).toBe(4)
      expect(question.options.some((o) => o.id === question.mot.id)).toBe(true)
    }
    expect(session.map((q) => q.type)).toEqual(session.map((_, i) => (i % 2 === 0 ? 'comprendre' : 'produire')))
  })
})
