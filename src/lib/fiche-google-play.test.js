import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { LANGUES } from '../data/langues.js'
import { pubsDisponibles } from './pub.js'

/**
 * `docs/fiche-google-play.md` : les textes de la fiche Google Play. Ce test les LIT — une fiche qui dépasse
 * une limite est refusée par la console, et une fiche qui annonce « 14 destinations » quand il y en a 15,
 * ou « aucune autorisation Internet » quand le manifeste en pose une, est fausse devant le public ET devant
 * le formulaire « Sécurité des données ».
 */

const RACINE = resolve(import.meta.dirname, '..', '..')
const fiche = readFileSync(join(RACINE, 'docs/fiche-google-play.md'), 'utf8')
const manifeste = readFileSync(join(RACINE, 'android/app/src/main/AndroidManifest.xml'), 'utf8')

/** { titre, courte, complete } d'une langue, lus dans les blocs de code qui suivent les intitulés. */
function textes(langue) {
  const section = fiche.split(/^## /m).find((s) => s.split('\n')[0].includes(`(${langue})`))
  if (!section) throw new Error(`section « ${langue} » introuvable dans docs/fiche-google-play.md`)
  const bloc = (intitule) => {
    const m = new RegExp(`### ${intitule}\\s+\`\`\`\\n([\\s\\S]*?)\\n\`\`\``).exec(section)
    if (!m) throw new Error(`« ${intitule} » introuvable pour ${langue}`)
    return m[1]
  }
  return { titre: bloc('Titre'), courte: bloc('Description courte'), complete: bloc('Description complète') }
}

const longueur = (s) => [...s].length
const LANGUES_FICHE = ['fr-FR', 'ar', 'en-US']

// Les chiffres du code : l'application, pas la mémoire de qui écrit la fiche.
const destinations = LANGUES.length
const etapes = LANGUES[0].lecons.length
const mots = LANGUES[0].lecons[0].mots.length
const niveaux = new Set(LANGUES[0].lecons.map((l) => l.niveau)).size

describe('fiche Google Play : les limites de la console', () => {
  for (const langue of LANGUES_FICHE) {
    it(`${langue} : titre ≤ 30, description courte ≤ 80, description complète ≤ 4 000`, () => {
      const t = textes(langue)
      expect(longueur(t.titre)).toBeLessThanOrEqual(30)
      expect(longueur(t.courte)).toBeLessThanOrEqual(80)
      expect(longueur(t.complete)).toBeLessThanOrEqual(4000)
      expect(longueur(t.titre)).toBeGreaterThan(0)
      expect(longueur(t.courte)).toBeGreaterThan(20)
      expect(longueur(t.complete)).toBeGreaterThan(1000)
    })

    it(`${langue} : pas de titre en capitales, ni de mots-clés répétés (règle « Métadonnées » de Google Play)`, () => {
      const { titre } = textes(langue)
      expect(titre).not.toMatch(/\b[A-Z]{4,}\b/)
      expect(titre).not.toMatch(/(\b\w+\b)(?:\W+\1\b)/i)
    })
  }
})

describe('fiche Google Play : les chiffres sont ceux du code', () => {
  it('les valeurs lues dans le code ont du sens (garde-fou du test lui-même)', () => {
    expect([destinations, etapes, mots, niveaux]).toEqual([15, 24, 8, 5])
  })

  const attendus = [
    ['fr-FR', /(\d+) langues, (\d+) destinations/, /(\d+) étapes de (\d+) mots, réparties en (\d+) niveaux/],
    ['ar', /(\d+) لغة، (\d+) وجهة/, /(\d+) مرحلة من (\d+) كلمات، موزّعة على (\d+) مستويات/],
    ['en-US', /(\d+) languages, (\d+) destinations/, /(\d+) steps of (\d+) words, grouped into (\d+) levels/],
  ]
  for (const [langue, motifVoyage, motifEtapes] of attendus) {
    it(`${langue} : destinations, étapes, mots et niveaux`, () => {
      const { complete, courte } = textes(langue)
      const voyage = motifVoyage.exec(complete)
      expect(voyage, 'phrase « N langues, N destinations » introuvable').not.toBeNull()
      expect(voyage.slice(1).map(Number)).toEqual([destinations, destinations])
      const detail = motifEtapes.exec(complete)
      expect(detail, 'phrase « N étapes de N mots, N niveaux » introuvable').not.toBeNull()
      expect(detail.slice(1).map(Number)).toEqual([etapes, mots, niveaux])
      expect(courte).toContain(String(destinations))
    })
  }

  it('toutes les langues du voyage sont nommées dans la description française, et dans l’anglaise', () => {
    const fr = textes('fr-FR').complete.toLowerCase()
    const ar = textes('ar').complete
    for (const l of LANGUES) {
      expect(fr, `${l.nomFr} absent du français`).toContain(l.nomFr.toLowerCase())
      expect(ar, `${l.nomAr} absent de l'arabe`).toContain(l.nomAr)
    }
  })
})

describe('fiche Google Play : ce qu’elle promet, l’application le tient', () => {
  it('« aucune autorisation d’accéder à Internet » : le manifeste RETIRE INTERNET', () => {
    for (const langue of LANGUES_FICHE) {
      const { complete } = textes(langue)
      // Le texte le dit dans les trois langues ; si l'un des trois change, ce test doit être relu avec lui.
      expect(complete).toMatch(/Internet|إنترنت/)
    }
    expect(manifeste).toMatch(/<uses-permission[^>]*android\.permission\.INTERNET[^>]*tools:node="remove"/)
  })

  it('« sans publicité » : aucun fournisseur de publicité n’est branché', () => {
    expect(pubsDisponibles()).toBe(false)
    expect(textes('fr-FR').complete).toContain('pas de publicité')
  })
})
