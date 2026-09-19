// Le Worker : un routeur minuscule devant trois Durable Objects. Aucune
// donnée n'est lue ni écrite ici — tout l'état vit dans les objets, qui
// importent la règle du jeu de l'app elle-même (../../src/lib/salle.js).
// Ce module n'exporte que ce que workerd accepte : le gestionnaire par
// défaut et les classes ; les utilitaires vivent dans commun.js.
import { codeValide } from '../../src/lib/salle.js'
import { VERSION, cleClassementValide, langueConnue, ouvrirSalle } from './commun.js'
import { Salle } from './salle.js'
import { Hall } from './hall.js'
import { Registre } from './registre.js'

export { Salle, Hall, Registre }

const entetesCors = (env) => ({
  'access-control-allow-origin': env.ORIGINES || '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'content-type',
  'access-control-max-age': '86400',
})

const json = (env, corps, statut = 200) =>
  new Response(JSON.stringify(corps), {
    status: statut,
    headers: { 'content-type': 'application/json; charset=utf-8', ...entetesCors(env) },
  })

const erreur = (env, code, statut) => json(env, { erreur: code }, statut)

const lireJson = async (request) => {
  try {
    const lu = await request.json()
    return lu && typeof lu === 'object' ? lu : {}
  } catch {
    return {}
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const segments = url.pathname.split('/').filter(Boolean)

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: entetesCors(env) })

    if (segments.length === 0) return json(env, { ok: true, service: 'rihla-serveur', version: VERSION })

    // POST /salles { langue } → { code }
    if (segments[0] === 'salles' && segments.length === 1 && request.method === 'POST') {
      const { langue } = await lireJson(request)
      if (!langueConnue(langue)) return erreur(env, 'langue', 400)
      const code = await ouvrirSalle(env, langue)
      return code ? json(env, { code }) : erreur(env, 'complet', 503)
    }

    // GET /salles/:code (WebSocket) → la salle
    if (segments[0] === 'salles' && segments.length === 2) {
      const code = segments[1].toUpperCase()
      if (!codeValide(code)) return erreur(env, 'code', 400)
      if (request.headers.get('upgrade')?.toLowerCase() !== 'websocket') {
        const existe = await env.SALLE.getByName(code).existe()
        return existe ? json(env, { code }) : erreur(env, 'introuvable', 404)
      }
      return env.SALLE.getByName(code).fetch(request)
    }

    // GET /hall?langue= (WebSocket) → la file d'attente
    if (segments[0] === 'hall' && segments.length === 1) {
      if (request.headers.get('upgrade')?.toLowerCase() !== 'websocket') return erreur(env, 'websocket', 426)
      if (!langueConnue(url.searchParams.get('langue'))) return erreur(env, 'langue', 400)
      return env.HALL.getByName('hall').fetch(request)
    }

    // GET /classement/:type/:cle?id= → { lignes, moi, total }
    if (segments[0] === 'classement' && segments.length === 3 && request.method === 'GET') {
      const [, type, cle] = segments
      if (!cleClassementValide(type, cle)) return erreur(env, 'cle', 400)
      const resultat = await env.REGISTRE.getByName(`${type}:${cle}`).classement(url.searchParams.get('id') ?? '')
      return json(env, resultat)
    }

    // POST /scores { id, secret, nom, type, cle, score, temps } → { ok, rang, total }
    if (segments[0] === 'scores' && segments.length === 1 && request.method === 'POST') {
      const corps = await lireJson(request)
      if (corps.type !== 'jour' || !cleClassementValide(corps.type, corps.cle)) return erreur(env, 'cle', 400)
      const resultat = await env.REGISTRE.getByName(`${corps.type}:${corps.cle}`).inscrire(corps)
      return json(env, resultat, resultat.ok ? 200 : 403)
    }

    return erreur(env, 'introuvable', 404)
  },
}
