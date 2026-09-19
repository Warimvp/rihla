import { describe, expect, it } from 'vitest'
import { LANGUES } from '../data/langues.js'
import { construireBarid } from './barid.js'
import {
  ALPHABET_CODE,
  COMPTE_A_REBOURS,
  DELAI_ABANDON,
  LIMITE_PARTIE,
  MENAGE,
  POINTS,
  codeValide,
  etatClientInitial,
  etatInitial,
  genererCode,
  normaliserCode,
  reduire,
  reduireClient,
  semaineIso,
} from './salle.js'

const bonnesDe = (langue, graine) => construireBarid(LANGUES, langue, graine).map((q) => q.mot.id)
const T0 = 1_700_000_000_000

const salleVide = (graine = 4242) => etatInitial({ langue: 'tr', graine, bonnes: bonnesDe('tr', graine), maintenant: T0 })

// Enchaîne des événements et rassemble les sorties.
function jouer(etat, evenements) {
  const sorties = []
  for (const e of evenements) {
    const r = reduire(etat, e)
    etat = r.etat
    sorties.push(...r.sorties)
  }
  return { etat, sorties }
}

const messages = (sorties, type, a = null) =>
  sorties.filter((s) => s.message?.type === type && (a === null || s.a === a)).map((s) => s.message)

const entree = (id, nom, maintenant = T0) => ({ type: 'entrer', id, nom, maintenant })

// Répond aux 10 questions : juste pour `justes` d'entre elles, faux ensuite.
const repondre = (etat, id, justes, depuis) =>
  etat.bonnes.map((bonne, i) => ({
    type: 'repondre',
    id,
    i,
    optionId: i < justes ? bonne : `pas-${bonne}`,
    maintenant: depuis + (i + 1) * 1000,
  }))

describe('codes de salle', () => {
  it('tire cinq caractères sans I, O, 0 ni 1', () => {
    const code = genererCode(() => 0.5)
    expect(code).toHaveLength(5)
    expect(codeValide(code)).toBe(true)
    expect(ALPHABET_CODE).not.toMatch(/[IO01]/)
    expect(codeValide('ABC0D')).toBe(false)
    expect(codeValide('ABCD')).toBe(false)
  })

  it('retrouve un code tapé en minuscules, avec des espaces, ou dans un lien', () => {
    expect(normaliserCode(' ab c2 3 ')).toBe('ABC23')
    expect(normaliserCode('https://warimvp.github.io/rihla/#salle=XYZ78')).toBe('XYZ78')
    expect(normaliserCode('#salle=xyz78')).toBe('XYZ78')
    expect(normaliserCode('bonjour')).toBeNull()
    expect(normaliserCode('')).toBeNull()
  })

  it('numérote les semaines ISO (le jeudi décide de l’année)', () => {
    expect(semaineIso('2026-09-19')).toBe('2026-W38')
    expect(semaineIso('2026-01-01')).toBe('2026-W01')
    expect(semaineIso('2027-01-01')).toBe('2026-W53')
    expect(semaineIso('2024-12-30')).toBe('2025-W01')
  })
})

