import { describe, expect, it } from 'vitest'
import {
  ajouterXp,
  chargerProgres,
  defiDuJour,
  enregistrerDefi,
  enregistrerEtape,
  kmParcourus,
  majSerie,
  nbVisas,
  prochaineEtape,
  progresInitial,
  sauverProgres,
  veilleDe,
  visaObtenu,
} from './progression.js'
import { LANGUES } from '../data/langues.js'

const fauxStockage = () => {
  const donnees = new Map()
  return {
    getItem: (k) => donnees.get(k) ?? null,
    setItem: (k, v) => donnees.set(k, String(v)),
  }
}

describe('veilleDe', () => {
  it('gère les passages de mois et d’années', () => {
    expect(veilleDe('2026-08-30')).toBe('2026-08-29')
    expect(veilleDe('2026-03-01')).toBe('2026-02-28')
    expect(veilleDe('2026-01-01')).toBe('2025-12-31')
  })
})

describe('majSerie', () => {
  it('démarre à 1 le premier jour', () => {
    expect(majSerie({ compte: 0, dernierJour: null }, '2026-08-30')).toEqual({
      compte: 1,
      dernierJour: '2026-08-30',
    })
  })

  it('ne bouge pas deux fois le même jour', () => {
    const serie = { compte: 3, dernierJour: '2026-08-30' }
    expect(majSerie(serie, '2026-08-30')).toBe(serie)
  })

  it('monte de 1 le lendemain', () => {
    expect(majSerie({ compte: 3, dernierJour: '2026-08-29' }, '2026-08-30')).toEqual({
      compte: 4,
      dernierJour: '2026-08-30',
    })
  })

  it('repart à 1 après un trou', () => {
    expect(majSerie({ compte: 9, dernierJour: '2026-08-20' }, '2026-08-30')).toEqual({
      compte: 1,
      dernierJour: '2026-08-30',
    })
  })
})

describe('enregistrerEtape', () => {
  it('valide à 6/8, crédite les XP, lance la série', () => {
    const { progres, xpGagne, valide } = enregistrerEtape(
      progresInitial(),
      'tr',
      'salutations',
      6,
      8,
      '2026-08-30'
    )
    expect(valide).toBe(true)
    expect(xpGagne).toBe(60)
    expect(progres.xp).toBe(60)
    expect(progres.serie.compte).toBe(1)
    expect(progres.etapes['tr:salutations'].valide).toBe(true)
  })

  it('ne valide pas à 5/8 et ne touche pas la série', () => {
    const { progres, valide } = enregistrerEtape(progresInitial(), 'tr', 'salutations', 5, 8, '2026-08-30')
    expect(valide).toBe(false)
    expect(progres.serie.compte).toBe(0)
    expect(progres.etapes['tr:salutations'].valide).toBe(false)
  })

  it('donne un bonus de 20 XP pour un sans-faute et garde le meilleur score', () => {
    const a = enregistrerEtape(progresInitial(), 'tr', 'salutations', 8, 8, '2026-08-30')
    expect(a.xpGagne).toBe(100)
    const b = enregistrerEtape(a.progres, 'tr', 'salutations', 4, 8, '2026-08-31')
    expect(b.progres.etapes['tr:salutations'].score).toBe(8)
    expect(b.progres.etapes['tr:salutations'].valide).toBe(true)
  })
})

describe('ajouterXp', () => {
  it('crédite les XP des jeux sans toucher au reste, et refuse le négatif', () => {
    const base = enregistrerEtape(progresInitial(), 'es', 'salutations', 6, 8, '2026-08-30').progres
    const apres = ajouterXp(base, 45)
    expect(apres.xp).toBe(base.xp + 45)
    expect(apres.serie).toEqual(base.serie)
    expect(apres.etapes).toEqual(base.etapes)
    expect(ajouterXp(base, -30).xp).toBe(base.xp)
  })
})

