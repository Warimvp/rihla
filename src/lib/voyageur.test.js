import { afterEach, describe, expect, it } from 'vitest'
import { CLE_VOYAGEUR, identite, nomVoyageur, oublierIdentite, reglerNom } from './voyageur.js'

// Un stockage en mémoire, comme localStorage.
const stockage = () => {
  const m = new Map()
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }
}

afterEach(() => oublierIdentite())

describe('l’identité du voyageur', () => {
  it('est tirée une fois, puis toujours la même sur l’appareil', () => {
    const s = stockage()
    const a = identite(s)
    expect(a.id).toMatch(/^[0-9a-f]{16}$/)
    expect(a.secret).toMatch(/^[0-9a-f]{32}$/)
    expect(a.nom).toBe('')
    oublierIdentite()
    expect(identite(s)).toEqual(a)
    expect(JSON.parse(s.getItem(CLE_VOYAGEUR)).id).toBe(a.id)
  })

  it('diffère d’un appareil à l’autre', () => {
    const a = identite(stockage())
    oublierIdentite()
    const b = identite(stockage())
    expect(a.id).not.toBe(b.id)
    expect(a.secret).not.toBe(b.secret)
  })

  it('reprend le nom choisi pour le Barid, et le nettoie', () => {
    const s = stockage()
    s.setItem('rihla.barid.nom', '  Amine  ')
    expect(nomVoyageur(s)).toBe('Amine')
    expect(reglerNom('  فاطمة ' + 'x'.repeat(40), s)).toHaveLength(24)
    expect(identite(s).nom.startsWith('فاطمة')).toBe(true)
  })

  it('repart de zéro si le stockage est illisible, et survit sans stockage', () => {
    const s = stockage()
    s.setItem(CLE_VOYAGEUR, '{pas du json')
    expect(identite(s).id).toMatch(/^[0-9a-f]{16}$/)
    oublierIdentite()
    const sansStockage = identite(null)
    expect(identite(null)).toEqual(sansStockage)
  })
})
