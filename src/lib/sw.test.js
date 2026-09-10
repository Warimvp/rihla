// Le service worker vit dans public/sw.js : Vite le copie tel quel, il n'est
// donc ni transformé ni importable. On l'évalue ici dans un faux monde de
// service worker (caches, fetch, Request, Response, self) pour prouver les
// quatre comportements dont dépend l'app : réseau d'abord sur les
// navigations, cache d'abord sur le reste, pré-cache tolérant aux erreurs,
// et purge des anciens caches.
import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const SOURCE = readFileSync(new URL('../../public/sw.js', import.meta.url), 'utf8')

// Sous-chemin volontaire (GitHub Pages /rihla/) : './' doit s'y résoudre.
const SW = 'https://exemple.ma/rihla/sw.js'
const RACINE = 'https://exemple.ma/rihla/'

// Ce que fait le plugin « rihla-sw » au build. Si la constante change de nom,
// ce remplacement ne mord plus — et le test échoue, comme le build.
const avecPrecache = (source, liste) => {
  const reecrit = source.replace(/const PRECACHE = \[[^\]]*\]/, `const PRECACHE = ${JSON.stringify(liste)}`)
  if (reecrit === source) throw new Error('marqueur PRECACHE introuvable dans public/sw.js')
  return reecrit
}

class Requete {
  constructor(entree, options = {}) {
    this.url = typeof entree === 'string' ? new URL(entree, SW).href : entree.url
    this.method = options.method ?? entree.method ?? 'GET'
    this.mode = options.mode ?? entree.mode ?? 'cors'
    this.cache = options.cache ?? 'default'
  }
}

class Reponse {
  constructor(corps, { status = 200, type = 'basic', redirected = false, contentType = 'text/html' } = {}) {
    this.corps = corps
    this.status = status
    this.ok = status >= 200 && status < 300
    this.type = type
    this.redirected = redirected
    this.headers = new Map([['content-type', contentType]])
  }
  clone() {
    return new Reponse(this.corps, {
      status: this.status,
      type: this.type,
      redirected: this.redirected,
      contentType: this.headers.get('content-type'),
    })
  }
  static error() {
    return new Reponse(null, { status: 0 })
  }
}

const cle = (requete) => (typeof requete === 'string' ? new URL(requete, SW).href : requete.url)

class Cache {
  constructor(reseau) {
    this.entrees = new Map()
    this.reseau = reseau
  }
  async match(requete) {
    return this.entrees.get(cle(requete))
  }
  async put(requete, reponse) {
    this.entrees.set(cle(requete), reponse)
  }
  async add(requete) {
    const reponse = await this.reseau.fetch(requete)
    if (!reponse.ok) throw new TypeError('réponse non-ok')
    this.entrees.set(cle(requete), reponse)
  }
  urls() {
    return [...this.entrees.keys()]
  }
}

// Évalue le source du SW dans le bac à sable et rend les prises en main.
function executer({ precache = ['./'] } = {}) {
  const ecouteurs = {}
  const stockage = new Map()
  const appels = []
  const reseau = { repondre: async () => new Reponse('réseau') }

  const cachesFactices = {
    async open(nom) {
      if (!stockage.has(nom)) stockage.set(nom, new Cache({ fetch: (r) => reseau.repondre(r) }))
      return stockage.get(nom)
    },
    async keys() {
      return [...stockage.keys()]
    },
    async delete(nom) {
      return stockage.delete(nom)
    },
  }

  const self = {
    location: new URL(SW),
    addEventListener: (type, fn) => {
      ecouteurs[type] = fn
    },
    skipWaiting: vi.fn(),
    clients: { claim: vi.fn(async () => {}) },
  }

  const fetchFactice = (requete) => {
    appels.push(cle(requete))
    return reseau.repondre(requete)
  }

  // eslint-disable-next-line no-new-func
  new Function('self', 'caches', 'fetch', 'Request', 'Response', avecPrecache(SOURCE, precache))(
    self,
    cachesFactices,
    fetchFactice,
    Requete,
    Reponse
  )

  const install = async () => {
    const attentes = []
    ecouteurs.install({ waitUntil: (p) => attentes.push(p) })
    await Promise.all(attentes)
  }
  const activate = async () => {
    const attentes = []
    ecouteurs.activate({ waitUntil: (p) => attentes.push(p) })
    await Promise.all(attentes)
  }
  const demander = (url, options) => {
    const requete = new Requete(url, options)
    let promesse
    ecouteurs.fetch({ request: requete, respondWith: (p) => (promesse = p) })
    return promesse
  }
  const cache = async (nom) => cachesFactices.open(nom)

  return { ecouteurs, stockage, appels, reseau, self, install, activate, demander, cache }
}

