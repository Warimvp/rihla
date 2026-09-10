import { describe, expect, it } from 'vitest'
import {
  MARQUE,
  VERSION_SAUVEGARDE,
  exporterProgres,
  importerProgres,
  semaineActivite,
} from './sauvegarde.js'
import { ajouterXp, attribuerXpDuJour, enregistrerEtape, progresInitial } from './progression.js'

const voyage = () => {
  let p = enregistrerEtape(progresInitial(), 'tr', 'salutations', 8, 8, '2026-09-05').progres
  p = attribuerXpDuJour(progresInitial(), p, '2026-09-05')
  return { ...p, gels: 1 }
}

describe('exporter / importer', () => {
  it('fait l’aller-retour sans rien perdre', () => {
    const avant = voyage()
    const resultat = importerProgres(exporterProgres(avant, '2026-09-06'))
    expect(resultat.ok).toBe(true)
    expect(resultat.progres.xp).toBe(avant.xp)
    expect(resultat.progres.etapes).toEqual(avant.etapes)
    expect(resultat.progres.serie).toEqual(avant.serie)
    expect(resultat.progres.gels).toBe(1)
    expect(resultat.progres.xpJours).toEqual(avant.xpJours)
  })

  it('exporte du texte compact : une seule ligne, pas d’indentation', () => {
    const texte = exporterProgres(voyage(), '2026-09-06')
    expect(texte).not.toMatch(/\n/)
    expect(texte).not.toMatch(/": /)
  })

  // Un voyageur a pu coller sa sauvegarde dans ses notes du temps où l'export
  // était indenté : elle doit toujours le ramener chez lui, à l'identique.
  it('relit une sauvegarde de l’ancien export indenté', () => {
    const avant = voyage()
    const ancienne = JSON.stringify(
      { marque: MARQUE, version: VERSION_SAUVEGARDE, jour: '2026-09-06', progres: avant },
      null,
      2
    )
    expect(ancienne).toMatch(/\n {2}"marque"/)
    const resultat = importerProgres(ancienne)
    expect(resultat.ok).toBe(true)
    expect(resultat.progres).toEqual(importerProgres(exporterProgres(avant, '2026-09-06')).progres)
  })

  it('refuse le texte illisible, étranger, d’une autre version ou corrompu', () => {
    expect(importerProgres('pas du json').erreur).toBe('illisible')
    expect(importerProgres('{"marque":"autre-app","version":1}').erreur).toBe('inconnu')
    expect(importerProgres(JSON.stringify({ marque: MARQUE, version: 99, progres: {} })).erreur).toBe('version')
    expect(importerProgres(JSON.stringify({ marque: MARQUE, version: 1, progres: { xp: -5 } })).erreur).toBe('corrompu')
    expect(importerProgres(JSON.stringify({ marque: MARQUE, version: 1, progres: { xp: 10 } })).erreur).toBe('corrompu')
    expect(importerProgres('').erreur).toBe('illisible')
  })

  it('complète les champs absents d’une vieille sauvegarde sans planter', () => {
    const vieille = JSON.stringify({
      marque: MARQUE,
      version: 1,
      progres: { xp: 120, serie: { compte: 3, dernierJour: '2026-09-01' }, etapes: { 'tr:salutations': { valide: true } } },
    })
    const { ok, progres } = importerProgres(vieille)
    expect(ok).toBe(true)
    expect(progres.carnet).toEqual({})
    expect(progres.defis).toEqual({})
    expect(progres.xpJours).toEqual({})
    expect(progres.gels).toBe(0)
    expect(progres.objectifJour).toBe(20)
  })
})

describe('semaineActivite', () => {
  it('donne 7 jours qui finissent aujourd’hui, avec les XP du jour', () => {
    let p = attribuerXpDuJour(progresInitial(), ajouterXp(progresInitial(), 30), '2026-09-06')
    p = attribuerXpDuJour(p, ajouterXp(p, 10), '2026-09-02')
    const semaine = semaineActivite(p, '2026-09-06')
    expect(semaine).toHaveLength(7)
    expect(semaine[0].jour).toBe('2026-08-31')
    expect(semaine[6].jour).toBe('2026-09-06')
    expect(semaine[6].xp).toBe(30)
    expect(semaine[2].xp).toBe(10)
    expect(semaine[1].xp).toBe(0)
  })
})
