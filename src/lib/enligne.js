// Le jeu en ligne — la SEULE porte de l'app vers un serveur (serveur/, un
// Worker Cloudflare). Tout est optionnel et éteint par défaut :
//   • sans adresse de serveur (VITE_RIHLA_SERVEUR au build, ou la clé
//     `rihla.serveur` en localStorage pour tester une autre adresse sans
//     rebâtir — utile pour l'app iOS), `enLigneDisponible()` est faux et
//     l'app est identique à la version hors-ligne : aucune carte, aucun appel ;
//   • avec un serveur, rien ne part avant que le voyageur ait ACTIVÉ le jeu en
//     ligne (`rihla.enligne`), après un écran qui dit ce qui est envoyé
//     (pseudonyme, scores, temps — jamais un compte, jamais un e-mail).
// Le transport (fetch, WebSocket) est injectable : les écrans se testent
// avec un faux serveur.

export const CLE_SERVEUR = 'rihla.serveur'
export const CLE_ENLIGNE = 'rihla.enligne'
export const CLE_LIEN_SALLE = 'salle'

const stockage = () => (typeof localStorage === 'undefined' ? null : localStorage)

const lireLocal = (cle) => {
  try {
    return stockage()?.getItem(cle) ?? null
  } catch {
    return null
  }
}

const ecrireLocal = (cle, valeur) => {
  try {
    if (valeur === null) stockage()?.removeItem(cle)
    else stockage()?.setItem(cle, valeur)
  } catch {
    /* sans stockage, le réglage vaut pour la session */
  }
}

const propre = (url) => {
  const texte = String(url ?? '').trim().replace(/\/+$/, '')
  return /^https?:\/\/\S+$/.test(texte) ? texte : ''
}

// `import.meta.env` n'existe que sous Vite : ailleurs (le serveur importe ce
// module ? non — mais un test Node pourrait) on lit prudemment.
const urlDuBuild = () => {
  try {
    return propre(import.meta.env?.VITE_RIHLA_SERVEUR)
  } catch {
    return ''
  }
}

export const urlServeur = () => propre(lireLocal(CLE_SERVEUR)) || urlDuBuild()
export const enLigneDisponible = () => urlServeur() !== ''
export const reglerServeur = (url) => ecrireLocal(CLE_SERVEUR, propre(url) || null)

export const enLigneActif = () => enLigneDisponible() && lireLocal(CLE_ENLIGNE) === 'oui'
export const reglerEnLigne = (actif) => ecrireLocal(CLE_ENLIGNE, actif ? 'oui' : 'non')

const urlWs = () => urlServeur().replace(/^http/, 'ws')

// ————— HTTP —————
async function appeler(chemin, options = {}, { fetchFn = globalThis.fetch } = {}) {
  const reponse = await fetchFn(`${urlServeur()}${chemin}`, {
    ...options,
    headers: { 'content-type': 'application/json', ...(options.headers ?? {}) },
  })
  const corps = await reponse.json().catch(() => ({}))
  if (!reponse.ok) throw new Error(corps.erreur ?? `http ${reponse.status}`)
  return corps
}

export const creerSalle = (langue, options) => appeler('/salles', { method: 'POST', body: JSON.stringify({ langue }) }, options)

export const envoyerScore = (voyageur, { type, cle, score, temps }, options) =>
  appeler(
    '/scores',
    { method: 'POST', body: JSON.stringify({ id: voyageur.id, secret: voyageur.secret, nom: voyageur.nom, type, cle, score, temps }) },
    options
  )

export const lireClassement = (type, cle, id, options) =>
  appeler(`/classement/${encodeURIComponent(type)}/${encodeURIComponent(cle)}?id=${encodeURIComponent(id ?? '')}`, {}, options)

// ————— WebSocket —————
// Un petit enrobage : messages JSON dans les deux sens, fermeture propre.
function connecter(url, { surMessage, surFermeture }, WS = globalThis.WebSocket) {
  const ws = new WS(url)
  let fermeParNous = false
  ws.onmessage = (e) => {
    try {
      surMessage(JSON.parse(e.data))
    } catch {
      /* message inattendu : ignoré */
    }
  }
  ws.onclose = (e) => surFermeture?.({ code: e?.code, voulu: fermeParNous })
  ws.onerror = () => {}
  return {
    envoyer: (message) => {
      if (ws.readyState === 1) ws.send(JSON.stringify(message))
    },
    fermer: () => {
      fermeParNous = true
      try {
        ws.close(1000)
      } catch {
        /* déjà fermé */
      }
    },
  }
}

const parametres = (voyageur, extra = {}) =>
  new URLSearchParams({ id: voyageur.id, nom: voyageur.nom, ...extra }).toString()

export const ouvrirSalle = (code, voyageur, gestionnaires, WS) =>
  connecter(`${urlWs()}/salles/${encodeURIComponent(code)}?${parametres(voyageur)}`, gestionnaires, WS)

export const chercherAdversaire = (langue, voyageur, gestionnaires, WS) =>
  connecter(`${urlWs()}/hall?${parametres(voyageur, { langue })}`, gestionnaires, WS)

export const lienSalle = (code, base = 'https://warimvp.github.io/rihla/') => `${base}#${CLE_LIEN_SALLE}=${code}`
