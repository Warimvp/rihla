// La salle de duel en direct — la règle du jeu, PURE, partagée par l'app et
// par le serveur (serveur/src/salle.js l'importe telle quelle). Le Durable
// Object ne fait que stocker l'état, appliquer `reduire` et distribuer les
// sorties ; la règle se teste ici, sans Cloudflare.
//
// Deux joueurs, une graine, les mêmes 10 questions (construireBarid) : le
// serveur connaît les bonnes réponses (`bonnes`, un id de concept par
// question) et chronomètre lui-même — un client ne peut ni retoucher son
// score ni son temps. Le contenu (langues.js) n'entre jamais ici : le
// réducteur reçoit `bonnes` toutes faites.
import { verdict } from './barid.js'

export const NB_JOUEURS = 2
export const COMPTE_A_REBOURS = 3000 // ms entre « les deux sont là » et la 1re question
export const LIMITE_PARTIE = 10 * 25 * 1000 // au-delà, la partie est close d'office
export const DELAI_ABANDON = 15 * 1000 // déconnecté pendant la partie : autant de temps pour revenir
export const MENAGE = 60 * 60 * 1000 // une salle inactive est effacée au bout d'une heure
export const POINTS = { gagne: 3, egal: 2, perdu: 1 }

// ————— Codes de salle —————
// Ni I, O, 0 ni 1 : un code se dicte à voix haute ou se tape depuis une
// capture d'écran floue.
export const ALPHABET_CODE = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export const LONGUEUR_CODE = 5

export function genererCode(alea = Math.random, longueur = LONGUEUR_CODE) {
  let code = ''
  for (let i = 0; i < longueur; i++) code += ALPHABET_CODE[Math.floor(alea() * ALPHABET_CODE.length) % ALPHABET_CODE.length]
  return code
}

export const codeValide = (code) =>
  typeof code === 'string' && code.length === LONGUEUR_CODE && [...code].every((c) => ALPHABET_CODE.includes(c))

// Un code tapé, collé ou reçu dans un lien (`…#salle=ABC23`) : on garde les
// seuls caractères de l'alphabet, en majuscules.
export function normaliserCode(texte) {
  const brut = String(texte ?? '')
  const lien = brut.match(/salle=([A-Za-z0-9]+)/)
  const source = lien ? lien[1] : brut
  const code = source.toUpperCase().replace(/[^A-Z0-9]/g, '')
  return codeValide(code) ? code : null
}

// ————— Semaine ISO (clé des classements de duels) —————
export function semaineIso(jour) {
  const [y, m, d] = jour.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  // Le jeudi de la semaine décide de l'année ISO.
  const jourSemaine = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - jourSemaine)
  const debutAnnee = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  const semaine = Math.ceil(((date - debutAnnee) / 86400000 + 1) / 7)
  return `${date.getUTCFullYear()}-W${String(semaine).padStart(2, '0')}`
}

// ————— L'état d'une salle —————
export function etatInitial({ langue, graine, bonnes, maintenant }) {
  return { phase: 'attente', langue, graine, bonnes, debut: null, joueurs: {}, ordre: [], maj: maintenant }
}

const nouveauJoueur = (id, nom) => ({ id, nom, score: 0, i: 0, temps: null, fini: false, revanche: false, present: true })

const resume = (j) => ({ id: j.id, nom: j.nom, score: j.score, i: j.i, fini: j.fini, revanche: j.revanche, present: j.present })

const listeJoueurs = (etat) => etat.ordre.map((id) => resume(etat.joueurs[id]))

const aTous = (message) => ({ a: 'tous', message })
const a = (id, message) => ({ a: id, message })

const copier = (etat) => ({
  ...etat,
  joueurs: Object.fromEntries(Object.entries(etat.joueurs).map(([id, j]) => [id, { ...j }])),
  ordre: [...etat.ordre],
})

