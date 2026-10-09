import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { getDictionary } from '../i18n.js'
import { CLE_NOUVEAUTES, LIEN_APP_STORE, VERSION_APP, decision, estIos } from './miseajour.js'

const lire = (chemin) => readFileSync(new URL(`../../${chemin}`, import.meta.url), 'utf8')

describe('qui voit les nouveautés', () => {
  it('celui qui les a déjà vues ne les revoit pas, et rien n’est réécrit', () => {
    expect(decision({ vue: VERSION_APP, existant: true })).toEqual({ montrer: false, marquer: false })
    expect(decision({ vue: VERSION_APP, existant: false })).toEqual({ montrer: false, marquer: false })
  })

  it('une première installation n’a rien à découvrir : la version est rangée en silence', () => {
    expect(decision({ vue: null, existant: false })).toEqual({ montrer: false, marquer: true })
  })

  it('celui qui met à jour (l’app a déjà servi, mais ne connaît pas la clé) les voit', () => {
    expect(decision({ vue: null, existant: true })).toEqual({ montrer: true, marquer: false })
  })

  it('une version plus ancienne rangée : les nouveautés de la suivante s’affichent', () => {
    expect(decision({ vue: '1.0', existant: false })).toEqual({ montrer: true, marquer: false })
    expect(decision({ vue: '1.0', existant: true, version: '1.1' })).toEqual({ montrer: true, marquer: false })
  })

  it('lit une clé qui existe vraiment', () => {
    expect(CLE_NOUVEAUTES).toBe('rihla.nouveautes')
  })
})

describe('la version dite par l’app', () => {
  it('suit MAJEUR.MINEUR de MARKETING_VERSION dans le projet iOS', () => {
    // Oublier de monter VERSION_APP à la 1.2 laisserait les nouveautés de la
    // 1.1 sous les yeux de tous : le test refuse, comme il refuse les textes
    // restés ceux de la version d'avant.
    const projet = lire('ios/App/App.xcodeproj/project.pbxproj')
    const versions = [...new Set([...projet.matchAll(/MARKETING_VERSION = ([^;]+);/g)].map((m) => m[1].trim()))]
    expect(versions).toHaveLength(1)
    expect(versions[0].split('.').slice(0, 2).join('.')).toBe(VERSION_APP)
  })

  it('a sa fenêtre en français ET en arabe, avec le même nombre de points', () => {
    const fr = getDictionary('fr').nouveautes
    const ar = getDictionary('ar').nouveautes
    for (const langue of [fr, ar]) {
      for (const cle of ['titre', 'intro', 'bouton']) expect(langue[cle]).toMatch(/\S/)
      expect(langue.points.length).toBeGreaterThanOrEqual(1)
      for (const point of langue.points) {
        expect(point.titre).toMatch(/\S/)
        expect(point.texte).toMatch(/\S/)
      }
    }
    expect(ar.points).toHaveLength(fr.points.length)
    expect(ar.titre).not.toBe(fr.titre)
  })
})

describe('la fenêtre dans la page', () => {
  const CSS = lire('src/styles.css')
  const regle = (selecteur) => {
    const debut = CSS.indexOf(`\n${selecteur} {`)
    expect(debut, `la règle ${selecteur}`).toBeGreaterThan(-1)
    return CSS.slice(debut, CSS.indexOf('}', debut))
  }
  const z = (bloc) => Number(/z-index:\s*(\d+)/.exec(bloc)[1])

  // Cette branche (Android) n'a pas le voile de la barre d'état iOS (`.voile-etat`) :
  // la règle qui compte ici est que la fenêtre passe au-dessus de TOUTE autre couche.
  it('passe au-dessus de toutes les autres couches de la page', () => {
    const tous = [...CSS.matchAll(/z-index:\s*(\d+)/g)].map((m) => Number(m[1]))
    expect(tous.length).toBeGreaterThan(1)
    expect(z(regle('.voile-nouveautes'))).toBeGreaterThanOrEqual(Math.max(...tous))
  })

  it('a les mêmes valeurs que la feuille d’une question — ou le dit autrement', () => {
    // Même coque, mêmes marges : si `.feuille` bouge, celle-ci doit suivre.
    const sans = (bloc) => bloc.replace(/^\n\.[\w-]+ \{/, '').replace(/\s+/g, ' ').trim()
    expect(sans(regle('.nouveautes'))).toBe(sans(regle('.feuille')))
    expect(sans(regle('.voile-nouveautes'))).toBe(sans(regle('.voile')))
  })
})

describe('le lien vers la fiche', () => {
  it('est celui de l’App Store, et le même que la bannière Safari de la page', () => {
    expect(LIEN_APP_STORE).toMatch(/^https:\/\/apps\.apple\.com\/app\/id\d+$/)
    const id = LIEN_APP_STORE.split('/id')[1]
    expect(lire('index.html')).toContain(`app-id=${id}`)
  })
})

describe('l’app iOS, pas n’importe quelle coque native', () => {
  afterEach(() => {
    delete globalThis.Capacitor
  })

  it('reconnaît iOS seulement', () => {
    globalThis.Capacitor = { getPlatform: () => 'ios' }
    expect(estIos()).toBe(true)
    globalThis.Capacitor = { getPlatform: () => 'android' }
    expect(estIos()).toBe(false)
    globalThis.Capacitor = { getPlatform: () => 'web' }
    expect(estIos()).toBe(false)
  })

  it('reste faux sans Capacitor — le web est celui d’avant — ou si Capacitor se plaint', () => {
    expect(estIos()).toBe(false)
    globalThis.Capacitor = {
      getPlatform: () => {
        throw new Error('pas de plateforme')
      },
    }
    expect(estIos()).toBe(false)
  })
})
