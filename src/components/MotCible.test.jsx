import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { LANGUES } from '../data/langues.js'
import { getDictionary } from '../i18n.js'
import { MotCible, Romanisation, codeLangue } from './MotCible.jsx'
import { Defi } from './Defi.jsx'
import { JeuSouk } from './JeuSouk.jsx'
import { JeuZellige } from './JeuZellige.jsx'

const es = LANGUES.find((l) => l.id === 'es')
const ar = LANGUES.find((l) => l.id === 'ar')
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

  it('couvre les 14 destinations', () => {
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

// Preuve sur les vrais écrans : le mot cible sort avec ses attributs, le SENS
// (langue des définitions) n'en reçoit aucun.
describe("intégration sous interface arabe", () => {
  const rien = () => {}

  it("l'étape du jour : mot cible en bloc dir=auto+lang, options de sens nues", () => {
    const html = rendre(<Defi t={t} locale="ar" source="auto" surTerminer={rien} surQuitter={rien} />)
    expect(html).toMatch(/<div dir="auto" lang="[a-z]{2}-[A-Z]{2}" class="mot-cible"/)
    // Les 4 options sont des sens : aucun bdi/lang dedans.
    const options = html.match(/<button[^>]*class="option"[^>]*>([\s\S]*?)<\/button>/g) ?? []
    expect(options).toHaveLength(4)
    for (const option of options) expect(option).not.toMatch(/lang=|<bdi/)
  })

  it('le Zellige : les 6 tuiles-mots sont isolées et étiquetées, les 6 tuiles-sens non', () => {
    const html = rendre(<JeuZellige t={t} locale="ar" source="auto" langue={es} surXp={rien} surQuitter={rien} />)
    const faces = html.match(/<span class="tuile__face tuile__face--mot">([\s\S]*?)<\/span>/g) ?? []
    expect(faces).toHaveLength(12)
    expect(faces.filter((f) => f.includes('<bdi dir="auto" lang="es-ES">'))).toHaveLength(6)
    expect(faces.filter((f) => !f.includes('lang='))).toHaveLength(6)
  })

  it('le Souk : le mot cible porte lang, en question comme en réponse', () => {
    // La direction de la manche est tirée au sort : on couvre les deux branches
    // en rendant plusieurs parties.
    const vus = new Set()
    for (let i = 0; i < 40 && vus.size < 2; i++) {
      const html = rendre(<JeuSouk t={t} locale="ar" source="auto" langue={ar} surXp={rien} surQuitter={rien} />)
      if (html.includes('<div dir="auto" lang="ar-SA" class="mot-cible"')) vus.add('versSens')
      if (/<button[^>]*class="option etal"[^>]*><span><bdi dir="auto" lang="ar-SA">/.test(html)) vus.add('versMot')
      expect(html).toContain('lang="ar-SA"')
    }
    expect([...vus].sort()).toEqual(['versMot', 'versSens'])
  })
})
