// Le hall : « un adversaire au hasard ». Un joueur ouvre un WebSocket avec
// la langue voulue ; dès qu'un second attend la même langue, une salle est
// ouverte et son code envoyé aux deux, puis leurs connexions au hall se
// ferment. La file d'attente n'est PAS gardée en mémoire : ce sont les
// WebSockets elles-mêmes (leur tag = la langue, leur pièce jointe = le
// joueur), ce qui survit à l'hibernation et aux redémarrages.
import { DurableObject } from 'cloudflare:workers'
import { nettoyerNom } from '../../src/lib/barid.js'
import { ouvrirSalle } from './commun.js'

const ATTENTE_MAX = 5 * 60 * 1000

export class Hall extends DurableObject {
  async fetch(request) {
    const url = new URL(request.url)
    const langue = String(url.searchParams.get('langue') ?? '')
    const id = String(url.searchParams.get('id') ?? '').slice(0, 32)
    const nom = nettoyerNom(url.searchParams.get('nom'))
    if (!/^[a-z0-9-]{4,32}$/i.test(id)) return new Response('identifiant invalide', { status: 400 })

    const paire = new WebSocketPair()
    const [client, serveur] = Object.values(paire)
    this.ctx.acceptWebSocket(serveur, [langue])
    serveur.serializeAttachment({ id, nom, langue, depuis: Date.now() })

    const partenaire = this.ctx
      .getWebSockets(langue)
      .find((ws) => ws !== serveur && ws.readyState === WebSocket.OPEN && ws.deserializeAttachment()?.id !== id)

    if (!partenaire) {
      serveur.send(JSON.stringify({ type: 'attente' }))
      await this.ctx.storage.setAlarm(Date.now() + ATTENTE_MAX)
      return new Response(null, { status: 101, webSocket: client })
    }

    const code = await ouvrirSalle(this.env, langue)
    const message = JSON.stringify(code ? { type: 'salle', code } : { type: 'erreur', code: 'complet' })
    for (const ws of [partenaire, serveur]) {
      try {
        ws.send(message)
        ws.close(1000, 'apparié')
      } catch {
        /* parti entre-temps */
      }
    }
    return new Response(null, { status: 101, webSocket: client })
  }

  async webSocketMessage(ws, brut) {
    if (String(brut).includes('"ping"')) ws.send(JSON.stringify({ type: 'pong' }))
  }

  async webSocketClose(ws) {
    ws.close(1000)
  }

  async webSocketError(ws) {
    ws.close(1011)
  }

  // Personne ne doit attendre éternellement : passé le délai, on renvoie chacun.
  async alarm() {
    const maintenant = Date.now()
    let restants = 0
    for (const ws of this.ctx.getWebSockets()) {
      const { depuis = 0 } = ws.deserializeAttachment() ?? {}
      if (maintenant - depuis >= ATTENTE_MAX) {
        try {
          ws.send(JSON.stringify({ type: 'erreur', code: 'personne' }))
          ws.close(1000, 'personne')
        } catch {
          /* déjà fermé */
        }
      } else restants += 1
    }
    if (restants) await this.ctx.storage.setAlarm(maintenant + ATTENTE_MAX)
  }
}
