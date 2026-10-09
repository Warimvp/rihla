// @vitest-environment jsdom
//
// Informer d'une mise à jour sans jamais appeler le réseau : les nouveautés,
// UNE fois, à qui met l'app à jour ; la fiche App Store, un lien dans les
// Réglages de l'app iOS seulement.
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App.jsx'
import { getDictionary } from '../i18n.js'
import { LIEN_APP_STORE, VERSION_APP } from '../lib/miseajour.js'
import { mulberry32 } from '../lib/quiz.js'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const t = getDictionary('fr')
const ar = getDictionary('ar')

const montes = []
function monter(element) {
  const conteneur = document.createElement('div')
  document.body.appendChild(conteneur)
  const racine = createRoot(conteneur)
  act(() => racine.render(element))
  montes.push({ conteneur, racine })
  return { conteneur, racine }
}
// Le « lancement suivant » : on quitte l'app, on la rouvre sur le même stockage.
function relancer(precedent) {
  act(() => precedent.racine.unmount())
  precedent.conteneur.remove()
  montes.splice(montes.indexOf(precedent), 1)
  return monter(<App />)
}
const clic = (element) => {
  if (!element) throw new Error('rien à cliquer')
  act(() => element.click())
}
const bouton = (conteneur, texte) => [...conteneur.querySelectorAll('button')].find((b) => b.textContent.includes(texte))
const fenetre = (vue) => vue.querySelector('.nouveautes')

// Un voyageur qui a déjà servi : il a choisi son cap, comme avec la 1.0.
const voyageurExistant = (langue = 'fr') => {
  localStorage.setItem('rihla.cap', 'route')
  localStorage.setItem('rihla.langue', langue)
}

beforeEach(() => {
  vi.spyOn(Math, 'random').mockImplementation(mulberry32(7))
  Element.prototype.scrollIntoView = vi.fn()
})

afterEach(() => {
  for (const { racine, conteneur } of montes.splice(0)) {
    act(() => racine.unmount())
    conteneur.remove()
  }
  vi.restoreAllMocks()
  localStorage.clear()
  delete globalThis.Capacitor
  document.documentElement.removeAttribute('dir')
  document.documentElement.removeAttribute('lang')
})

describe('les nouveautés, une seule fois', () => {
  it('celui qui met à jour les voit, les ferme, et ne les revoit plus', () => {
    voyageurExistant()
    const app = monter(<App />)
    const f = fenetre(app.conteneur)
    expect(f).not.toBeNull()
    expect(f.getAttribute('role')).toBe('dialog')
    expect(f.querySelector('h2').textContent).toBe(t.nouveautes.titre)
    expect([...f.querySelectorAll('.nouveautes__point strong')].map((s) => s.textContent)).toEqual(
      t.nouveautes.points.map((p) => p.titre)
    )
    // Le bouton reçoit le focus : Entrée suffit pour la fermer.
    expect(document.activeElement).toBe(bouton(f, t.nouveautes.bouton))
    expect(localStorage.getItem('rihla.nouveautes')).toBeNull()

    clic(bouton(f, t.nouveautes.bouton))
    expect(fenetre(app.conteneur)).toBeNull()
    expect(localStorage.getItem('rihla.nouveautes')).toBe(VERSION_APP)

    const apres = relancer(app)
    expect(fenetre(apres.conteneur)).toBeNull()
  })

  it('quitter l’app sans la fermer la remontre au lancement suivant', () => {
    voyageurExistant()
    const app = monter(<App />)
    expect(fenetre(app.conteneur)).not.toBeNull()
    expect(localStorage.getItem('rihla.nouveautes')).toBeNull()
    const apres = relancer(app)
    expect(fenetre(apres.conteneur)).not.toBeNull()
  })

  it('une première installation n’a rien à découvrir : pas de fenêtre, la version rangée en silence', () => {
    localStorage.setItem('rihla.langue', 'fr')
    const app = monter(<App />)
    // C'est l'écran du cap qui s'affiche, rien d'autre.
    expect(app.conteneur.querySelector('h1').textContent).toBe(t.cap.titre)
    expect(fenetre(app.conteneur)).toBeNull()
    expect(localStorage.getItem('rihla.nouveautes')).toBe(VERSION_APP)
  })

  it('celui qui les a déjà vues ne les revoit pas', () => {
    voyageurExistant()
    localStorage.setItem('rihla.nouveautes', VERSION_APP)
    const app = monter(<App />)
    expect(fenetre(app.conteneur)).toBeNull()
  })

  it('une version plus ancienne rangée : celle-ci a ses nouveautés', () => {
    voyageurExistant()
    localStorage.setItem('rihla.nouveautes', '1.0')
    const app = monter(<App />)
    expect(fenetre(app.conteneur)).not.toBeNull()
  })

  it('Échap et un toucher hors de la fenêtre la ferment ; un toucher dedans non', () => {
    voyageurExistant()
    const app = monter(<App />)
    clic(fenetre(app.conteneur))
    expect(fenetre(app.conteneur)).not.toBeNull()
    act(() => {
      fenetre(app.conteneur).dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    })
    expect(fenetre(app.conteneur)).toBeNull()
    expect(localStorage.getItem('rihla.nouveautes')).toBe(VERSION_APP)

    localStorage.removeItem('rihla.nouveautes')
    const autre = relancer(app)
    expect(fenetre(autre.conteneur)).not.toBeNull()
    clic(autre.conteneur.querySelector('.voile-nouveautes'))
    expect(fenetre(autre.conteneur)).toBeNull()
  })

  it('parle arabe, à l’envers, à qui a choisi l’arabe', () => {
    voyageurExistant('ar')
    const app = monter(<App />)
    const f = fenetre(app.conteneur)
    expect(document.documentElement.dir).toBe('rtl')
    expect(f.querySelector('h2').textContent).toBe(ar.nouveautes.titre)
    expect(bouton(f, ar.nouveautes.bouton)).toBeDefined()
    expect(f.querySelectorAll('.nouveautes__point')).toHaveLength(ar.nouveautes.points.length)
  })
})