const souffler = async () => {
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()
}

// Le nom de cache du fichier source (le build le remplace par un hash).
const CACHE = 'rihla-dev'

describe('navigations : réseau d’abord', () => {
  it('sert la version fraîche même si l’ancienne est en cache (le visiteur figé)', async () => {
    const sw = executer()
    const stock = await sw.cache(CACHE)
    await stock.put(RACINE, new Reponse('ancien index'))
    sw.reseau.repondre = async () => new Reponse('nouvel index')

    const reponse = await sw.demander('./', { mode: 'navigate' })

    expect(reponse.corps).toBe('nouvel index')
    await souffler()
    expect((await stock.match(RACINE)).corps).toBe('nouvel index')
  })

  it('retombe sur le cache quand le réseau échoue (hors-ligne)', async () => {
    const sw = executer()
    const stock = await sw.cache(CACHE)
    await stock.put(RACINE, new Reponse('index hors-ligne'))
    sw.reseau.repondre = async () => {
      throw new TypeError('réseau injoignable')
    }

    const reponse = await sw.demander('./', { mode: 'navigate' })
    expect(reponse.corps).toBe('index hors-ligne')
  })

  it('retombe sur la racine pour une URL jamais visitée', async () => {
    const sw = executer()
    const stock = await sw.cache(CACHE)
    await stock.put(RACINE, new Reponse('index hors-ligne'))
    sw.reseau.repondre = async () => {
      throw new TypeError('réseau injoignable')
    }

    const reponse = await sw.demander('./index.html', { mode: 'navigate' })
    expect(reponse.corps).toBe('index hors-ligne')
  })

  it('revalide l’index auprès du serveur : le cache HTTP de l’hébergeur ne fait pas foi', async () => {
    const sw = executer()
    const vues = []
    sw.reseau.repondre = async (requete) => {
      vues.push(requete.cache)
      return new Reponse('index')
    }

    await sw.demander('./', { mode: 'navigate' })
    expect(vues).toEqual(['no-cache'])
  })

  it('sert l’app en cache plutôt qu’une erreur du serveur (503 en plein déploiement)', async () => {
    const sw = executer()
    const stock = await sw.cache(CACHE)
    await stock.put(RACINE, new Reponse('index en cache'))
    sw.reseau.repondre = async () => new Reponse('hébergeur en panne', { status: 503 })

    const reponse = await sw.demander('./', { mode: 'navigate' })
    expect(reponse.corps).toBe('index en cache')
    await souffler()
    expect((await stock.match(RACINE)).corps).toBe('index en cache')
  })

  it('rend l’erreur du serveur seulement quand rien n’est en cache', async () => {
    const sw = executer()
    sw.reseau.repondre = async () => new Reponse('hébergeur en panne', { status: 503 })

    const reponse = await sw.demander('./', { mode: 'navigate' })
    expect(reponse.status).toBe(503)
  })

  it('sert la page d’un portail captif sans la garder sous la racine', async () => {
    const sw = executer()
    const stock = await sw.cache(CACHE)
    await stock.put(RACINE, new Reponse('vraie app'))
    sw.reseau.repondre = async () => new Reponse('bienvenue à l’hôtel', { redirected: true })

    const reponse = await sw.demander('./', { mode: 'navigate' })
    expect(reponse.corps).toBe('bienvenue à l’hôtel')
    await souffler()
    expect((await stock.match(RACINE)).corps).toBe('vraie app')
  })
})

