import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { LANGUES } from '../data/langues.js'
import { getDictionary } from '../i18n.js'
import { VOYAGEURS } from '../data/voyageurs.js'
import { MotCible, Romanisation, Sens, codeLangue } from './MotCible.jsx'
import { Defi } from './Defi.jsx'
import { JeuSouk } from './JeuSouk.jsx'
import { JeuZellige } from './JeuZellige.jsx'

const es = LANGUES.find((l) => l.id === 'es')
const ar = LANGUES.find((l) => l.id === 'ar')
const fr = LANGUES.find((l) => l.id === 'fr')
const t = getDictionary('ar')

// Sous interface arabe, on rend dans un paragraphe RTL comme le fait l'app.
const rendre = (element) => renderToStaticMarkup(<div dir="rtl">{element}</div>)

describe('codeLangue', () => {
  it('prend le code BCP-47 déjà porté par la donnée (tts)', () => {
    expect(codeLangue(es)).toBe('es-ES')
    expect(codeLangue({ id: 'ja', tts: 'ja-JP' })).toBe('ja-JP')
  })

  it("se rabat sur l'id de la langue si tts manque", () => {
    expect(codeLangue({ id: 'sw' })).toBe('sw')
    expect(codeLangue({ id: 'sw', tts: '   ' })).toBe('sw')
  })

  it('accepte un code déjà sous forme de chaîne', () => {
    expect(codeLangue('tr-TR')).toBe('tr-TR')
  })

  it("rend undefined (donc pas d'attribut) sans rien d'exploitable", () => {
    expect(codeLangue(null)).toBe(undefined)
    expect(codeLangue(undefined)).toBe(undefined)
    expect(codeLangue({})).toBe(undefined)
    expect(codeLangue('')).toBe(undefined)
  })

  it('couvre toutes les destinations', () => {
    for (const langue of LANGUES) expect(codeLangue(langue)).toMatch(/^[a-z]{2}-[A-Z]{2}$/)
  })
})

describe('MotCible', () => {
  it('pose dir="auto" ET lang sur le mot cible, isolé par <bdi>', () => {
    expect(rendre(<MotCible texte="¿Cómo estás?" langue={es} />)).toBe(
      '<div dir="rtl"><bdi dir="auto" lang="es-ES">¿Cómo estás?</bdi></div>'
    )
  })

  it('peut être un bloc, en gardant classe et style', () => {
    const html = rendre(<MotCible balise="div" className="mot-cible" style={{ fontSize: 26 }} texte="Me llamo…" langue={es} />)
    expect(html).toContain('<div dir="auto" lang="es-ES" class="mot-cible" style="font-size:26px">Me llamo…</div>')
  })

  it("n'invente pas de lang quand la langue est inconnue", () => {
    const html = rendre(<MotCible texte="como estas" langue={null} />)
    expect(html).toContain('<bdi dir="auto">como estas</bdi>')
    expect(html).not.toContain('lang=')
  })
})

describe('Romanisation', () => {
  it('force le sens latin sans lang, classe romanisation par défaut', () => {
    expect(rendre(<Romanisation texte="kayfa hâluk ?" />)).toBe(
      '<div dir="rtl"><bdi dir="ltr" class="romanisation">kayfa hâluk ?</bdi></div>'
    )
  })

  it('porte le style sur un enrobage SANS dir : la marge suit la page, pas le mot', () => {
    // Sur l'élément dir="ltr" lui-même, margin-inline-start deviendrait
    // margin-left — du mauvais côté sous interface arabe.
    const html = rendre(<Romanisation texte="kayfa hâluk ?" style={{ marginInlineStart: 8 }} />)
    expect(html).toContain('<span style="margin-inline-start:8px"><bdi dir="ltr" class="romanisation">kayfa hâluk ?</bdi></span>')
    expect(html).not.toMatch(/dir="ltr"[^>]*style=/)
  })

  it('accepte une balise bloc, enrobée en bloc quand elle a un style', () => {
    const html = rendre(<Romanisation balise="div" texte="ismî…" style={{ marginInlineStart: 8 }} />)
    expect(html).toContain('<div style="margin-inline-start:8px"><div dir="ltr" class="romanisation">ismî…</div></div>')
  })
})

