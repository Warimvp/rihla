// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  CLE_ENLIGNE,
  CLE_SERVEUR,
  chercherAdversaire,
  creerSalle,
  enLigneActif,
  enLigneDisponible,
  envoyerScore,
  lienSalle,
  lireClassement,
  ouvrirSalle,
  reglerEnLigne,
  reglerServeur,
  urlServeur,
} from './enligne.js'

// Un faux WebSocket : on note l'URL et ce qui est envoyé, on injecte ce qui arrive.
class FauxWebSocket {
  static instances = []
  constructor(url) {
    this.url = url
    this.readyState = 1
    this.envoyes = []
    FauxWebSocket.instances.push(this)
  }
  send(texte) {
    this.envoyes.push(JSON.parse(texte))
  }
  close(code) {
    this.readyState = 3
    this.onclose?.({ code })
  }
  recevoir(message) {
    this.onmessage?.({ data: JSON.stringify(message) })
  }
}

afterEach(() => {
  localStorage.clear()
  FauxWebSocket.instances = []
  vi.restoreAllMocks()
})

describe('l’adresse du serveur', () => {
  it('sans adresse, le jeu en ligne n’existe pas — même activé', () => {
    expect(urlServeur()).toBe('')
    expect(enLigneDisponible()).toBe(false)
    reglerEnLigne(true)
    expect(enLigneActif()).toBe(false)
  })

  it('accepte une adresse locale (sans barre finale), rejette le reste', () => {
    reglerServeur('http://localhost:8787/')
    expect(localStorage.getItem(CLE_SERVEUR)).toBe('http://localhost:8787')
    expect(enLigneDisponible()).toBe(true)
    reglerServeur('pas une adresse')
    expect(localStorage.getItem(CLE_SERVEUR)).toBeNull()
    expect(enLigneDisponible()).toBe(false)
  })

  it('n’envoie rien tant que le voyageur n’a pas activé le jeu en ligne', () => {
    reglerServeur('https://serveur.exemple')
    expect(enLigneActif()).toBe(false)
    reglerEnLigne(true)
    expect(localStorage.getItem(CLE_ENLIGNE)).toBe('oui')
    expect(enLigneActif()).toBe(true)
    reglerEnLigne(false)
    expect(enLigneActif()).toBe(false)
  })
})

describe('les appels', () => {
  const voyageur = { id: 'abcd1234abcd1234', secret: 's3cr3t-s3cr3t-s3cr3t', nom: 'Amine' }
  const reponse = (corps, ok = true, status = 200) => ({ ok, status, json: async () => corps })

  it('crée une salle, envoie un score, lit un classement — en JSON, à l’adresse réglée', async () => {
    reglerServeur('https://serveur.exemple')
    const fetchFn = vi.fn().mockResolvedValue(reponse({ code: 'ABC23' }))
    expect(await creerSalle('tr', { fetchFn })).toEqual({ code: 'ABC23' })
    expect(fetchFn.mock.calls[0][0]).toBe('https://serveur.exemple/salles')
    expect(JSON.parse(fetchFn.mock.calls[0][1].body)).toEqual({ langue: 'tr' })

    fetchFn.mockResolvedValue(reponse({ ok: true, rang: 3, total: 10 }))
    await envoyerScore(voyageur, { type: 'jour', cle: '2026-09-19', score: 8, temps: 42 }, { fetchFn })
    const corps = JSON.parse(fetchFn.mock.calls[1][1].body)
    expect(corps).toMatchObject({ id: voyageur.id, secret: voyageur.secret, nom: 'Amine', type: 'jour', cle: '2026-09-19', score: 8, temps: 42 })

    fetchFn.mockResolvedValue(reponse({ lignes: [], total: 0, moi: null }))
    await lireClassement('semaine', '2026-W38', voyageur.id, { fetchFn })
    expect(fetchFn.mock.calls[2][0]).toBe(`https://serveur.exemple/classement/semaine/2026-W38?id=${voyageur.id}`)
  })

  it('transforme une erreur HTTP en exception lisible', async () => {
    reglerServeur('https://serveur.exemple')
    const fetchFn = vi.fn().mockResolvedValue(reponse({ erreur: 'identite' }, false, 403))
    await expect(envoyerScore(voyageur, { type: 'jour', cle: '2026-09-19', score: 8, temps: 42 }, { fetchFn })).rejects.toThrow('identite')
  })

  it('ouvre les WebSockets de salle et de hall avec l’identité, en ws://, et relaie les messages', () => {
    reglerServeur('http://localhost:8787')
    const recus = []
    const salle = ouvrirSalle('ABC23', voyageur, { surMessage: (m) => recus.push(m) }, FauxWebSocket)
    const ws = FauxWebSocket.instances[0]
    expect(ws.url).toBe('ws://localhost:8787/salles/ABC23?id=abcd1234abcd1234&nom=Amine')
    salle.envoyer({ type: 'repondre', i: 0, optionId: 'merci' })
    expect(ws.envoyes).toEqual([{ type: 'repondre', i: 0, optionId: 'merci' }])
    ws.recevoir({ type: 'depart', graine: 1 })
    ws.onmessage({ data: 'pas du json' })
    expect(recus).toEqual([{ type: 'depart', graine: 1 }])

    const fermetures = []
    chercherAdversaire('*', voyageur, { surMessage: () => {}, surFermeture: (f) => fermetures.push(f) }, FauxWebSocket)
    const hall = FauxWebSocket.instances[1]
    expect(hall.url).toBe('ws://localhost:8787/hall?id=abcd1234abcd1234&nom=Amine&langue=*')
    hall.close(1000)
    expect(fermetures).toEqual([{ code: 1000, voulu: false }])
  })

  it('le lien d’une salle porte son code', () => {
    expect(lienSalle('ABC23')).toBe('https://warimvp.github.io/rihla/#salle=ABC23')
  })
})
