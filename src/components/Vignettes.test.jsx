import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LANGUES } from '../data/langues.js'
import { TamponVisa } from './TamponVisa.jsx'
import { VIGNETTES, VignetteVille, aUneVignette } from './Vignettes.jsx'

const rendre = (langue, props) => renderToStaticMarkup(<VignetteVille langue={langue} {...props} />)

describe('les vignettes de destination', () => {
  it('existent pour chacune des 14 destinations, et pour elles seulement', () => {
    for (const langue of LANGUES) expect(aUneVignette(langue.id), langue.id).toBe(true)
    expect(Object.keys(VIGNETTES).sort()).toEqual(LANGUES.map((l) => l.id).sort())
    expect(aUneVignette('xx')).toBe(false)
    expect(renderToStaticMarkup(<VignetteVille langueId="xx" />)).toBe('')
  })

  it('ne portent aucune couleur nationale : tout est en currentColor, sans un seul hex', () => {
    for (const langue of LANGUES) {
      const html = rendre(langue)
      expect(html, langue.id).toContain('viewBox="0 0 64 64"')
      expect(html, langue.id).toContain('stroke="currentColor"')
      expect(html, langue.id).not.toMatch(/#[0-9a-f]{3,8}/i)
      expect(html, langue.id).not.toMatch(/rgb\(|hsl\(/)
    }
  })

  it('sont toutes différentes', () => {
    expect(new Set(LANGUES.map((l) => rendre(l))).size).toBe(LANGUES.length)
  })

  it('sont une image nommée avec un titre, décoratives sans', () => {
    const es = LANGUES[0]
    expect(rendre(es, { titre: 'Grenade' })).toContain('role="img" aria-label="Grenade"')
    expect(rendre(es)).toContain('aria-hidden="true"')
  })
})

describe('le tampon de visa', () => {
  const tampons = LANGUES.map((langue, i) => renderToStaticMarkup(<TamponVisa langue={langue} index={i} />))

  it('fait 14 tampons tous différents — le passeport est collectionnable', () => {
    expect(new Set(tampons).size).toBe(LANGUES.length)
  })

  it('porte la vignette de sa ville, à l’encre du tampon', () => {
    tampons.forEach((html, i) => {
      // La vignette est un svg imbriqué qui hérite l'encre par currentColor.
      expect(html, LANGUES[i].id).toContain('viewBox="0 0 64 64"')
      expect(html, LANGUES[i].id).toMatch(/color:var\(--(terracotta|safran|menthe)\)/)
    })
  })

  it('varie encre ET forme, pas seulement en cadence de trois', () => {
    const combos = new Set(
      tampons.map((html) => {
        const encre = html.match(/stroke:var\(--(terracotta|safran|menthe)\)/)[1]
        const forme = html.includes('<circle cx="48" cy="48" r="40"') ? 'rond' : html.includes('<polygon') ? 'octogone' : 'carre'
        return `${encre}/${forme}`
      })
    )
    // Avant : `index % 3` pour l'encre ET la forme → trois combinaisons en tout.
    expect(combos.size).toBeGreaterThanOrEqual(9)
  })
})
