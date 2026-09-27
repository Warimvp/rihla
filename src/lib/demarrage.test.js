// Le script de démarrage d'index.html pose le thème, la langue et la direction
// AVANT la première image — React ne le fait qu'après son premier rendu. Il
// vit dans le HTML, hors de portée des imports : on l'extrait et on l'évalue
// ici dans un faux document, pour prouver qu'il lit les mêmes clés que
// App.jsx et qu'il ne peut pas empêcher l'app de démarrer.
import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { localeDuSysteme } from '../i18n.js'

const HTML = readFileSync(new URL('../../index.html', import.meta.url), 'utf8')
const APP = readFileSync(new URL('../App.jsx', import.meta.url), 'utf8')
const POLICES_CSS = readFileSync(new URL('../../public/polices/polices.css', import.meta.url), 'utf8')

const scripts = [...HTML.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1])

const demarrer = (stockage, langues = ['fr-FR']) => {
  const racine = { lang: 'fr', dir: '', dataset: {} }
  const navigator = { languages: langues, language: langues[0] }
  const liens = []
  const document = {
    documentElement: racine,
    createElement: (balise) => ({ balise }),
    head: { appendChild: (lien) => liens.push(lien) },
  }
  const localStorage =
    stockage === null
      ? {
          getItem() {
            throw new Error('stockage interdit')
          },
        }
      : { getItem: (cle) => stockage[cle] ?? null }
  // eslint-disable-next-line no-new-func
  new Function('document', 'localStorage', 'navigator', scripts[0])(document, localStorage, navigator)
  return { ...racine, liens }
}

const sansLiens = ({ liens, ...racine }) => racine

describe('le script de démarrage', () => {
  it('est le seul script en ligne de la page, et passe avant le module de l’app', () => {
    expect(scripts).toHaveLength(1)
    expect(HTML.indexOf('<script>')).toBeLessThan(HTML.indexOf('<script type="module"'))
  })

  it('ne touche à rien au premier lancement : français, thème du système', () => {
    expect(sansLiens(demarrer({}))).toEqual({ lang: 'fr', dir: '', dataset: {} })
  })

  it('pose le thème choisi, et laisse « auto » au media query', () => {
    expect(demarrer({ 'rihla.theme': 'sombre' }).dataset.theme).toBe('sombre')
    expect(demarrer({ 'rihla.theme': 'clair' }).dataset.theme).toBe('clair')
    expect(demarrer({ 'rihla.theme': 'auto' }).dataset).toEqual({})
    expect(demarrer({ 'rihla.theme': '"><script>' }).dataset).toEqual({})
  })

  it('retourne la page pour l’arabe, et seulement pour lui', () => {
    expect(demarrer({ 'rihla.langue': 'ar' })).toMatchObject({ lang: 'ar', dir: 'rtl' })
    expect(demarrer({ 'rihla.langue': 'fr' })).toMatchObject({ lang: 'fr', dir: '' })
    expect(demarrer({ 'rihla.langue': 'xx' })).toMatchObject({ lang: 'fr', dir: '' })
  })

  it('au premier lancement, prend la langue du téléphone — la même règle que l’app', () => {
    const cas = [['ar-MA', 'fr-FR'], ['ar'], ['AR-eg'], ['fr-MA', 'ar-MA'], ['en-US'], ['arn-CL'], []]
    for (const langues of cas) {
      const attendue = localeDuSysteme(langues)
      expect(demarrer({}, langues), JSON.stringify(langues)).toMatchObject(attendue === 'ar' ? { lang: 'ar', dir: 'rtl' } : { lang: 'fr', dir: '' })
      // Sans stockage du tout, pareil.
      expect(demarrer(null, langues).lang, JSON.stringify(langues)).toBe(attendue)
    }
    // Un choix fait dans l'app passe devant la langue du téléphone.
    expect(demarrer({ 'rihla.langue': 'fr' }, ['ar-MA'])).toMatchObject({ lang: 'fr', dir: '' })
    expect(demarrer({ 'rihla.langue': 'ar' }, ['fr-FR'])).toMatchObject({ lang: 'ar', dir: 'rtl' })
    expect(demarrer({}, ['ar-MA']).liens.map((l) => l.href)).toEqual(['./polices/amiri-4f1f7dad.woff2', './polices/readexpro-0136d09f.woff2'])
  })

  it('n’empêche jamais l’app de démarrer, même sans stockage', () => {
    expect(() => demarrer(null)).not.toThrow()
    expect(sansLiens(demarrer(null))).toEqual({ lang: 'fr', dir: '', dataset: {} })
    expect(demarrer(null).liens).toHaveLength(2)
  })

  it('précharge les deux polices du premier écran — celles de la langue, et des fichiers qui existent', () => {
    const fichiers = (stockage) => demarrer(stockage).liens.map((l) => l.href)
    expect(fichiers({})).toEqual(['./polices/youngserif-1519d27a.woff2', './polices/readexpro-bf33cab6.woff2'])
    expect(fichiers({ 'rihla.langue': 'ar' })).toEqual(['./polices/amiri-4f1f7dad.woff2', './polices/readexpro-0136d09f.woff2'])
    for (const stockage of [{}, { 'rihla.langue': 'ar' }]) {
      for (const lien of demarrer(stockage).liens) {
        expect(lien).toMatchObject({ balise: 'link', rel: 'preload', as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' })
        // Des polices régénérées changent de nom : un préchargement resté sur
        // l'ancien ferait un 404 à chaque lancement, en silence.
        const nom = lien.href.replace('./polices/', '')
        expect(existsSync(new URL(`../../public/polices/${nom}`, import.meta.url)), nom).toBe(true)
        expect(POLICES_CSS, nom).toContain(`url('${nom}')`)
      }
    }
  })

  it('lit les clés et les valeurs qu’écrit App.jsx', () => {
    for (const texte of ["'rihla.theme'", "'rihla.langue'", "'clair'", "'sombre'"]) {
      expect(scripts[0], texte).toContain(texte)
      expect(APP, texte).toContain(texte)
    }
  })
})