describe('enregistrerDefi', () => {
  it('crédite les XP, fait avancer la série et retient le jour', () => {
    const { progres, xpGagne, dejaFaite, serieAvancee } = enregistrerDefi(progresInitial(), 7, 10, '2026-08-30')
    expect(xpGagne).toBe(28)
    expect(dejaFaite).toBe(false)
    expect(serieAvancee).toBe(true)
    expect(progres.serie).toEqual({ compte: 1, dernierJour: '2026-08-30' })
    expect(defiDuJour(progres, '2026-08-30')).toEqual({ score: 7, total: 10 })
    expect(defiDuJour(progres, '2026-08-31')).toBeNull()
  })

  it('donne un bonus de 10 XP pour un sans-faute', () => {
    expect(enregistrerDefi(progresInitial(), 10, 10, '2026-08-30').xpGagne).toBe(50)
  })

  it('rejouer le même jour ne rapporte rien mais garde le meilleur score', () => {
    const premier = enregistrerDefi(progresInitial(), 9, 10, '2026-08-30')
    const second = enregistrerDefi(premier.progres, 4, 10, '2026-08-30')
    expect(second.xpGagne).toBe(0)
    expect(second.dejaFaite).toBe(true)
    expect(second.serieAvancee).toBe(false)
    expect(second.progres.xp).toBe(premier.progres.xp)
    expect(second.progres.serie.compte).toBe(1)
    expect(defiDuJour(second.progres, '2026-08-30').score).toBe(9)
  })

  it('ne double pas la série si une étape a déjà été validée le même jour', () => {
    const apresEtape = enregistrerEtape(progresInitial(), 'es', 'salutations', 8, 8, '2026-08-30').progres
    const { progres } = enregistrerDefi(apresEtape, 5, 10, '2026-08-30')
    expect(progres.serie.compte).toBe(1)
  })
})

describe('visas et kilomètres', () => {
  it('décroche le visa quand toutes les étapes de la langue sont validées', () => {
    const tr = LANGUES.find((l) => l.id === 'tr')
    let progres = progresInitial()
    for (const lecon of tr.lecons) {
      progres = enregistrerEtape(progres, 'tr', lecon.id, 8, 8, '2026-08-30').progres
    }
    expect(visaObtenu(progres, tr)).toBe(true)
    expect(nbVisas(progres, LANGUES)).toBe(1)
    expect(kmParcourus(progres, LANGUES)).toBe(tr.km)
  })

  it('compte les km au prorata des étapes validées', () => {
    const es = LANGUES.find((l) => l.id === 'es')
    const progres = enregistrerEtape(progresInitial(), 'es', es.lecons[0].id, 8, 8, '2026-08-30').progres
    expect(kmParcourus(progres, LANGUES)).toBe(Math.round(es.km / es.lecons.length))
  })
})

describe('prochaineEtape', () => {
  it('propose la première étape de la route à un nouveau voyageur', () => {
    const suite = prochaineEtape(progresInitial(), LANGUES)
    expect(suite.langue.id).toBe(LANGUES[0].id)
    expect(suite.lecon.id).toBe(LANGUES[0].lecons[0].id)
  })

  it('privilégie une destination entamée plus loin sur la route', () => {
    const progres = enregistrerEtape(progresInitial(), 'tr', 'salutations', 8, 8, '2026-08-30').progres
    const suite = prochaineEtape(progres, LANGUES)
    expect(suite.langue.id).toBe('tr')
    expect(suite.lecon.id).toBe('enroute')
  })
})

describe('stockage', () => {
  it('fait l’aller-retour et survit à un JSON corrompu', () => {
    const stockage = fauxStockage()
    const { progres } = enregistrerEtape(progresInitial(), 'es', 'salutations', 7, 8, '2026-08-30')
    sauverProgres(progres, stockage)
    expect(chargerProgres(stockage)).toEqual(progres)

    stockage.setItem('rihla.progres.v1', '{pas du json')
    expect(chargerProgres(stockage)).toEqual(progresInitial())
  })
})
