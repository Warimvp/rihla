import { renderToStaticMarkup } from 'react-dom/server'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { LANGUES } from '../data/langues.js'
import { ICONES_LECONS, IconeLecon, aUneIcone } from './IconesLecons.jsx'
import { MOMENTS, Paysage, aUnPaysage, sceneDe } from './Paysages.jsx'
import { VignetteVille } from './Vignettes.jsx'

const CSS = readFileSync(new URL('../styles.css', import.meta.url), 'utf8')
const rendre = (langue, props) => renderToStaticMarkup(<Paysage langue={langue} {...props} />)

describe('les paysages de destination', () => {
  it('existent pour chaque destination, et pour elles seulement', () => {
    for (const langue of LANGUES) expect(aUnPaysage(langue.id), langue.id).toBe(true)
    expect(aUnPaysage('xx')).toBe(false)
    expect(renderToStaticMarkup(<Paysage langueId="xx" />)).toBe('')
  })

  it('ne portent aucune couleur en dur : ni hex, ni rgb — la couleur vient des jetons, par la feuille de style', () => {
    for (const langue of LANGUES) {
      for (const format of ['grand', 'bandeau']) {
        const html = rendre(langue, { format })
        expect(html, langue.id).not.toMatch(/#[0-9a-f]{3,8}\b/i)
        expect(html, langue.id).not.toMatch(/rgb\(|hsl\(/)
        // Ni `fill="…"` ni `style` de couleur : seulement des classes.
        expect(html.replaceAll('fill="none"', '').replaceAll('fill="currentColor"', ''), langue.id).not.toMatch(/fill="/)
      }
    }
    // Et la feuille de style ne leur donne que des jetons.
    const bloc = CSS.slice(CSS.indexOf('Paysages de destination'), CSS.indexOf('Apparitions en cascade'))
    expect(bloc.length).toBeGreaterThan(500)
    expect(bloc).not.toMatch(/#[0-9a-f]{3,8}\b/i)
    expect(bloc).not.toMatch(/rgba?\(/)
  })

  it('prennent leur couleur à une heure du jour, jamais à un pays', () => {
    const heures = new Set()
    for (const langue of LANGUES) {
      const { moment } = sceneDe(langue.id)
      expect(MOMENTS, langue.id).toContain(moment)
      expect(rendre(langue), langue.id).toContain(`paysage paysage--${moment}`)
      // La couleur du médaillon (la seule qui soit propre à une destination)
      // n'entre pas dans le paysage.
      expect(rendre(langue).toLowerCase(), langue.id).not.toContain(langue.couleur.toLowerCase())
      heures.add(moment)
    }
    expect([...heures].sort()).toEqual([...MOMENTS].sort())
    for (const moment of MOMENTS) expect(CSS).toContain(`.paysage--${moment}`)
  })

  it('n’ont pas de croissant : l’astre est un disque', () => {
    for (const langue of LANGUES) {
      const html = rendre(langue)
      expect(html.match(/<circle class="paysage__astre"/g), langue.id).toHaveLength(1)
    }
  })

  it('montrent le monument de la ville, posé sur la ligne de sol', () => {
    for (const langue of LANGUES) {
      const html = rendre(langue)
      // La vignette, deux fois : le contour qui la détache, puis le trait.
      expect(html.match(/viewBox="0 0 64 64"/g), langue.id).toHaveLength(2)
      const vignette = renderToStaticMarkup(<VignetteVille langue={langue} />)
      const premierTrace = vignette.match(/<path d="([^"]+)"/)[1]
      expect(html, langue.id).toContain(premierTrace)
      // Le sol de la scène est dans la grille de la vignette.
      const { sol } = sceneDe(langue.id)
      expect(sol, langue.id).toBeGreaterThanOrEqual(44)
      expect(sol, langue.id).toBeLessThanOrEqual(56)
    }
  })

  it('ne mettent de l’eau au premier plan que là où la vignette en dessine', () => {
    for (const langue of LANGUES) {
      const vignette = renderToStaticMarkup(<VignetteVille langue={langue} />)
      const eauDeLaVignette = vignette.includes('vignette__eau')
      expect(Boolean(sceneDe(langue.id).eau), langue.id).toBe(eauDeLaVignette)
      expect(rendre(langue).includes('paysage__eau'), langue.id).toBe(eauDeLaVignette)
    }
    // L'eau de la vignette s'efface dans un paysage (il a la sienne), pas ailleurs.
    expect(CSS).toMatch(/\.paysage \.vignette__eau\s*\{\s*display: none;/)
  })

  it('sont tous différents, dans les deux formats', () => {
    for (const format of ['grand', 'bandeau']) {
      expect(new Set(LANGUES.map((l) => rendre(l, { format }))).size).toBe(LANGUES.length)
    }
    expect(rendre(LANGUES[0], { format: 'grand' })).toContain('viewBox="0 0 320 150"')
    expect(rendre(LANGUES[0], { format: 'bandeau' })).toContain('viewBox="0 0 320 112"')
  })

  it('sont décoratifs sans titre, une image nommée avec', () => {
    expect(rendre(LANGUES[0])).toContain('aria-hidden="true"')
    expect(rendre(LANGUES[0], { titre: 'Grenade' })).toContain('role="img" aria-label="Grenade"')
  })
})

describe('les icônes des étapes', () => {
  const ids = LANGUES[0].lecons.map((l) => l.id)

  it('existent pour chacune des 24 leçons, et pour elles seulement', () => {
    expect(ids).toHaveLength(24)
    for (const id of ids) expect(aUneIcone(id), id).toBe(true)
    expect(Object.keys(ICONES_LECONS).sort()).toEqual([...ids].sort())
    expect(renderToStaticMarkup(<IconeLecon id="inconnue" />)).toBe('')
  })

  it('sont toutes différentes, décoratives, et sans couleur en dur', () => {
    const rendus = ids.map((id) => renderToStaticMarkup(<IconeLecon id={id} />))
    expect(new Set(rendus).size).toBe(ids.length)
    for (const html of rendus) {
      expect(html).toContain('aria-hidden="true"')
      expect(html).toContain('stroke="currentColor"')
      expect(html).not.toMatch(/#[0-9a-f]{3,8}\b/i)
      // Des tracés propres : pas de « 8.500 » laissé par une saisie.
      expect(html).not.toMatch(/\.\d*0[ "a-zA-Z-]/)
    }
  })
})
