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

  it('ne fait jamais sortir un nom refusé — mais le garde tel que tapé, pour le champ', () => {
    const s = stockage()
    // Ce qui est tapé revient tel quel : le champ ne se vide pas en pleine frappe.
    expect(reglerNom('Zebi', s)).toBe('Zebi')
    expect(JSON.parse(s.getItem(CLE_VOYAGEUR)).nom).toBe('Zebi')
    // Ce qui SORT (envoi au serveur, affichage) est vide : l'écran dit « Un voyageur ».
    expect(identite(s).nom).toBe('')
    expect(nomVoyageur(s)).toBe('')
    // Un nom acceptable reprend aussitôt sa place ; l'identité, elle, n'a pas bougé.
    const id = identite(s).id
    expect(reglerNom('Amine', s)).toBe('Amine')
    expect(identite(s)).toMatchObject({ id, nom: 'Amine' })
    // Coordonnées : même sort.
    reglerNom('06 12 34 56 78', s)
    expect(identite(s).nom).toBe('')
    // Une liste qui s'assouplit ne laisse pas de nom « condamné » : le filtre se
    // rejoue à chaque lecture, il n'est pas gravé dans le stockage.
    const gravee = JSON.parse(s.getItem(CLE_VOYAGEUR))
    expect(gravee.nom).toBe('06 12 34 56 78')
  })

  it('filtre aussi l’identité qui ne vit qu’en mémoire (stockage absent ou illisible)', () => {
    reglerNom('connard', null)
    expect(identite(null).nom).toBe('')
    expect(identite(null).id).toMatch(/^[0-9a-f]{16}$/)
    reglerNom('Amine', null)
    expect(identite(null).nom).toBe('Amine')
  })

  it('filtre un nom abîmé ou ancien relu dans le stockage', () => {
    const s = stockage()
    s.setItem(CLE_VOYAGEUR, JSON.stringify({ id: 'abcd1234abcd1234', secret: 'secret-de-test-secret', nom: 'ntm' }))
    expect(identite(s).nom).toBe('')
    s.setItem('rihla.barid.nom', 'whatsapp')
    s.removeItem(CLE_VOYAGEUR)
    oublierIdentite()
    expect(nomVoyageur(s)).toBe('')
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
