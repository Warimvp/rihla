import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LANGUES } from '../data/langues.js'
import { IDS_VISUELS, IDS_VISUELS_DE_QUIZ, VisuelConcept, aUnVisuel, visuelDeQuiz } from './visuels.jsx'

// Les ids de concepts sont ceux de n'importe quelle langue : ils sont
// partagés par index (voir langues.js).
const CONCEPTS = new Set(LANGUES[0].lecons.flatMap((lecon) => lecon.mots.map((mot) => mot.id)))
const rendre = (id, props) => renderToStaticMarkup(<VisuelConcept id={id} taille={48} {...props} />)

describe('l’index des visuels', () => {
  it('ne désigne que des concepts qui existent — renommer un id dans langues.js casse ici', () => {
    for (const id of IDS_VISUELS) expect(CONCEPTS.has(id), id).toBe(true)
  })

  it('compte 21 visuels de quiz (couleurs, nombres, jours) et 23 pictogrammes', () => {
    expect(IDS_VISUELS_DE_QUIZ).toHaveLength(21)
    expect(IDS_VISUELS).toHaveLength(44)
    expect(IDS_VISUELS_DE_QUIZ).toEqual(
      expect.arrayContaining(['rouge', 'blanc', 'grand', 'petit', 'un', 'dix', 'lundi', 'dimanche'])
    )
  })

  it('ne connaît pas un id inconnu, et ne rend rien pour lui', () => {
    expect(aUnVisuel('inconnu')).toBe(false)
    expect(visuelDeQuiz('inconnu')).toBe(false)
    expect(rendre('inconnu')).toBe('')
  })

  it('garde les pictogrammes hors du quiz : un dessin peut se lire de deux façons', () => {
    expect(aUnVisuel('banque')).toBe(true)
    expect(visuelDeQuiz('banque')).toBe(false)
    expect(visuelDeQuiz('cinq')).toBe(true)
  })
})

describe('les visuels engendrés', () => {
  const khatams = (html) => (html.match(/<g transform="translate/g) ?? []).length

  it('dessinent autant de khatams que le nombre dit', () => {
    expect(khatams(rendre('un'))).toBe(1)
    expect(khatams(rendre('cinq'))).toBe(5)
    expect(khatams(rendre('dix'))).toBe(10)
  })

  it('remplissent la colonne du jour, et seulement elle', () => {
    const colonnes = (html) => [...html.matchAll(/<rect [^>]*fill="([^"]+)"/g)].map((m) => m[1])
    expect(colonnes(rendre('lundi'))).toEqual(['currentColor', 'none', 'none', 'none', 'none', 'none', 'none'])
    expect(colonnes(rendre('vendredi'))).toEqual(['none', 'none', 'none', 'none', 'currentColor', 'none', 'none'])
    expect(rendre('vendredi')).toContain('class="visuel-semaine"')
  })

  it('gardent la couleur fixe, la seule chose qui ne suit pas le thème', () => {
    expect(rendre('rouge')).toContain('fill="#c0392b"')
    expect(rendre('blanc')).toContain('fill="#ffffff"')
    expect(rendre('cinq')).not.toMatch(/fill="#/)
  })

  it('désignent le grand ou le petit en le remplissant', () => {
    expect(rendre('grand')).toMatch(/r="13" fill="currentColor"/)
    expect(rendre('petit')).toMatch(/r="5" fill="currentColor"/)
  })
})

describe('accessibilité', () => {
  it('est une image nommée quand on lui donne le sens, décorative sinon', () => {
    expect(rendre('coeur', { etiquette: 'Le cœur' })).toContain('role="img" aria-label="Le cœur"')
    expect(rendre('coeur')).toContain('aria-hidden="true"')
    expect(rendre('coeur')).not.toContain('role="img"')
  })

  it('rend chaque visuel en SVG sur la grille commune, en currentColor', () => {
    for (const id of IDS_VISUELS) {
      const html = rendre(id)
      expect(html, id).toContain('viewBox="0 0 48 48"')
      expect(html, id).toContain('stroke="currentColor"')
    }
  })
})