describe('les Réglages', () => {
  const ouvrirReglages = (app) => clic(bouton(app.conteneur, t.onglets.reglages))

  it('rouvrent les nouveautés quand on le demande', () => {
    voyageurExistant()
    localStorage.setItem('rihla.nouveautes', VERSION_APP)
    const app = monter(<App />)
    expect(fenetre(app.conteneur)).toBeNull()
    ouvrirReglages(app)
    clic(bouton(app.conteneur, t.miseAJour.nouveautes))
    expect(fenetre(app.conteneur)).not.toBeNull()
    clic(bouton(fenetre(app.conteneur), t.nouveautes.bouton))
    expect(fenetre(app.conteneur)).toBeNull()
  })

  it('ne proposent PAS l’App Store sur le web — la fiche n’y sert à rien', () => {
    voyageurExistant()
    localStorage.setItem('rihla.nouveautes', VERSION_APP)
    const app = monter(<App />)
    ouvrirReglages(app)
    expect(app.conteneur.querySelector(`a[href="${LIEN_APP_STORE}"]`)).toBeNull()
    expect(app.conteneur.textContent).not.toContain(t.miseAJour.appStore)
    expect(app.conteneur.textContent).not.toContain(t.miseAJour.sousTitreIos)
  })

  it('proposent la fiche App Store dans l’app iOS : un lien, qui s’ouvre hors de l’app', () => {
    globalThis.Capacitor = { getPlatform: () => 'ios', isNativePlatform: () => true }
    voyageurExistant()
    localStorage.setItem('rihla.nouveautes', VERSION_APP)
    const app = monter(<App />)
    ouvrirReglages(app)
    const lien = app.conteneur.querySelector(`a[href="${LIEN_APP_STORE}"]`)
    expect(lien).not.toBeNull()
    expect(lien.textContent).toBe(t.miseAJour.appStore)
    expect(lien.getAttribute('target')).toBe('_blank')
    expect(lien.getAttribute('rel')).toContain('noopener')
    expect(app.conteneur.textContent).toContain(t.miseAJour.sousTitreIos)
  })

  it('ne proposent pas la fiche App Store sur Android', () => {
    globalThis.Capacitor = { getPlatform: () => 'android', isNativePlatform: () => true }
    voyageurExistant()
    localStorage.setItem('rihla.nouveautes', VERSION_APP)
    const app = monter(<App />)
    ouvrirReglages(app)
    expect(app.conteneur.querySelector(`a[href="${LIEN_APP_STORE}"]`)).toBeNull()
  })

  it('disent la version que l’app a vraiment, pas celle du package', () => {
    voyageurExistant()
    localStorage.setItem('rihla.nouveautes', VERSION_APP)
    const app = monter(<App />)
    ouvrirReglages(app)
    expect(app.conteneur.textContent).toContain(`v${VERSION_APP}`)
    expect(app.conteneur.textContent).not.toContain('v0.1.0')
  })

  it('n’appellent jamais le réseau : ni fetch, ni XMLHttpRequest, ni WebSocket', () => {
    const fetchEspion = vi.fn()
    vi.stubGlobal('fetch', fetchEspion)
    const xhr = vi.fn()
    vi.stubGlobal('XMLHttpRequest', xhr)
    const ws = vi.fn()
    vi.stubGlobal('WebSocket', ws)
    globalThis.Capacitor = { getPlatform: () => 'ios', isNativePlatform: () => true }
    voyageurExistant()
    const app = monter(<App />)
    clic(bouton(fenetre(app.conteneur), t.nouveautes.bouton))
    ouvrirReglages(app)
    clic(bouton(app.conteneur, t.miseAJour.nouveautes))
    clic(bouton(fenetre(app.conteneur), t.nouveautes.bouton))
    expect(fetchEspion).not.toHaveBeenCalled()
    expect(xhr).not.toHaveBeenCalled()
    expect(ws).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })
})