describe('Sens', () => {
  const mot = { id: 'jemappelle', fr: 'Je m’appelle…', ar: 'اسمي…' }
  // Sous interface française, cette fois : un paragraphe LTR.
  const rendreFr = (element) => renderToStaticMarkup(<div dir="ltr">{element}</div>)

  it('à Paris, le sens est arabe : isolé par <bdi dir="auto" lang="ar"> sous interface française', () => {
    expect(rendreFr(<Sens mot={mot} source="fr" langue={fr} />)).toBe(
      '<div dir="ltr"><bdi dir="auto" lang="ar">اسمي…</bdi></div>'
    )
  })

  it('au Caire, le sens est français : lang="fr" sous interface arabe', () => {
    expect(rendre(<Sens mot={mot} source="ar" langue={ar} />)).toBe(
      '<div dir="rtl"><bdi dir="auto" lang="fr">Je m’appelle…</bdi></div>'
    )
  })

  it('suit le réglage « Langue des définitions » quand il s’écarte de l’interface', () => {
    expect(rendreFr(<Sens mot={mot} source="ar" langue={es} />)).toContain('<bdi dir="auto" lang="ar">اسمي…</bdi>')
    expect(rendre(<Sens mot={mot} source="fr" langue={es} />)).toContain('<bdi dir="auto" lang="fr">Je m’appelle…</bdi>')
  })

  it('accepte la destination en objet ou par son id', () => {
    expect(rendreFr(<Sens mot={mot} source="fr" langue="fr" />)).toBe(rendreFr(<Sens mot={mot} source="fr" langue={fr} />))
  })

  it('reste en ligne et garde classe et style : le bloc autour suit l’interface', () => {
    const html = rendreFr(<Sens mot={mot} source="fr" langue={fr} className="texte-2" style={{ fontSize: 13 }} />)
    expect(html).toContain('<bdi dir="auto" lang="ar" class="texte-2" style="font-size:13px">اسمي…</bdi>')
  })

  // dir="auto" lit la direction sur le premier caractère FORT du texte : un
  // sens arabe qui commencerait par un mot latin (ou l'inverse) s'afficherait
  // dans le mauvais ordre sans que rien ne casse.
  it('aucun sens des données ne trompe dir="auto"', () => {
    const RTL = /[֐-ࣿיִ-﷿ﹰ-ﻼ]/
    const premierFort = (texte) => {
      for (const c of texte) if (/\p{L}/u.test(c)) return RTL.test(c) ? 'rtl' : 'ltr'
      return null
    }
    const mots = [...LANGUES.flatMap((l) => l.lecons.flatMap((lecon) => lecon.mots)), ...Object.values(VOYAGEURS).flat()]
    expect(mots.length).toBeGreaterThan(2000)
    for (const m of mots) {
      expect(premierFort(m.fr), m.fr).toBe('ltr')
      expect(premierFort(m.ar), m.ar).toBe('rtl')
    }
  })
})

// Preuve sur les vrais écrans : le mot cible sort avec le code de SA langue,
// le sens avec celui de la langue des définitions — ici le français, sous
// interface arabe.
describe("intégration sous interface arabe", () => {
  const rien = () => {}
  const SENS = /^<span><bdi dir="auto" lang="fr">[^<]+<\/bdi><\/span>/

  it("l'étape du jour : mot cible en bloc dir=auto+lang, options de sens isolées en lang=fr", () => {
    const html = rendre(<Defi t={t} locale="ar" source="fr" surTerminer={rien} surQuitter={rien} />)
    expect(html).toMatch(/<div dir="auto" lang="[a-z]{2}-[A-Z]{2}" class="mot-cible"/)
    // Les 4 options sont des sens — arabes si le tirage du jour tombe sur Paris.
    const options = html.match(/<button[^>]*class="option"[^>]*>([\s\S]*?)<\/button>/g) ?? []
    expect(options).toHaveLength(4)
    for (const option of options) expect(option).toMatch(/<span><bdi dir="auto" lang="(fr|ar)">[^<]+<\/bdi><\/span>/)
  })

  it('le Zellige : les 6 tuiles-mots portent la langue cible, les tuiles-sens celle des définitions', () => {
    const html = rendre(<JeuZellige t={t} locale="ar" source="fr" langue={es} surXp={rien} surQuitter={rien} />)
    const faces = html.match(/<span class="tuile__face tuile__face--mot">([\s\S]*?)<\/span>/g) ?? []
    expect(faces).toHaveLength(12)
    expect(faces.filter((f) => f.includes('<bdi dir="auto" lang="es-ES">'))).toHaveLength(6)
    // Une tuile-sens est un texte isolé ou l'image du concept — jamais un texte nu.
    const sens = faces.filter((f) => !f.includes('lang="es-ES"'))
    expect(sens).toHaveLength(6)
    for (const face of sens) expect(face).toMatch(/^<span class="tuile__face tuile__face--mot">(<bdi dir="auto" lang="fr">[^<]+<\/bdi>|<svg)/)
    expect(sens.some((f) => f.includes('<bdi dir="auto" lang="fr">'))).toBe(true)
  })

  it('le Souk : le mot cible porte lang, en question comme en réponse — et le sens aussi', () => {
    // La direction de la manche est tirée au sort : on couvre les deux branches
    // en rendant plusieurs parties.
    const vus = new Set()
    for (let i = 0; i < 40 && vus.size < 2; i++) {
      const html = rendre(<JeuSouk t={t} locale="ar" source="ar" langue={ar} surXp={rien} surQuitter={rien} />)
      const etals = html.match(/<button[^>]*class="option etal"[^>]*>([\s\S]*?)<\/button>/g) ?? []
      expect(etals).toHaveLength(3)
      if (html.includes('<div dir="auto" lang="ar-SA" class="mot-cible"')) {
        vus.add('versSens')
        // Au Caire les sens sont français, même quand tout le reste est arabe.
        for (const etal of etals) expect(etal.replace(/^<button[^>]*>/, '')).toMatch(SENS)
      }
      if (/<button[^>]*class="option etal"[^>]*><span><bdi dir="auto" lang="ar-SA">/.test(html)) {
        vus.add('versMot')
        expect(html).toMatch(/<div class="mot-cible"[^>]*><bdi dir="auto" lang="fr">[^<]+<\/bdi><\/div>/)
      }
      expect(html).toContain('lang="ar-SA"')
    }
    expect([...vus].sort()).toEqual(['versMot', 'versSens'])
  })
})
