// @vitest-environment jsdom
//
// Le filtre des pseudonymes (src/lib/pseudo.js) vu depuis les écrans : ce qui
// est TAPÉ reste dans le champ, ce qui SORT (serveur, lettre du Barid) et ce
// qui s'AFFICHE (classement, adversaire, lettre reçue) est filtré. Ce sont les
// seuls tests qui verraient un nom refusé réapparaître par un chemin oublié.
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LANGUES } from '../data/langues.js'
import { getDictionary } from '../i18n.js'
import { decoderLettre, encoderLettre, extraireCodes } from '../lib/barid.js'
import { progresInitial } from '../lib/progression.js'
import { mulberry32 } from '../lib/quiz.js'
import { identite } from '../lib/voyageur.js'
import { Barid } from './Barid.jsx'
import { Classement } from './Classement.jsx'
import { Course } from './Course.jsx'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const fr = getDictionary('fr')
const ar = getDictionary('ar')
const IDS = LANGUES.map((l) => l.id)

const montes = []
function monter(element) {
  const conteneur = document.createElement('div')
  document.body.appendChild(conteneur)
  const racine = createRoot(conteneur)
  act(() => racine.render(element))
  montes.push({ conteneur, racine })
  return conteneur
}
const clic = (element) => {
  if (!element) throw new Error('rien à cliquer')
  act(() => element.click())
}
const bouton = (conteneur, texte) => [...conteneur.querySelectorAll('button')].find((b) => b.textContent.includes(texte))
const primaire = (conteneur) => conteneur.querySelector('.bouton--primaire')
const attendreMicro = () => act(async () => {})
const champNom = (vue) => vue.querySelector('input[autocomplete="nickname"]')
const saisir = (champ, valeur) =>
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(champ, valeur)
    champ.dispatchEvent(new Event('input', { bubbles: true }))
  })
const patienter = (ms) => act(() => vi.advanceTimersByTime(ms))

const MOI = { id: 'amine000amine000', secret: 'secret-amine-secret-amine', nom: 'Amine' }
const SARA = { id: 'sara0000sara0000', nom: 'Sara' }

beforeEach(() => {
  vi.spyOn(Math, 'random').mockImplementation(mulberry32(7))
  localStorage.setItem('rihla.serveur', 'http://localhost:8787')
  localStorage.setItem('rihla.voyageur', JSON.stringify(MOI))
  localStorage.setItem('rihla.enligne', 'oui')
})

afterEach(() => {
  for (const { racine, conteneur } of montes.splice(0)) {
    act(() => racine.unmount())
    conteneur.remove()
  }
  vi.useRealTimers()
  vi.restoreAllMocks()
  localStorage.clear()
})

const fauxTransport = () => {
  const salles = []
  const halls = []
  const connexion = (liste) => (code, voyageur, gestionnaires) => {
    const c = { code, voyageur, gestionnaires, envoyes: [], fermee: false, envoyer: (m) => c.envoyes.push(m), fermer: () => (c.fermee = true) }
    liste.push(c)
    return c
  }
  return {
    salles,
    halls,
    transport: {
      creerSalle: vi.fn(async () => ({ code: 'ABC23' })),
      ouvrirSalle: vi.fn(connexion(salles)),
      chercherAdversaire: vi.fn((langue, voyageur, gestionnaires) => connexion(halls)(langue, voyageur, gestionnaires)),
    },
  }
}

const course = (transport, t = fr, locale = 'fr') => (
  <Course t={t} locale={locale} source="fr" langueId="tr" surTerminer={() => ({ xpGagne: 0, verdict: 'perdu' })} surClassement={() => {}} surQuitter={() => {}} transport={transport} />
)

