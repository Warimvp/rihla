import { existsSync, readdirSync, statSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { getDictionary } from '../i18n.js'
import { LANGUES } from './langues.js'
import { CREDITS, LICENCES, PHOTOS, construirePhoto, photoDe, photosLivrees, sourceDe } from './photos.js'
import { recadrage } from '../../scripts/photos.mjs'

const DOSSIER = new URL('../assets/photos/', import.meta.url)
const fichiers = existsSync(DOSSIER) ? readdirSync(DOSSIER).filter((f) => f.endsWith('.webp')) : []

describe('les photos des villes', () => {
  it('ne connaissent que des destinations de la route', () => {
    const ids = new Set(LANGUES.map((l) => l.id))
    for (const id of Object.keys(CREDITS)) expect(ids.has(id), id).toBe(true)
    for (const fichier of fichiers) expect(ids.has(fichier.replace('.webp', '')), fichier).toBe(true)
  })

  it('ont TOUTES leur crédit : auteur, licence libre connue, source sur Wikimedia Commons, sujet en français et en arabe', () => {
    expect(fichiers.length).toBe(Object.keys(PHOTOS).length)
    for (const fichier of fichiers) {
      const id = fichier.replace('.webp', '')
      const credit = CREDITS[id]
      expect(credit, `${fichier} n’a pas de crédit`).toBeTruthy()
      expect(credit.auteur?.trim(), id).toBeTruthy()
      expect(Object.keys(LICENCES), id).toContain(credit.licence)
      expect(LICENCES[credit.licence], id).toMatch(/^https:\/\/creativecommons\.org\//)
      expect(credit.fichier, id).toMatch(/\.(jpe?g)$/i)
      expect(sourceDe(credit), id).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:\S+$/)
      expect(credit.fr?.trim(), id).toBeTruthy()
      expect(credit.ar, id).toMatch(/[؀-ۿ]/)
      expect(credit.ar, id).not.toMatch(/[A-Za-z]/)
      if (credit.cadrage) expect(credit.cadrage, id).toMatch(/^\d{1,3}% \d{1,3}%$/)
    }
  })

  it('ne montrent jamais une photo sans crédit, ni sous une licence inconnue', () => {
    const photos = { es: '/assets/es-abc.webp' }
    const credit = { fichier: 'A.jpg', auteur: 'Quelqu’un', licence: 'CC BY-SA 4.0', fr: 'x', ar: 'س' }
    expect(construirePhoto('es', photos, { es: credit })).toMatchObject({
      url: '/assets/es-abc.webp',
      auteur: 'Quelqu’un',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
      source: 'https://commons.wikimedia.org/wiki/File:A.jpg',
      cadrage: '50% 50%',
    })
    expect(construirePhoto('es', photos, {})).toBe(null)
    expect(construirePhoto('es', photos, { es: { ...credit, auteur: '' } })).toBe(null)
    expect(construirePhoto('es', photos, { es: { ...credit, licence: 'Tous droits réservés' } })).toBe(null)
    // Un crédit sans fichier : pas de photo non plus (le paysage dessiné reste).
    expect(construirePhoto('es', {}, { es: credit })).toBe(null)
    expect(photoDe('xx')).toBe(null)
  })

  it('restent légères : 720×338 au plus, moins de 80 Ko chacune, moins de 600 Ko en tout', () => {
    let total = 0
    for (const fichier of fichiers) {
      const octets = statSync(new URL(fichier, DOSSIER)).size
      total += octets
      expect(octets, fichier).toBeLessThan(80 * 1024)
    }
    expect(total).toBeLessThan(600 * 1024)
  })

  it('sont listées dans l’ordre de la route, pour les crédits des Réglages', () => {
    const livrees = photosLivrees(LANGUES)
    expect(livrees.map((p) => p.langue.id)).toEqual(LANGUES.map((l) => l.id).filter((id) => PHOTOS[id] && CREDITS[id]))
    for (const { photo } of livrees) expect(photo.url).toBeTruthy()
  })

  it('ont leurs textes de crédit en français et en arabe', () => {
    for (const locale of ['fr', 'ar']) {
      const t = getDictionary(locale)
      for (const cle of ['photo', 'recadree', 'domainePublic', 'titre', 'sousTitre']) expect(t.photos[cle], `${locale}.${cle}`).toBeTruthy()
    }
  })
})

describe('le recadrage des photos', () => {
  it('garde le plus grand rectangle au format du paysage, glissé vers le point de cadrage', () => {
    // Trop haute : on rogne en hauteur, autour du centre par défaut…
    expect(recadrage({ l: 1280, h: 960 })).toEqual({ x: 0, y: 180, largeur: 1280, hauteur: 601 })
    // … ou vers le haut, pour une tour.
    expect(recadrage({ l: 1280, h: 960 }, '50% 0%')).toEqual({ x: 0, y: 0, largeur: 1280, hauteur: 601 })
    expect(recadrage({ l: 1280, h: 960 }, '50% 100%').y).toBe(359)
    // Trop large (un panorama) : on rogne en largeur.
    const panorama = recadrage({ l: 1280, h: 518 })
    expect(panorama).toEqual({ x: 89, y: 0, largeur: 1103, hauteur: 518 })
    for (const cadre of [recadrage({ l: 1280, h: 960 }), panorama]) {
      expect(cadre.largeur / cadre.hauteur).toBeCloseTo(720 / 338, 1)
    }
  })
})
