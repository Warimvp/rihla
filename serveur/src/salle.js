// Une salle de duel en direct = un Durable Object. Il ne connaît qu'un état
// (storage 'etat'), lui applique `reduire` (../../src/lib/salle.js — la règle
// partagée avec l'app) et distribue les sorties : messages aux WebSockets,
// alarme, classement, ménage. Les WebSockets sont hibernables : l'objet dort
// entre deux réponses, la connexion reste ouverte.
import { DurableObject } from 'cloudflare:workers'
import { LANGUES } from '../../src/data/langues.js'
import { construireBarid, nettoyerNom, nouvelleGraine } from '../../src/lib/barid.js'
import { MENAGE, etatInitial, reduire, semaineIso } from '../../src/lib/salle.js'
import { alea } from './commun.js'

const jourUtc = (maintenant) => new Date(maintenant).toISOString().slice(0, 10)

export class Salle extends DurableObject {
  // Appelé par le Worker à la création : vrai si la salle était libre.
  async initialiser(langue) {
    const existante = await this.ctx.storage.get('etat')
    if (existante) return false
    const graine = nouvelleGraine(alea)
    const bonnes = construireBarid(LANGUES, langue, graine).map((q) => q.mot.id)
    if (!bonnes.length) return false
    const maintenant = Date.now()
    await this.ctx.storage.put('etat', etatInitial({ langue, graine, bonnes, maintenant }))
    await this.ctx.storage.setAlarm(maintenant + MENAGE)
    return true
  }

  async existe() {
    return Boolean(await this.ctx.storage.get('etat'))
  }

  // L'entrée d'un joueur : GET …/salles/:code?id=&nom= avec Upgrade: websocket.
  async fetch(request) {
    const etat = await this.ctx.storage.get('etat')
    if (!etat) return new Response('salle introuvable', { status: 404 })
    const url = new URL(request.url)
    const id = String(url.searchParams.get('id') ?? '').slice(0, 32)
    const nom = nettoyerNom(url.searchParams.get('nom'))
    if (!/^[a-z0-9-]{4,32}$/i.test(id)) return new Response('identifiant invalide', { status: 400 })

    const paire = new WebSocketPair()
    const [client, serveur] = Object.values(paire)
    // Le tag = l'id du joueur : on retrouve ses sockets même après hibernation.
    this.ctx.acceptWebSocket(serveur, [id])
    serveur.serializeAttachment({ id, nom })
    await this.traiter({ type: 'entrer', id, nom, maintenant: Date.now() })
    return new Response(null, { status: 101, webSocket: client })
  }

  async webSocketMessage(ws, brut) {
    const { id } = ws.deserializeAttachment() ?? {}
    if (!id) return
    let message
    try {
      message = JSON.parse(typeof brut === 'string' ? brut : new TextDecoder().decode(brut))
    } catch {
      return
    }
    const maintenant = Date.now()
    if (message.type === 'repondre') {
      await this.traiter({ type: 'repondre', id, i: Number(message.i), optionId: String(message.optionId ?? ''), maintenant })
    } else if (message.type === 'revanche') {
      // Une nouvelle graine est tirée ici : le réducteur ne connaît pas le contenu.
      const etat = await this.ctx.storage.get('etat')
      if (!etat) return
      const graine = nouvelleGraine(alea)
      const bonnes = construireBarid(LANGUES, etat.langue, graine).map((q) => q.mot.id)
      await this.traiter({ type: 'revanche', id, graine, bonnes, maintenant })
    } else if (message.type === 'ping') {
      ws.send(JSON.stringify({ type: 'pong' }))
    }
  }

  async webSocketClose(ws) {
    const { id } = ws.deserializeAttachment() ?? {}
    ws.close(1000)
    if (!id) return
    // Une autre connexion du même joueur reste ouverte (reconnexion croisée) :
    // il n'est pas parti.
    const autres = this.ctx.getWebSockets(id).filter((s) => s !== ws && s.readyState === WebSocket.OPEN)
    if (autres.length) return
    await this.traiter({ type: 'partir', id, maintenant: Date.now() })
  }

  async webSocketError(ws) {
    await this.webSocketClose(ws)
  }

  async alarm() {
    await this.traiter({ type: 'horloge', maintenant: Date.now() })
  }

  async traiter(evenement) {
    const etat = await this.ctx.storage.get('etat')
    if (!etat) return
    const { etat: suivant, sorties } = reduire(etat, evenement)
    if (suivant !== etat) await this.ctx.storage.put('etat', suivant)
    for (const sortie of sorties) {
      if (sortie.a === 'tous') this.diffuser(sortie.message)
      else if (sortie.a === 'alarme') await this.ctx.storage.setAlarm(sortie.quand)
      else if (sortie.a === 'registre') await this.inscrireAuClassement(sortie.joueurs, evenement.maintenant)
      else if (sortie.a === 'menage') await this.menage()
      else this.envoyerA(sortie.a, sortie.message)
    }
  }

  diffuser(message) {
    const texte = JSON.stringify(message)
    for (const ws of this.ctx.getWebSockets()) {
      if (ws.readyState === WebSocket.OPEN) ws.send(texte)
    }
  }

  envoyerA(id, message) {
    const texte = JSON.stringify(message)
    for (const ws of this.ctx.getWebSockets(id)) {
      if (ws.readyState === WebSocket.OPEN) ws.send(texte)
    }
  }

  async inscrireAuClassement(joueurs, maintenant) {
    const cle = semaineIso(jourUtc(maintenant))
    try {
      await this.env.REGISTRE.getByName(`semaine:${cle}`).inscrireDuel(joueurs, maintenant)
    } catch (e) {
      console.error('classement des duels indisponible', e)
    }
  }

  async menage() {
    for (const ws of this.ctx.getWebSockets()) {
      try {
        ws.close(1000, 'salle fermée')
      } catch {
        /* déjà fermé */
      }
    }
    await this.ctx.storage.deleteAlarm()
    await this.ctx.storage.deleteAll()
  }
}