describe('le champ « Ton nom de voyageur »', () => {
  it('garde ce que le voyageur tape — espaces compris —, prévient après une pause, et n’envoie jamais le nom refusé', () => {
    vi.useFakeTimers()
    const { transport, halls } = fauxTransport()
    const vue = monter(course(transport))
    const champ = champNom(vue)
    expect(champ.value).toBe('Amine')

    // Deux mots : l'espace ne s'avale pas (le champ rendait autrefois le nom
    // « nettoyé », trim compris, et « Ali Baba » devenait « AliBaba »).
    saisir(champ, 'Ali ')
    expect(champ.value).toBe('Ali ')
    saisir(champ, 'Ali Baba')
    expect(champ.value).toBe('Ali Baba')
    patienter(1000)
    expect(vue.textContent).not.toContain(fr.barid.nomRefuse)

    // Un nom refusé reste dans le champ (rien ne s'efface en pleine frappe),
    // le message n'arrive qu'après une pause, et disparaît dès qu'on reprend.
    saisir(champ, 'zebi')
    expect(champ.value).toBe('zebi')
    patienter(400)
    expect(vue.textContent).not.toContain(fr.barid.nomRefuse)
    patienter(400)
    expect(vue.textContent).toContain(fr.barid.nomRefuse)
    saisir(champ, 'zebib')
    expect(vue.textContent).not.toContain(fr.barid.nomRefuse)
    saisir(champ, 'zebi')
    patienter(800)
    expect(vue.textContent).toContain(fr.barid.nomRefuse)

    // Ce qui part au serveur est vide : l'adversaire verra « Un voyageur ».
    clic(bouton(vue, fr.course.hasard))
    expect(halls[0].voyageur).toEqual({ id: MOI.id, nom: '' })
    expect(identite().nom).toBe('')
  })

  it('un nom qui passe part tel quel', () => {
    const { transport, halls } = fauxTransport()
    const vue = monter(course(transport))
    saisir(champNom(vue), 'Ali Baba')
    clic(bouton(vue, fr.course.hasard))
    expect(halls[0].voyageur).toEqual({ id: MOI.id, nom: 'Ali Baba' })
  })

  it('le message de refus existe en français ET en arabe, et s’affiche dans la langue de l’interface', () => {
    expect(fr.barid.nomRefuse).toMatch(/\S/)
    expect(ar.barid.nomRefuse).toMatch(/[؀-ۿ]/)
    expect(ar.barid.nomRefuse).not.toBe(fr.barid.nomRefuse)
    vi.useFakeTimers()
    const { transport } = fauxTransport()
    const vue = monter(course(transport, ar, 'ar'))
    saisir(champNom(vue), '0612345678')
    patienter(800)
    expect(vue.textContent).toContain(ar.barid.nomRefuse)
    expect(vue.textContent).not.toContain(fr.barid.nomRefuse)
    // Le message est annoncé (role=status, toujours monté) et lisible : on le
    // relit tel qu'il s'affiche.
    const statut = [...vue.querySelectorAll('[role="status"]')].find((p) => p.textContent === ar.barid.nomRefuse)
    expect(statut.className).toBe('texte-2')
  })
})

