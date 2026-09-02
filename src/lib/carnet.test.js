import { describe, expect, it } from 'vitest'
import {
  ajouterAuCarnet,
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
})

describe('échéances de Leitner', () => {
  it('rang 1 revient le lendemain, rang 2 après 2 jours, rang 5 après 16', () => {
    expect(estDue({ boite: 1, jour: '2026-09-01' }, '2026-09-01')).toBe(false)
    expect(estDue({ boite: 1, jour: '2026-09-01' }, '2026-09-02')).toBe(true)
    expect(estDue({ boite: 2, jour: '2026-09-01' }, '2026-09-02')).toBe(false)
    expect(estDue({ boite: 2, jour: '2026-09-01' }, '2026-09-03')).toBe(true)
    expect(estDue({ boite: 5, jour: '2026-09-01' }, '2026-09-16')).toBe(false)
    expect(estDue({ boite: 5, jour: '2026-09-01' }, '2026-09-17')).toBe(true)
  })

  it('monte d’un rang sur bonne réponse (plafond 5), retombe au rang 1 sinon', () => {
    expect(prochaineBoite(1, true)).toBe(2)
    expect(prochaineBoite(5, true)).toBe(5)
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