function lancer(etat, maintenant) {
  etat.phase = 'jeu'
  etat.debut = maintenant + COMPTE_A_REBOURS
  for (const j of Object.values(etat.joueurs)) Object.assign(j, { score: 0, i: 0, temps: null, fini: false, revanche: false })
  return [
    aTous({ type: 'depart', graine: etat.graine, langue: etat.langue, debut: etat.debut, dans: COMPTE_A_REBOURS, joueurs: listeJoueurs(etat) }),
    { a: 'alarme', quand: etat.debut + LIMITE_PARTIE },
  ]
}

// Le bilan : score, puis temps ; un joueur parti pendant la partie a perdu
// par forfait, quel que soit son score.
function finir(etat, maintenant) {
  etat.phase = 'fin'
  const joueurs = etat.ordre.map((id) => etat.joueurs[id])
  for (const j of joueurs) {
    if (!j.fini) {
      j.fini = true
      j.temps = LIMITE_PARTIE
    }
  }
  const bilan = joueurs.map((j) => {
    const autre = joueurs.find((x) => x.id !== j.id)
    let v = 'egal'
    if (autre) {
      if (!j.present && autre.present) v = 'perdu'
      else if (j.present && !autre.present) v = 'gagne'
      else v = verdict({ s: j.score, t: j.temps }, { s: autre.score, t: autre.temps })
    }
    return { id: j.id, nom: j.nom, score: j.score, temps: Math.round(j.temps / 1000), verdict: v, points: POINTS[v] }
  })
  etat.bilan = bilan
  const sorties = [aTous({ type: 'fin', joueurs: bilan, graine: etat.graine }), { a: 'alarme', quand: maintenant + MENAGE }]
  if (joueurs.length === NB_JOUEURS) sorties.push({ a: 'registre', joueurs: bilan })
  return sorties
}

/**
 * Applique un événement à l'état d'une salle. Retourne le nouvel état et les
 * sorties à distribuer : `{ a: 'tous' | <id joueur>, message }` pour les
 * WebSockets, `{ a: 'alarme', quand }` pour l'horloge du Durable Object,
 * `{ a: 'registre', joueurs }` pour le classement, `{ a: 'menage' }` pour
 * effacer la salle. Jamais d'exception : un événement invalide produit une
 * erreur adressée à son auteur.
 */