describe('la Course : le nom de l’adversaire', () => {
  it.each([
    ['une insulte', 'connard'],
    ['un numéro de téléphone', '06 12 34 56 78'],
    ['un lien', 'insta.me/sara'],
  ])('ne montre jamais %s — dans la salle, au compte à rebours, au bilan, ni dans le progrès', async (_, nomRefuse) => {
    vi.useFakeTimers()
    const { transport, salles } = fauxTransport()
    const surTerminer = vi.fn(() => ({ xpGagne: 0, verdict: 'perdu' }))
    const vue = monter(
      <Course t={fr} locale="fr" source="fr" langueId="tr" surTerminer={surTerminer} surClassement={() => {}} surQuitter={() => {}} transport={transport} />
    )
    clic(bouton(vue, fr.course.creer))
    await attendreMicro()
    const serveur = (m) => act(() => salles[0].gestionnaires.surMessage(m))
    const moi = (extra) => ({ id: MOI.id, nom: 'Amine', score: 0, i: 0, fini: false, revanche: false, present: true, ...extra })
    const autre = (extra) => ({ id: SARA.id, nom: nomRefuse, score: 0, i: 0, fini: false, revanche: false, present: true, ...extra })

    // La salle d'attente : mon nom, et « Un voyageur » à la place du sien.
    serveur({ type: 'salle', phase: 'attente', langue: 'tr', joueurs: [moi(), autre()] })
    expect(vue.textContent).toContain('Amine')
    expect(vue.textContent).toContain(fr.barid.anonyme)
    expect(vue.textContent).not.toContain(nomRefuse)

    // Le compte à rebours, puis la partie.
    serveur({ type: 'depart', graine: 4242, langue: 'tr', debut: 0, dans: 3000, joueurs: [moi(), autre()] })
    expect(vue.textContent).toContain(fr.course.adversaire)
    expect(vue.textContent).not.toContain(nomRefuse)
    patienter(3000)
    serveur({ type: 'etat', joueurs: [moi({ i: 1 }), autre({ i: 4 })] })
    expect(vue.textContent).toContain(fr.course.adversaire)
    expect(vue.textContent).not.toContain(nomRefuse)

    // Le bilan : l'écran ET ce que l'app inscrit dans le progrès du Barid.
    serveur({
      type: 'fin',
      graine: 4242,
      joueurs: [
        { id: MOI.id, nom: 'Amine', score: 8, temps: 20, verdict: 'perdu', points: 1, present: true },
        { id: SARA.id, nom: nomRefuse, score: 9, temps: 18, verdict: 'gagne', points: 3, present: true },
      ],
    })
    expect(surTerminer).toHaveBeenCalledWith(expect.objectContaining({ adversaire: { n: '', s: 9, t: 18 } }))
    expect(vue.textContent).toContain(fr.barid.anonyme)
    expect(vue.textContent).not.toContain(nomRefuse)
  })

  it('montre en revanche le nom d’un adversaire acceptable (le filtre ne vide pas tout)', async () => {
    const { transport, salles } = fauxTransport()
    const vue = monter(course(transport))
    clic(bouton(vue, fr.course.creer))
    await attendreMicro()
    act(() =>
      salles[0].gestionnaires.surMessage({
        type: 'salle',
        phase: 'attente',
        langue: 'tr',
        joueurs: [
          { id: MOI.id, nom: 'Amine', score: 0, i: 0, fini: false, revanche: false, present: true },
          { ...SARA, score: 0, i: 0, fini: false, revanche: false, present: true },
        ],
      })
    )
    expect(vue.textContent).toContain('Amine')
    expect(vue.textContent).toContain('Sara')
    expect(vue.textContent).not.toContain(fr.barid.anonyme)
  })
})

describe('les classements : les noms inscrits', () => {
  const lignes = [
    { rang: 1, id: 'aaaa1111', nom: 'فاطمة', score: 9, temps: 40 },
    { rang: 2, id: 'bbbb2222', nom: 'connard', score: 8, temps: 41 },
    { rang: 3, id: 'cccc3333', nom: 'Sara', score: 7, temps: 50 },
    { rang: 4, id: 'dddd4444', nom: '0612345678', score: 6, temps: 60 },
    { rang: 5, id: 'eeee5555', nom: 'ntm', score: 5, temps: 70 },
  ]
  const transport = () => ({
    lireClassement: vi.fn(async () => ({ lignes, total: 5, moi: null })),
    envoyerScore: vi.fn(),
  })

  it('ne montre pas une ligne refusée — un serveur pas encore à jour ou une liste qui a grandi — et dit « Un voyageur »', async () => {
    const vue = monter(<Classement t={fr} progres={progresInitial()} surQuitter={() => {}} transport={transport()} />)
    await attendreMicro()
    for (const refuse of ['connard', '0612345678', 'ntm']) expect(vue.textContent).not.toContain(refuse)
    expect(vue.textContent.split(fr.classement.anonyme).length - 1).toBe(3)
    // Les lignes honnêtes restent, avec leur rang et leur score.
    expect(vue.textContent).toContain('فاطمة')
    expect(vue.textContent).toContain('Sara')
    expect(vue.textContent).toContain(fr.classement.scoreJour(9, 10, 40))
  })

  it('dit « مسافر » en arabe', async () => {
    const vue = monter(<Classement t={ar} progres={progresInitial()} surQuitter={() => {}} transport={transport()} />)
    await attendreMicro()
    expect(vue.textContent).not.toContain('connard')
    expect(vue.textContent.split(ar.classement.anonyme).length - 1).toBe(3)
  })

  it('ma propre ligne dit « Un voyageur » quand mon nom est refusé', async () => {
    localStorage.setItem('rihla.voyageur', JSON.stringify({ ...MOI, nom: 'zebi' }))
    const t = {
      lireClassement: vi.fn(async () => ({ lignes: [{ rang: 1, id: 'aaaa1111', nom: 'Sara', score: 9, temps: 40 }], total: 40, moi: { rang: 33, score: 4, temps: 90 } })),
      envoyerScore: vi.fn(),
    }
    const vue = monter(<Classement t={fr} progres={progresInitial()} surQuitter={() => {}} transport={t} />)
    await attendreMicro()
    expect(vue.textContent).not.toContain('zebi')
    expect(vue.textContent).toContain(`${fr.classement.anonyme}· ${fr.classement.toi}`)
    expect(vue.textContent).toContain('Sara')
  })
})