describe('navigations : réseau lent', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('sert le cache si le réseau traîne au-delà du délai', async () => {
    const sw = executer()
    const stock = await sw.cache(CACHE)
    await stock.put(RACINE, new Reponse('index hors-ligne'))
    sw.reseau.repondre = () => new Promise(() => {})

    const promesse = sw.demander('./', { mode: 'navigate' })
    await vi.advanceTimersByTimeAsync(5000)
    expect((await promesse).corps).toBe('index hors-ligne')
  })

  it('attend le réseau jusqu’au bout quand il n’y a rien en cache', async () => {
    const sw = executer()
    let livrer
    sw.reseau.repondre = () => new Promise((resolve) => (livrer = resolve))

    const promesse = sw.demander('./', { mode: 'navigate' })
    await vi.advanceTimersByTimeAsync(5000)
    livrer(new Reponse('index tardif'))
    expect((await promesse).corps).toBe('index tardif')
  })
})

describe('assets : cache d’abord', () => {
  it('sert un asset haché sans toucher au réseau', async () => {
    const sw = executer()
    const stock = await sw.cache(CACHE)
    await stock.put('./assets/index-a1b2c3.js', new Reponse('js en cache'))
    sw.reseau.repondre = async () => {
      throw new TypeError('le réseau ne doit pas être appelé')
    }

    const reponse = await sw.demander('./assets/index-a1b2c3.js')
    expect(reponse.corps).toBe('js en cache')
    expect(sw.appels).toEqual([])
  })

  it('va au réseau et garde ce qu’il rapporte quand le cache est vide', async () => {
    const sw = executer()
    sw.reseau.repondre = async () => new Reponse('js frais')

    const reponse = await sw.demander('./assets/index-a1b2c3.js')
    expect(reponse.corps).toBe('js frais')
    await souffler()
    const stock = await sw.cache(CACHE)
    expect((await stock.match('./assets/index-a1b2c3.js')).corps).toBe('js frais')
  })

  it('laisse passer les requêtes non-GET et les autres origines', async () => {
    const sw = executer()
    expect(sw.demander('./', { mode: 'navigate', method: 'POST' })).toBeUndefined()
    expect(sw.demander('https://ailleurs.example/x.js')).toBeUndefined()
  })
})

describe('installation', () => {
  it('pré-cache toute l’app, pas seulement la racine', async () => {
    const sw = executer({ precache: ['./', './assets/a.js', './polices/amiri.woff2'] })
    sw.reseau.repondre = async (requete) => new Reponse(`corps de ${requete.url}`)

    await sw.install()

    const stock = await sw.cache(CACHE)
    expect(stock.urls()).toEqual([
      RACINE,
      `${RACINE}assets/a.js`,
      `${RACINE}polices/amiri.woff2`,
    ])
    expect(sw.self.skipWaiting).toHaveBeenCalled()
  })

  it('survit à un fichier manquant : addAll aurait tout perdu', async () => {
    const sw = executer({ precache: ['./', './assets/absent.js', './polices/amiri.woff2'] })
    sw.reseau.repondre = async (requete) =>
      requete.url.endsWith('absent.js') ? new Reponse(null, { status: 404 }) : new Reponse('ok')

    await expect(sw.install()).resolves.not.toThrow()

    const stock = await sw.cache(CACHE)
    expect(stock.urls()).toEqual([RACINE, `${RACINE}polices/amiri.woff2`])
  })

  it('revalide au lieu de recopier le cache HTTP', async () => {
    const sw = executer({ precache: ['./'] })
    const vues = []
    sw.reseau.repondre = async (requete) => {
      vues.push(requete.cache)
      return new Reponse('index')
    }

    await sw.install()
    expect(vues).toEqual(['no-cache'])
  })
})

describe('activation', () => {
  it('supprime les caches des builds précédents et prend la main', async () => {
    const sw = executer()
    await sw.cache('rihla-v2')
    await sw.cache('rihla-0.1.0-abcdef')
    await sw.cache('autre-app')
    await sw.cache(CACHE)

    await sw.activate()

    expect([...sw.stockage.keys()]).toEqual(['autre-app', CACHE])
    expect(sw.self.clients.claim).toHaveBeenCalled()
  })
})