describe('une salle de duel', () => {
  it('attend deux joueurs, puis lance la partie avec compte à rebours et alarme', () => {
    const { etat, sorties } = jouer(salleVide(), [entree('amine', 'Amine'), entree('sara', 'Sara', T0 + 500)])
    expect(etat.phase).toBe('jeu')
    expect(etat.debut).toBe(T0 + 500 + COMPTE_A_REBOURS)
    const depart = messages(sorties, 'depart', 'tous')
    expect(depart).toHaveLength(1)
    expect(depart[0]).toMatchObject({ graine: 4242, langue: 'tr', dans: COMPTE_A_REBOURS })
    expect(depart[0].joueurs.map((j) => j.nom)).toEqual(['Amine', 'Sara'])
    expect(sorties.find((s) => s.a === 'alarme').quand).toBe(etat.debut + LIMITE_PARTIE)
    // Un troisième trouve porte close.
    const troisieme = reduire(etat, entree('nour', 'Nour', T0 + 900))
    expect(troisieme.etat).toBe(etat)
    expect(messages(troisieme.sorties, 'erreur', 'nour')[0].code).toBe('pleine')
  })

  it('note chaque réponse contre les bonnes du serveur, chronomètre, et tranche à la fin', () => {
    const debutPartie = jouer(salleVide(), [entree('amine', 'Amine'), entree('sara', 'Sara')])
    const debut = debutPartie.etat.debut
    const { etat, sorties } = jouer(debutPartie.etat, [
      ...repondre(debutPartie.etat, 'amine', 8, debut),
      ...repondre(debutPartie.etat, 'sara', 9, debut + 5000),
    ])
    expect(etat.phase).toBe('fin')
    const fin = messages(sorties, 'fin', 'tous')[0]
    const amine = fin.joueurs.find((j) => j.id === 'amine')
    const sara = fin.joueurs.find((j) => j.id === 'sara')
    expect(amine).toMatchObject({ score: 8, temps: 10, verdict: 'perdu', points: POINTS.perdu })
    expect(sara).toMatchObject({ score: 9, temps: 15, verdict: 'gagne', points: POINTS.gagne })
    expect(sorties.find((s) => s.a === 'registre').joueurs).toEqual(fin.joueurs)
    // Les scores intermédiaires ont été diffusés à chaque réponse.
    expect(messages(sorties, 'etat', 'tous')).toHaveLength(20)
  })

  it('à score égal, le plus rapide gagne ; à temps égal, égalité', () => {
    const d = jouer(salleVide(), [entree('a', 'A'), entree('b', 'B')])
    const debut = d.etat.debut
    const rapide = jouer(d.etat, [...repondre(d.etat, 'a', 7, debut), ...repondre(d.etat, 'b', 7, debut + 3000)])
    const finRapide = messages(rapide.sorties, 'fin')[0]
    expect(finRapide.joueurs.find((j) => j.id === 'a').verdict).toBe('gagne')
    expect(finRapide.joueurs.find((j) => j.id === 'b').verdict).toBe('perdu')
    const egal = jouer(d.etat, [...repondre(d.etat, 'a', 7, debut), ...repondre(d.etat, 'b', 7, debut)])
    expect(messages(egal.sorties, 'fin')[0].joueurs.every((j) => j.verdict === 'egal' && j.points === POINTS.egal)).toBe(true)
  })

  it('refuse une réponse hors phase, hors ordre ou en double, sans toucher l’état', () => {
    const attente = reduire(salleVide(), entree('amine', 'Amine')).etat
    const tropTot = reduire(attente, { type: 'repondre', id: 'amine', i: 0, optionId: 'x', maintenant: T0 })
    expect(tropTot.etat).toBe(attente)
    expect(messages(tropTot.sorties, 'erreur', 'amine')[0].code).toBe('phase')

    const d = jouer(salleVide(), [entree('amine', 'Amine'), entree('sara', 'Sara')])
    const bonne = d.etat.bonnes[0]
    const une = reduire(d.etat, { type: 'repondre', id: 'amine', i: 0, optionId: bonne, maintenant: d.etat.debut + 100 })
    expect(une.etat.joueurs.amine.score).toBe(1)
    const rejouee = reduire(une.etat, { type: 'repondre', id: 'amine', i: 0, optionId: bonne, maintenant: d.etat.debut + 200 })
    expect(rejouee.etat).toBe(une.etat)
    expect(messages(rejouee.sorties, 'erreur', 'amine')[0].code).toBe('index')
    const sautee = reduire(une.etat, { type: 'repondre', id: 'amine', i: 5, optionId: bonne, maintenant: d.etat.debut + 200 })
    expect(sautee.etat).toBe(une.etat)
  })

  it('un joueur qui part pendant la partie a un délai pour revenir, puis perd par forfait — même avec plus de points', () => {
    const d = jouer(salleVide(), [entree('amine', 'Amine'), entree('sara', 'Sara')])
    const debut = d.etat.debut
    const avance = jouer(d.etat, [...repondre(d.etat, 'amine', 10, debut)])
    // Amine a fini (10/10), Sara se déconnecte après une réponse.
    const partie = jouer(avance.etat, [
      { type: 'repondre', id: 'sara', i: 0, optionId: avance.etat.bonnes[0], maintenant: debut + 20000 },
      { type: 'partir', id: 'sara', maintenant: debut + 21000 },
    ])
    expect(partie.etat.phase).toBe('jeu')
    expect(partie.etat.joueurs.sara.present).toBe(false)
    expect(partie.sorties.find((s) => s.a === 'alarme').quand).toBe(debut + 21000 + DELAI_ABANDON)
    // Revenue à temps : la partie continue là où elle en était.
    const revenue = reduire(partie.etat, entree('sara', 'Sara', debut + 25000))
    expect(revenue.etat.joueurs.sara.present).toBe(true)
    expect(messages(revenue.sorties, 'reprise', 'sara')[0]).toMatchObject({ graine: 4242, i: 1, score: 1 })
    // Pas revenue : l'horloge tranche, Amine gagne par forfait — et Sara aurait perdu
    // même avec un meilleur score, puisqu'elle n'est plus là.
    const forfait = reduire(partie.etat, { type: 'horloge', maintenant: debut + 21000 + DELAI_ABANDON })
    const fin = messages(forfait.sorties, 'fin')[0]
    expect(fin.joueurs.find((j) => j.id === 'amine').verdict).toBe('gagne')
    expect(fin.joueurs.find((j) => j.id === 'sara')).toMatchObject({ verdict: 'perdu', temps: LIMITE_PARTIE / 1000 })
    const mieuxMaisParti = jouer(d.etat, [
      ...repondre(d.etat, 'sara', 10, debut),
      { type: 'repondre', id: 'amine', i: 0, optionId: 'x', maintenant: debut + 20000 },
      { type: 'partir', id: 'sara', maintenant: debut + 21000 },
      { type: 'horloge', maintenant: debut + 21000 + DELAI_ABANDON },
    ])
    expect(messages(mieuxMaisParti.sorties, 'fin')[0].joueurs.find((j) => j.id === 'sara').verdict).toBe('perdu')
  })

  it('l’horloge clôt une partie trop longue, et ne fait rien avant', () => {
    const d = jouer(salleVide(), [entree('amine', 'Amine'), entree('sara', 'Sara')])
    const tot = reduire(d.etat, { type: 'horloge', maintenant: d.etat.debut + 1000 })
    expect(tot.etat.phase).toBe('jeu')
    expect(tot.sorties).toEqual([{ a: 'alarme', quand: d.etat.debut + LIMITE_PARTIE }])
    const tard = reduire(d.etat, { type: 'horloge', maintenant: d.etat.debut + LIMITE_PARTIE })
    expect(tard.etat.phase).toBe('fin')
    expect(messages(tard.sorties, 'fin')[0].joueurs.every((j) => j.verdict === 'egal')).toBe(true)
  })

  it('en attente, partir libère la place ; une salle oubliée finit par le ménage', () => {
    const seul = reduire(salleVide(), entree('amine', 'Amine')).etat
    const parti = reduire(seul, { type: 'partir', id: 'amine', maintenant: T0 + 10 })
    expect(parti.etat.ordre).toEqual([])
    expect(reduire(parti.etat, { type: 'horloge', maintenant: T0 + 10 + MENAGE }).sorties).toEqual([{ a: 'menage' }])
    expect(reduire(parti.etat, { type: 'horloge', maintenant: T0 + 20 }).sorties).toEqual([{ a: 'alarme', quand: T0 + 10 + MENAGE }])
  })

  it('la revanche repart sur une nouvelle graine quand les deux l’ont demandée', () => {
    const d = jouer(salleVide(), [entree('amine', 'Amine'), entree('sara', 'Sara')])
    const debut = d.etat.debut
    const finie = jouer(d.etat, [...repondre(d.etat, 'amine', 5, debut), ...repondre(d.etat, 'sara', 6, debut)])
    const nouvelles = bonnesDe('tr', 777)
    const une = reduire(finie.etat, { type: 'revanche', id: 'amine', graine: 777, bonnes: nouvelles, maintenant: debut + 60000 })
    expect(une.etat.phase).toBe('fin')
    expect(messages(une.sorties, 'joueurs')[0].joueurs.find((j) => j.id === 'amine').revanche).toBe(true)
    const deux = reduire(une.etat, { type: 'revanche', id: 'sara', graine: 777, bonnes: nouvelles, maintenant: debut + 61000 })
    expect(deux.etat.phase).toBe('jeu')
    expect(deux.etat.graine).toBe(777)
    expect(deux.etat.bonnes).toEqual(nouvelles)
    expect(deux.etat.joueurs.amine).toMatchObject({ score: 0, i: 0, fini: false, revanche: false })
    expect(messages(deux.sorties, 'depart')[0].graine).toBe(777)
    // Pas de revanche pendant la partie.
    expect(messages(reduire(deux.etat, { type: 'revanche', id: 'amine', graine: 1, bonnes: [], maintenant: debut + 62000 }).sorties, 'erreur')[0].code).toBe('phase')
  })
})

