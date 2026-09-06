import { describe, expect, it } from 'vitest'
import {
  acheterGel,
  ajouterXp,
  attribuerXpDuJour,
  chargerProgres,
  defiDuJour,
  enregistrerDefi,
  enregistrerEtape,
  majSerieAvecGels,
  offrirGel,
  reglerObjectif,
  xpDuJour,
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

describe('majSerieAvecGels — la nuit au caravansérail', () => {
  const serie = { compte: 5, dernierJour: '2026-09-01' }

  it('couvre exactement un jour manqué quand une nuit est en réserve', () => {
    expect(majSerieAvecGels(serie, 1, '2026-09-03')).toEqual({
      serie: { compte: 6, dernierJour: '2026-09-03' },
      gels: 0,
      gelConsomme: true,
    })
  })

  it('sans nuit en réserve, la série retombe à 1', () => {
    expect(majSerieAvecGels(serie, 0, '2026-09-03').serie).toEqual({ compte: 1, dernierJour: '2026-09-03' })
  })

  it('deux jours manqués : la série tombe mais les nuits sont gardées', () => {
    const bilan = majSerieAvecGels(serie, 2, '2026-09-04')
    expect(bilan.serie).toEqual({ compte: 1, dernierJour: '2026-09-04' })
    expect(bilan.gels).toBe(2)
    expect(bilan.gelConsomme).toBe(false)
  })

  it('lendemain normal : +1 sans toucher aux nuits', () => {
    expect(majSerieAvecGels(serie, 2, '2026-09-02')).toEqual({
      serie: { compte: 6, dernierJour: '2026-09-02' },
      gels: 2,
      gelConsomme: false,
    })
  })

  it("une étape validée après un jour manqué consomme la nuit et le signale", () => {
    const base = { ...progresInitial(), xp: 500, gels: 1, serie: { compte: 3, dernierJour: '2026-08-30' } }
    const resultat = enregistrerEtape(base, 'es', 'salutations', 8, 8, '2026-09-01')
    expect(resultat.gelConsomme).toBe(true)
    expect(resultat.progres.serie.compte).toBe(4)
    expect(resultat.progres.gels).toBe(0)
  })
})

describe('acheterGel', () => {
  it('débite 150 XP, plafonne à 2 nuits et refuse les bourses vides', () => {
    const riche = { ...progresInitial(), xp: 400 }
    const un = acheterGel(riche)
    expect(un.achete).toBe(true)
    expect(un.progres.xp).toBe(250)
    expect(un.progres.gels).toBe(1)
    const deux = acheterGel(un.progres)
    expect(deux.progres.gels).toBe(2)
    expect(acheterGel(deux.progres).achete).toBe(false)
    expect(acheterGel({ ...progresInitial(), xp: 100 }).achete).toBe(false)
  })
})

describe('offrirGel', () => {
  it('ajoute une nuit sans coûter d’XP, et respecte le plafond', () => {
    const base = { ...progresInitial(), xp: 40 }
    const une = offrirGel(base)
    expect(une.gels).toBe(1)
    expect(une.xp).toBe(40)
    const deux = offrirGel(une)
    expect(deux.gels).toBe(2)
    expect(offrirGel(deux)).toBe(deux)
  })
})

describe('objectif quotidien', () => {
  it("attribue chaque gain d'XP au jour où il tombe", () => {
    const avant = progresInitial()
    const apres = attribuerXpDuJour(avant, ajouterXp(avant, 25), '2026-09-03')
    expect(xpDuJour(apres, '2026-09-03')).toBe(25)
    const encore = attribuerXpDuJour(apres, ajouterXp(apres, 10), '2026-09-03')
    expect(xpDuJour(encore, '2026-09-03')).toBe(35)
    expect(xpDuJour(encore, '2026-09-04')).toBe(0)
  })

  it("sans gain (ou lors d'un achat), rien ne s'attribue", () => {
    const base = attribuerXpDuJour(progresInitial(), ajouterXp(progresInitial(), 20), '2026-09-03')
    expect(attribuerXpDuJour(base, base, '2026-09-03')).toBe(base)
    const riche = { ...base, xp: 200 }
    const apresAchat = attribuerXpDuJour(riche, acheterGel(riche).progres, '2026-09-03')
    expect(apresAchat.xpJours['2026-09-03']).toBe(20)
  })

  it('ne conserve que les 14 derniers jours', () => {
    let progres = progresInitial()
    for (let i = 1; i <= 16; i++) {
      const jour = `2026-09-${String(i).padStart(2, '0')}`
      progres = attribuerXpDuJour(progres, ajouterXp(progres, 5), jour)
    }
    expect(Object.keys(progres.xpJours)).toHaveLength(14)
    expect(progres.xpJours['2026-09-01']).toBeUndefined()
    expect(progres.xpJours['2026-09-16']).toBe(5)
  })

  it("l'objectif n'accepte que 10, 20 ou 30", () => {
    expect(reglerObjectif(progresInitial(), 30).objectifJour).toBe(30)
    expect(reglerObjectif(progresInitial(), 25).objectifJour).toBe(20)
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

  it('le cap choisi passe devant tout, même une destination entamée ailleurs', () => {
    const progres = enregistrerEtape(progresInitial(), 'es', 'salutations', 8, 8, '2026-08-30').progres
    const suite = prochaineEtape(progres, LANGUES, 'ja')
    expect(suite.langue.id).toBe('ja')
    expect(suite.lecon.id).toBe('salutations')
  })

  it('cap terminé ou inconnu : retour au comportement de la route', () => {
    let progres = progresInitial()
    const tr = LANGUES.find((l) => l.id === 'tr')
    for (const lecon of tr.lecons) {
      progres = enregistrerEtape(progres, 'tr', lecon.id, 8, 8, '2026-08-30').progres
    }
    expect(prochaineEtape(progres, LANGUES, 'tr').langue.id).toBe(LANGUES[0].id)
    expect(prochaineEtape(progresInitial(), LANGUES, 'xx').langue.id).toBe(LANGUES[0].id)
    expect(prochaineEtape(progresInitial(), LANGUES, 'route').langue.id).toBe(LANGUES[0].id)
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