describe('le Barid : les noms', () => {
  const graine = 4242
  const barid = (props) => (
    <Barid
      t={fr}
      locale="fr"
      source="fr"
      progres={progresInitial()}
      surTerminer={props.surTerminer ?? (() => ({ xpGagne: 0, verdict: null }))}
      surReponseRecue={props.surReponseRecue ?? (() => {})}
      surQuitter={() => {}}
      {...props}
    />
  )

  it.each([
    ['Amine', 'Amine'],
    ['connard', ''],
    ['Amine 0612345678', ''],
  ])('la lettre qui part porte « %s » → « %s »', async (tape, attendu) => {
    const vue = monter(barid({}))
    saisir(champNom(vue), tape)
    clic(bouton(vue, fr.barid.lancer))
    for (let i = 0; i < 10; i++) {
      clic(vue.querySelector('button.option'))
      clic(primaire(vue))
    }
    clic(bouton(vue, fr.barid.envoyer))
    await attendreMicro()
    // Sans partage natif ni presse-papiers (jsdom), le texte du message s'affiche.
    const message = vue.querySelector('textarea[readonly]').value
    const lettre = decoderLettre(extraireCodes(message)[0], IDS)
    expect(lettre.ok).toBe(true)
    expect(lettre.lettre.n).toBe(attendu)
    expect(message).toContain(`Défi Rihla · ${attendu || fr.barid.anonyme} a fait`)
    if (!attendu) expect(message).not.toContain(tape.split(' ')[0])
  })

  it('une lettre reçue d’un nom refusé s’ouvre sous « Un voyageur », et ce nom ne s’inscrit nulle part', () => {
    const lettre = decoderLettre(encoderLettre({ n: 'connard', l: 'tr', g: graine, s: 8, t: 42 }), IDS).lettre
    // Lisible (l'empreinte porte sur le nom nettoyé) : c'est l'affichage qu'on filtre.
    expect(lettre.n).toBe('connard')
    const surTerminer = vi.fn(() => ({ xpGagne: 0, verdict: 'gagne' }))
    const vue = monter(barid({ lettre, surTerminer }))
    expect(vue.textContent).toContain(fr.barid.defiDe(fr.barid.anonyme))
    expect(vue.textContent).not.toContain('connard')
    clic(bouton(vue, fr.barid.releve))
    for (let i = 0; i < 10; i++) {
      clic(vue.querySelector('button.option'))
      clic(primaire(vue))
    }
    expect(surTerminer).toHaveBeenCalledWith(expect.objectContaining({ adversaire: { n: '', s: 8, t: 42 } }))
    expect(vue.textContent).toContain(`${fr.barid.anonyme} · ${fr.barid.resultat(8, 10, 42)}`)
    expect(vue.textContent).not.toContain('connard')
  })

  it('une réponse reçue d’un nom refusé s’affiche et s’inscrit sans ce nom', () => {
    const lettre = decoderLettre(encoderLettre({ n: '+212 6 12 34 56 78', re: { l: 'tr', g: graine, s: 9, t: 38, s0: 7, t0: 51 } }), IDS).lettre
    const surReponseRecue = vi.fn()
    const vue = monter(barid({ lettre, surReponseRecue }))
    expect(vue.textContent).toContain(fr.barid.reponseDe(fr.barid.anonyme))
    expect(vue.textContent).not.toContain('212')
    expect(surReponseRecue).toHaveBeenCalledWith(lettre.re, '')
  })

  it('une lettre reçue d’un nom honnête garde son nom', () => {
    const lettre = decoderLettre(encoderLettre({ n: 'فاطمة', l: 'tr', g: graine, s: 8, t: 42 }), IDS).lettre
    const vue = monter(barid({ lettre }))
    expect(vue.textContent).toContain(fr.barid.defiDe('فاطمة'))
  })
})
