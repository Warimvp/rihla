// Service worker de Rihla — l'app doit marcher hors-ligne, sans jamais figer
// personne sur une vieille version.
//
// Deux régimes, et la distinction EST le fichier :
//   • les NAVIGATIONS (le HTML) vont au réseau d'abord, avec repli sur le
//     cache. Un visiteur déjà venu recevrait sinon éternellement son ancien
//     index.html — donc les anciens noms d'assets, donc l'ancienne app.
//   • tout LE RESTE vient du cache d'abord : ces fichiers sont hachés par
//     Vite (assets/index-a1b2c3.js) ou re-téléchargés de toute façon, puisque
//     le cache change de nom à chaque build.
//
// BUILD et PRECACHE sont réécrits pendant `vite build` par le plugin
// « rihla-sw » (vite.config.js) : BUILD dérive du contenu réellement livré,
// donc plus personne n'a à penser à bumper un numéro à la main. Les valeurs
// ci-dessous sont celles du fichier source (dev, tests) ; en production elles
// ne survivent jamais au build — le plugin échoue s'il ne les trouve pas.
const BUILD = 'dev'
const PRECACHE = ['./']

const CACHE = `rihla-${BUILD}`
const RACINE = './'
// Au-delà, on sert la version en cache plutôt que de laisser un écran blanc :
// réseau marocain capricieux ≠ réseau absent. Si rien n'est en cache, on
// attend quand même le réseau jusqu'au bout (voir `navigation`).
const DELAI_RESEAU = 4000

// ignoreVary : la réponse a pu être mise en cache par une requête forgée ici
// (pré-cache) dont les en-têtes diffèrent de celle du navigateur.
const trouver = (cache, requete) => cache.match(requete, { ignoreVary: true })

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) =>
      // add() un par un, et non addAll() : addAll est ATOMIQUE, un seul 404
      // ferait échouer toute l'installation et laisserait l'app sans cache.
      // Ici un fichier manquant ne coûte que lui-même.
      Promise.all(
        PRECACHE.map((url) =>
          // 'no-cache' : on revalide auprès du serveur (304 si inchangé), pour
          // ne pas figer dans le cache du SW un index.html sorti du cache HTTP.
          cache.add(new Request(url, { cache: 'no-cache' })).catch(() => {})
        )
      )
    )
  )
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      // Seulement NOS caches : CacheStorage est par origine, pas par scope —
      // un autre projet publié sur la même origine garderait les siens.
      .then((cles) =>
        Promise.all(cles.filter((k) => k.startsWith('rihla-') && k !== CACHE).map((k) => caches.delete(k)))
      )
      // claim() : prendre la main sur les onglets déjà ouverts sans attendre
      // leur prochain lancement.
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  const { request } = e
  if (request.method !== 'GET') return
  let url
  try {
    url = new URL(request.url)
  } catch {
    return
  }
  if (url.origin !== self.location.origin) return
  e.respondWith(request.mode === 'navigate' ? navigation(request) : cacheDabord(request))
})

// Une navigation ne remplace la page en cache que si c'est bien NOTRE page :
// réponse directe (pas de redirection), même origine, du HTML. Un portail
// captif (hôtel, aéroport) qui répond 200 avec sa propre page est servi —
// on n'a pas le choix — mais ne doit pas s'installer sous './' : l'avion
// suivant l'afficherait à la place de l'app.
const estNotreHtml = (reponse) =>
  reponse.ok &&
  reponse.type === 'basic' &&
  !reponse.redirected &&
  (reponse.headers.get('content-type') || '').includes('text/html')

// Le HTML : réseau d'abord. C'est ce qui débloque un visiteur figé.
async function navigation(request) {
  const cache = await caches.open(CACHE)
  // 'no-cache' : revalider auprès du serveur (304 si inchangé) plutôt que de
  // reprendre un index.html du cache HTTP — GitHub Pages le garde 10 min, et
  // il écraserait sous './' la version fraîche que l'installation vient de
  // pré-cacher. Requête reconstruite : un mode 'navigate' ne se recopie pas.
  const reseau = fetch(new Request(request.url, { cache: 'no-cache' }))
    .then((reponse) => {
      if (estNotreHtml(reponse)) cache.put(request, reponse.clone())
      return reponse
    })
    .catch(() => null)

  let minuteur
  const delai = new Promise((resolve) => {
    minuteur = setTimeout(() => resolve(null), DELAI_RESEAU)
  })
  const rapide = await Promise.race([reseau, delai])
  clearTimeout(minuteur)
  // Un 503 de l'hébergeur en plein déploiement ne vaut pas mieux qu'une
  // panne : l'app en cache passe devant toute réponse en erreur.
  if (rapide && rapide.ok) return rapide

  const enCache = (await trouver(cache, request)) || (await trouver(cache, RACINE))
  if (enCache) return enCache
  // Rien en cache : une page d'erreur vaut mieux qu'un écran blanc, et un
  // réseau lent qu'une erreur.
  return rapide || (await reseau) || Response.error()
}

// Le reste : cache d'abord, puis réseau (et on garde ce qu'on rapporte).
async function cacheDabord(request) {
  const cache = await caches.open(CACHE)
  const enCache = await trouver(cache, request)
  if (enCache) return enCache
  const reponse = await fetch(request)
  if (reponse.ok) cache.put(request, reponse.clone())
  return reponse
}