export function reduire(avant, evenement) {
  const etat = copier(avant)
  const { type, id, maintenant } = evenement
  etat.maj = maintenant
  const j = id ? etat.joueurs[id] : null
  const sorties = []

  if (type === 'entrer') {
    if (j) {
      // Retour après une coupure : on rend au joueur là où il en était.
      j.present = true
      j.nom = evenement.nom || j.nom
      sorties.push(a(id, { type: 'salle', phase: etat.phase, langue: etat.langue, joueurs: listeJoueurs(etat) }))
      if (etat.phase === 'jeu') {
        sorties.push(a(id, { type: 'reprise', graine: etat.graine, langue: etat.langue, debut: etat.debut, i: j.i, score: j.score }))
      }
      if (etat.phase === 'fin' && etat.bilan) sorties.push(a(id, { type: 'fin', joueurs: etat.bilan, graine: etat.graine }))
      sorties.push(aTous({ type: 'joueurs', joueurs: listeJoueurs(etat) }))
      return { etat, sorties }
    }
    if (etat.phase !== 'attente' || etat.ordre.length >= NB_JOUEURS) {
      return { etat: avant, sorties: [a(id, { type: 'erreur', code: 'pleine' })] }
    }
    etat.joueurs[id] = nouveauJoueur(id, evenement.nom || '')
    etat.ordre.push(id)
    sorties.push(a(id, { type: 'salle', phase: etat.phase, langue: etat.langue, joueurs: listeJoueurs(etat) }))
    sorties.push(aTous({ type: 'joueurs', joueurs: listeJoueurs(etat) }))
    if (etat.ordre.length === NB_JOUEURS) sorties.push(...lancer(etat, maintenant))
    return { etat, sorties }
  }

  if (type === 'repondre') {
    if (!j || etat.phase !== 'jeu') return { etat: avant, sorties: [a(id, { type: 'erreur', code: 'phase' })] }
    if (evenement.i !== j.i || j.fini) return { etat: avant, sorties: [a(id, { type: 'erreur', code: 'index' })] }
    if (evenement.optionId === etat.bonnes[j.i]) j.score += 1
    j.i += 1
    if (j.i >= etat.bonnes.length) {
      j.fini = true
      j.temps = Math.max(0, maintenant - etat.debut)
    }
    sorties.push(aTous({ type: 'etat', joueurs: listeJoueurs(etat) }))
    const presents = etat.ordre.map((x) => etat.joueurs[x]).filter((x) => x.present)
    if (presents.length && presents.every((x) => x.fini)) sorties.push(...finir(etat, maintenant))
    return { etat, sorties }
  }

  if (type === 'partir') {
    if (!j) return { etat: avant, sorties }
    if (etat.phase === 'attente') {
      delete etat.joueurs[id]
      etat.ordre = etat.ordre.filter((x) => x !== id)
      sorties.push(aTous({ type: 'joueurs', joueurs: listeJoueurs(etat) }))
      return { etat, sorties }
    }
    j.present = false
    sorties.push(aTous({ type: 'joueurs', joueurs: listeJoueurs(etat) }))
    // En pleine partie : un délai pour revenir, puis l'horloge tranche.
    if (etat.phase === 'jeu') sorties.push({ a: 'alarme', quand: maintenant + DELAI_ABANDON })
    return { etat, sorties }
  }

  if (type === 'revanche') {
    if (!j || etat.phase !== 'fin') return { etat: avant, sorties: [a(id, { type: 'erreur', code: 'phase' })] }
    j.revanche = true
    sorties.push(aTous({ type: 'joueurs', joueurs: listeJoueurs(etat) }))
    const tous = etat.ordre.map((x) => etat.joueurs[x])
    if (tous.length === NB_JOUEURS && tous.every((x) => x.present && x.revanche)) {
      etat.graine = evenement.graine
      etat.bonnes = evenement.bonnes
      delete etat.bilan
      sorties.push(...lancer(etat, maintenant))
    }
    return { etat, sorties }
  }

  if (type === 'horloge') {
    if (etat.phase === 'jeu') {
      const tous = etat.ordre.map((x) => etat.joueurs[x])
      const tempsEcoule = maintenant >= etat.debut + LIMITE_PARTIE
      const absent = tous.some((x) => !x.present)
      if (tempsEcoule || absent) sorties.push(...finir(etat, maintenant))
      else sorties.push({ a: 'alarme', quand: etat.debut + LIMITE_PARTIE })
      return { etat, sorties }
    }
    if (maintenant >= avant.maj + MENAGE) return { etat, sorties: [{ a: 'menage' }] }
    return { etat, sorties: [{ a: 'alarme', quand: avant.maj + MENAGE }] }
  }

  return { etat: avant, sorties: id ? [a(id, { type: 'erreur', code: 'inconnu' })] : [] }
}

// ————— Côté client : l'état vu d'un joueur —————
// Un réducteur miroir, minuscule, pour que l'écran n'ait qu'à afficher.
export function etatClientInitial() {
  return { phase: 'connexion', joueurs: [], graine: null, langue: null, dans: null, reprise: null, bilan: null, erreur: null }
}

export function reduireClient(etat, message) {
  switch (message.type) {
    case 'salle':
      return { ...etat, phase: message.phase === 'attente' ? 'attente' : etat.phase, langue: message.langue, joueurs: message.joueurs }
    case 'joueurs':
    case 'etat':
      return { ...etat, joueurs: message.joueurs }
    case 'depart':
      return { ...etat, phase: 'compte', graine: message.graine, langue: message.langue, dans: message.dans, joueurs: message.joueurs, bilan: null, reprise: null }
    case 'reprise':
      return { ...etat, phase: 'jeu', graine: message.graine, langue: message.langue, dans: 0, reprise: { i: message.i, score: message.score } }
    case 'fin':
      return { ...etat, phase: 'fin', bilan: message.joueurs, graine: message.graine ?? etat.graine }
    case 'erreur':
      return { ...etat, erreur: message.code }
    default:
      return etat
  }
}