describe('le miroir côté client', () => {
  it('suit les messages du serveur jusqu’au bilan', () => {
    let etat = etatClientInitial()
    etat = reduireClient(etat, { type: 'salle', phase: 'attente', langue: 'tr', joueurs: [{ id: 'a', nom: 'A' }] })
    expect(etat.phase).toBe('attente')
    etat = reduireClient(etat, { type: 'depart', graine: 5, langue: 'tr', dans: 3000, joueurs: [] })
    expect(etat).toMatchObject({ phase: 'compte', graine: 5, dans: 3000 })
    etat = reduireClient(etat, { type: 'etat', joueurs: [{ id: 'a', score: 1 }] })
    expect(etat.joueurs[0].score).toBe(1)
    etat = reduireClient(etat, { type: 'fin', joueurs: [{ id: 'a', verdict: 'gagne' }] })
    expect(etat.phase).toBe('fin')
    expect(etat.bilan[0].verdict).toBe('gagne')
    expect(reduireClient(etat, { type: 'inconnu' })).toBe(etat)
    expect(reduireClient(etat, { type: 'erreur', code: 'pleine' }).erreur).toBe('pleine')
  })

  it('une reprise rend la question en cours', () => {
    const etat = reduireClient(etatClientInitial(), { type: 'reprise', graine: 9, langue: 'es', debut: 1, i: 4, score: 3 })
    expect(etat).toMatchObject({ phase: 'jeu', graine: 9, reprise: { i: 4, score: 3 } })
  })
})
