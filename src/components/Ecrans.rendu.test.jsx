// @vitest-environment jsdom
//
// Trois écrans montés pour de vrai (createRoot + act, dans jsdom), là où le
// reste de la suite ne teste que de la logique pure. Ce sont les seuls tests
// qui auraient attrapé un bouton dont le focus s'éjecte, une correction que
// personne n'annonce, un mot espagnol affiché à l'envers en interface arabe
// ou un visa qui disparaît quand la destination gagne des leçons.
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App.jsx'
import { LANGUES, nomLangue } from '../data/langues.js'
import { getDictionary, sensPour } from '../i18n.js'
import { chargerProgres, enregistrerEtape, figerAvancement, progresInitial, sauverProgres } from '../lib/progression.js'
import { construireBarid, encoderLettre, terminerBarid } from '../lib/barid.js'
import { ciblePhrase } from '../lib/phrase.js'
import { mulberry32 } from '../lib/quiz.js'
import { DEBIT_LENT, DEBIT_NORMAL } from '../lib/tts.js'
import { Accueil } from './Accueil.jsx'
import { Apprendre } from './Apprendre.jsx'
import { motsVoyageurs, totalVoyageurs } from '../data/voyageurs.js'
import { JeuSouk } from './JeuSouk.jsx'
import { Lecon } from './Lecon.jsx'
import { Course } from './Course.jsx'
import { Classement } from './Classement.jsx'
import { jourLocal } from '../lib/progression.js'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const t = getDictionary('fr')
const es = LANGUES.find((l) => l.id === 'es')
const tr = LANGUES.find((l) => l.id === 'tr')

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
const bouton = (conteneur, texte) =>
  [...conteneur.querySelectorAll('button')].find((b) => b.textContent.includes(texte))
const primaire = (conteneur) => conteneur.querySelector('.bouton--primaire')

beforeEach(() => {
  // Le quiz mélange avec Math.random : figé pour que le déroulé soit rejouable.
  vi.spyOn(Math, 'random').mockImplementation(mulberry32(7))
})

afterEach(() => {
  for (const { racine, conteneur } of montes.splice(0)) {
    act(() => racine.unmount())
    conteneur.remove()
  }
  vi.restoreAllMocks()
  localStorage.clear()
  document.documentElement.removeAttribute('dir')
  document.documentElement.removeAttribute('lang')
})

describe('une leçon jouée jusqu’au bilan', () => {
  it('traverse les cartes et les huit questions, garde le focus, annonce, remonte les réponses et propose la suite', () => {
    const surTerminer = vi.fn(() => ({
      xpGagne: 60,
      valide: true,
      gelConsomme: false,
      nouveauVisa: false,
      suivante: { langue: es, lecon: es.lecons[1] },
    }))
    const surSuivante = vi.fn()
    const vue = monter(
      <Lecon
        t={t}
        locale="fr"
        source="fr"
        langue={es}
        lecon={es.lecons[0]}
        indexLangue={0}
        surTerminer={surTerminer}
        surSuivante={surSuivante}
        surQuitter={() => {}}
      />
    )

    // Les cartes : un seul bouton qui change d'étiquette — le même nœud, donc
    // le focus ne se perd pas d'une carte à l'autre.
    const carte = vue.querySelector('.carte-mot')
    expect(carte.getAttribute('role')).toBe('button')
    expect(carte.getAttribute('tabindex')).toBe('0')
    const boutonCartes = primaire(vue)
    expect(boutonCartes.textContent).toBe(t.voirReponse)
    for (let i = 0; i < 8; i++) {
      clic(primaire(vue))
      expect(primaire(vue)).toBe(boutonCartes)
      expect(primaire(vue).textContent).toBe(t.suivant)
      clic(primaire(vue))
    }

    // Le quiz : huit questions, dont des épellations à tuiles.
    const statut = vue.querySelector('[role="status"]')
    expect(statut).not.toBeNull()
    expect(statut.textContent).toBe('')
    let repondues = 0
    for (let q = 0; q < 8; q++) {
      expect(vue.textContent).toContain(`${q + 1}/8`)
      const options = [...vue.querySelectorAll('.option')]
      if (options.length) {
        clic(options[0])
        // aria-disabled, pas disabled : l'option cliquée garde le focus et un
        // second clic est ignoré par la garde du handler.
        expect(options[0].getAttribute('aria-disabled')).toBe('true')
        expect(options[0].hasAttribute('disabled')).toBe(false)
        clic(options[0])
      } else {
        const fentes = vue.querySelectorAll('.fente:not(.fente--espace)').length
        expect(fentes).toBeGreaterThan(0)
        for (let i = 0; i < fentes; i++) clic(vue.querySelector('.lettre:not([disabled])'))
      }
      repondues++
      // Le même nœud role="status" existait déjà vide : il porte maintenant la correction.
      expect(vue.querySelector('[role="status"]')).toBe(statut)
      expect([t.bonneReponse, t.mauvaiseReponse].some((m) => statut.textContent.includes(m))).toBe(true)
      clic(bouton(vue, t.continuer))
    }
    expect(repondues).toBe(8)

    // Le bilan : score et réponses mot par mot remontés, puis « Étape suivante ».
    expect(surTerminer).toHaveBeenCalledTimes(1)
    const [score, total, reussis] = surTerminer.mock.calls[0]
    expect(total).toBe(8)
    expect(Object.keys(reussis).sort()).toEqual(es.lecons[0].mots.map((m) => m.id).sort())
    expect(Object.values(reussis).filter(Boolean)).toHaveLength(score)
    expect(vue.textContent).toContain(t.scoreSur(score, 8))
    const suite = bouton(vue, t.etapeSuivante)
    expect(suite.textContent).toContain('En route')
    expect(suite.classList.contains('bouton--primaire')).toBe(true)
    clic(suite)
    expect(surSuivante).toHaveBeenCalledWith({ langue: es, lecon: es.lecons[1] })
  })

  it('sans étape suivante, « Rejouer » redevient le bouton principal', () => {
    const vue = monter(
      <Lecon
        t={t}
        locale="fr"
        source="fr"
        langue={es}
        lecon={es.lecons[0]}
        indexLangue={0}
        surTerminer={() => ({ xpGagne: 0, valide: false, gelConsomme: false, nouveauVisa: false, suivante: null })}
        surSuivante={() => {}}
        surQuitter={() => {}}
      />
    )
    for (let i = 0; i < 16; i++) clic(primaire(vue))
    for (let q = 0; q < 8; q++) {
      const options = [...vue.querySelectorAll('.option')]
      if (options.length) clic(options[0])
      else {
        const fentes = vue.querySelectorAll('.fente:not(.fente--espace)').length
        for (let i = 0; i < fentes; i++) clic(vue.querySelector('.lettre:not([disabled])'))
      }
      clic(bouton(vue, t.continuer))
    }
    expect(bouton(vue, t.etapeSuivante)).toBeUndefined()
    expect(bouton(vue, t.rejouer).classList.contains('bouton--primaire')).toBe(true)
  })
})

describe('réécouter, et lentement', () => {
  // jsdom n'a pas de synthèse vocale : un appareil avec une voix espagnole.
  let dites
  beforeEach(() => {
    dites = []
    class Utterance {
      constructor(texte) {
        this.text = texte
      }
    }
    globalThis.SpeechSynthesisUtterance = Utterance
    window.SpeechSynthesisUtterance = Utterance
    window.speechSynthesis = {
      getVoices: () => [
        { lang: 'es-ES', name: 'Mónica' },
        { lang: 'fr-FR', name: 'Thomas' },
      ],
      cancel: () => {},
      speak: (phrase) => dites.push(phrase),
      addEventListener: () => {},
      removeEventListener: () => {},
    }
  })
  afterEach(() => {
    delete window.speechSynthesis
    delete window.SpeechSynthesisUtterance
    delete globalThis.SpeechSynthesisUtterance
  })

  const parLabel = (vue, label) => vue.querySelector(`button[aria-label="${label}"]`)
  const sansPonctuation = (texte) => texte.replace(/[…?¿？]/g, ' ')
  const monterLecon = (langue) =>
    monter(
      <Lecon
        t={t}
        locale="fr"
        source="fr"
        langue={langue}
        lecon={langue.lecons[0]}
        indexLangue={0}
        surTerminer={() => ({ xpGagne: 0, valide: false, gelConsomme: false, nouveauVisa: false, suivante: null })}
        surSuivante={() => {}}
        surQuitter={() => {}}
      />
    )

  it('une carte se réécoute au verso comme au recto, et lentement', () => {
    const vue = monterLecon(es)
    const carte = vue.querySelector('.carte-mot')
    // Hors de la carte : pas de bouton dans le role="button", visible des deux côtés.
    expect(carte.querySelector('button')).toBeNull()
    clic(primaire(vue))
    expect(carte.classList.contains('carte-mot--retournee')).toBe(true)
    clic(parLabel(vue, t.ecouter))
    clic(parLabel(vue, t.ecouterLent))
    const [retourne, normal, lent] = dites
    expect(sansPonctuation(es.lecons[0].mots[0].t)).toBe(retourne.text)
    expect(normal.rate).toBe(DEBIT_NORMAL)
    expect(lent.rate).toBe(DEBIT_LENT)
    expect(lent.text).toBe(retourne.text)
    expect(lent.voice.name).toBe('Mónica')
  })

  it('au quiz : le son d’un « produire » n’arrive qu’avec la réponse ; écoute pure et dictée se prononcent seules', () => {
    const vue = monterLecon(es)
    for (let i = 0; i < 16; i++) clic(primaire(vue))
    const invite = () => vue.querySelector('p[tabindex="-1"]').textContent
    const sensDeLaLecon = es.lecons[0].mots.map((m) => sensPour(m, 'fr', 'es'))
    let produites = 0
    let ecoutes = 0
    let dictees = 0
    for (let q = 0; q < 8; q++) {
      if (invite() === t.promptProduire(nomLangue(es, 'fr'))) {
        produites++
        // Avant de choisir, l'entendre soufflerait la réponse.
        expect(parLabel(vue, t.ecouter)).toBeNull()
        expect(parLabel(vue, t.ecouterLent)).toBeNull()
        clic(vue.querySelector('.option'))
        const bonne = vue.querySelector('.option--correcte [dir="auto"]').textContent
        clic(parLabel(vue, t.ecouterLent))
        expect(dites.at(-1).rate).toBe(DEBIT_LENT)
        expect(dites.at(-1).text).toBe(sansPonctuation(bonne))
      } else if (invite() === t.promptDictee) {
        dictees++
        const carte = vue.querySelector('.carte')
        // L'oreille seule : ni mot écrit ni sens avant la réponse — mais la tortue.
        expect(carte.querySelector('[lang]')).toBeNull()
        expect(sensDeLaLecon.some((s) => carte.textContent.includes(s))).toBe(false)
        expect(parLabel(vue, t.ecouterLent)).not.toBeNull()
        const fentes = vue.querySelectorAll('.fente:not(.fente--espace)').length
        for (let i = 0; i < fentes; i++) clic(vue.querySelector('.lettre:not([disabled])'))
        // Une fois épelé, le mot retrouve son sens.
        expect(sensDeLaLecon.some((s) => carte.textContent.includes(s))).toBe(true)
      } else if (vue.querySelector('.option')) {
        clic(vue.querySelector('.option'))
      } else {
        const fentes = vue.querySelectorAll('.fente:not(.fente--espace)').length
        for (let i = 0; i < fentes; i++) clic(vue.querySelector('.lettre:not([disabled])'))
      }
      const avant = dites.length
      clic(bouton(vue, t.continuer))
      // L'écoute pure et la dictée se prononcent seules à l'arrivée ; rien d'autre.
      if (q < 7 && [t.jeux.ecouteSens, t.promptDictee].includes(invite())) {
        ecoutes++
        expect(dites.length - avant).toBe(1)
        expect(dites.at(-1).rate).toBe(DEBIT_NORMAL)
        expect(parLabel(vue, t.ecouterLent)).not.toBeNull()
      } else {
        expect(dites.length - avant).toBe(0)
      }
    }
    expect(produites).toBeGreaterThan(0)
    expect(ecoutes).toBeGreaterThan(0)
    expect(dictees).toBeGreaterThan(0)
  })

  it('au Souk, la tortue est sur les manches « sens », jamais là où elle soufflerait le mot', () => {
    const vus = { sens: 0, mot: 0 }
    // Chaque montage tire une nouvelle manche (Math.random figé mais qui avance).
    for (let i = 0; i < 12 && (!vus.sens || !vus.mot); i++) {
      const vue = monter(<JeuSouk t={t} locale="fr" source="fr" langue={es} surXp={() => {}} surQuitter={() => {}} />)
      // Manche « sens » : le mot cible est dans la carte ; « mot » : c'est le sens.
      const versSens = vue.querySelector('.carte [lang]') !== null
      vus[versSens ? 'sens' : 'mot']++
      expect(parLabel(vue, t.ecouterLent) !== null).toBe(versSens)
      if (versSens) {
        clic(parLabel(vue, t.ecouterLent))
        expect(dites.at(-1).rate).toBe(DEBIT_LENT)
      }
    }
    expect(vus.sens).toBeGreaterThan(0)
    expect(vus.mot).toBeGreaterThan(0)
  })

  it('sans voix pour la langue, aucun haut-parleur ne fait semblant', () => {
    window.speechSynthesis.getVoices = () => [{ lang: 'fr-FR', name: 'Thomas' }]
    const vue = monterLecon(tr)
    expect(parLabel(vue, t.ecouter)).toBeNull()
    expect(parLabel(vue, t.ecouterLent)).toBeNull()
  })
})

describe('la phrase dans l’ordre', () => {
  // La leçon d'espagnol la plus riche en phrases de trois mots ou plus.
  const lecon = [...es.lecons].sort(
    (a, b) => b.mots.filter((m) => ciblePhrase(m)).length - a.mots.filter((m) => ciblePhrase(m)).length
  )[0]
  const monterPhrase = () =>
    monter(
      <Lecon
        t={t}
        locale="fr"
        source="fr"
        langue={es}
        lecon={lecon}
        indexLangue={0}
        surTerminer={() => ({ xpGagne: 0, valide: false, gelConsomme: false, nouveauVisa: false, suivante: null })}
        surSuivante={() => {}}
        surQuitter={() => {}}
      />
    )
  // Cartes passées, on répond au hasard jusqu'à la première phrase à ordonner.
  const jusquALaPhrase = (vue) => {
    for (let i = 0; i < 2 * lecon.mots.length; i++) clic(primaire(vue))
    for (let q = 0; q < lecon.mots.length; q++) {
      if (vue.querySelector('.lettre--mot')) return true
      const options = vue.querySelectorAll('.option')
      if (options.length) clic(options[0])
      else {
        const fentes = vue.querySelectorAll('.fente:not(.fente--espace)').length
        for (let i = 0; i < fentes; i++) clic(vue.querySelector('.lettre:not([disabled])'))
      }
      clic(bouton(vue, t.continuer))
    }
    return false
  }
  // Le mot se retrouve par son sens, seul affiché avant la réponse.
  const motAffiche = (vue) => {
    const sens = vue.querySelector('.carte .mot-cible').textContent
    return lecon.mots.find((m) => sensPour(m, 'fr', 'es') === sens)
  }
  const poser = (vue, jetons) => {
    for (const j of jetons) clic([...vue.querySelectorAll('.lettre--mot:not([disabled])')].find((b) => b.textContent === j))
  }

  it('on la reconstruit d’après son sens, parmi deux intrus ; juste, elle s’écrit enfin', () => {
    const vue = monterPhrase()
    expect(jusquALaPhrase(vue)).toBe(true)
    expect(vue.querySelector('p[tabindex="-1"]').textContent).toBe(t.promptOrdonner)
    const mot = motAffiche(vue)
    const jetons = ciblePhrase(mot)
    expect(vue.querySelectorAll('.lettre--mot')).toHaveLength(jetons.length + 2)
    // Avant la réponse : ni la phrase écrite, ni le moindre mot cible dans la carte.
    expect(vue.querySelector('.phrase-revelee')).toBeNull()
    expect(vue.querySelector('.carte [lang]')).toBeNull()
    poser(vue, jetons)
    expect(vue.querySelector('[role="status"]').textContent).toContain(t.bonneReponse)
    expect(vue.querySelector('.phrase-revelee').textContent).toBe(mot.t)
    expect([...vue.querySelectorAll('.mot-place')].map((s) => s.textContent)).toEqual(jetons)
  })

  it('dans le désordre, c’est faux, et la correction cite la phrase', () => {
    const vue = monterPhrase()
    expect(jusquALaPhrase(vue)).toBe(true)
    const mot = motAffiche(vue)
    poser(vue, [...ciblePhrase(mot)].reverse())
    const statut = vue.querySelector('[role="status"]').textContent
    expect(statut).toContain(t.mauvaiseReponse)
    expect(statut).toContain(mot.t)
  })
})

describe('les mots voyageurs', () => {
  const arabe = LANGUES.find((l) => l.id === 'ar')
  const monterApprendre = (langue, locale = 'fr') =>
    monter(
      <Apprendre
        t={getDictionary(locale)}
        locale={locale}
        source={locale}
        progres={progresInitial()}
        langue={langue}
        surLecon={() => {}}
        surJeu={() => {}}
      />
    )

  it('Grenade montre ses mots partis de l’arabe : l’origine en arabe, le mot en espagnol, le sens', () => {
    const vue = monterApprendre(es)
    const mots = motsVoyageurs('es')
    const cartes = vue.querySelectorAll('.voyageur')
    expect(mots.length).toBeGreaterThan(0)
    expect(cartes).toHaveLength(mots.length)
    const origine = cartes[0].querySelector('.voyageur__origine')
    expect(origine.textContent).toBe(mots[0].arabe)
    expect(origine.getAttribute('lang')).toBe(arabe.tts)
    const cible = cartes[0].querySelector('.voyageur__cible')
    expect(cible.textContent).toBe(mots[0].t)
    expect(cible.getAttribute('lang')).toBe(es.tts)
    expect(cartes[0].textContent).toContain(mots[0].fr)
  })

  it('au Caire, point de départ : le compte des mots partis, pas de liste', () => {
    const vue = monterApprendre(arabe)
    expect(vue.querySelectorAll('.voyageur')).toHaveLength(0)
    expect(vue.querySelector('.voyageurs-depart').textContent).toBe(t.voyageurs.depart(totalVoyageurs()))
  })

  it('en arabe, le sens n’est pas répété quand il est le mot d’origine lui-même', () => {
    const mots = motsVoyageurs('es')
    const i = mots.findIndex((m) => m.ar === m.arabe)
    expect(i).toBeGreaterThanOrEqual(0)
    const carte = monterApprendre(es, 'ar').querySelectorAll('.voyageur')[i]
    expect(carte.textContent.split(mots[i].arabe)).toHaveLength(2)
  })
})

describe('l’Accueil avec un visa figé', () => {
  const rendreIstanbul = (progres) => {
    const vue = monter(
      <Accueil
        t={t}
        locale="fr"
        progres={progres}
        surDestination={() => {}}
        surLecon={() => {}}
        surDefi={() => {}}
        surCarnet={() => {}}
        cap="route"
      />
    )
    // La ligne de l'itinéraire — pas la carte « Reprendre », qui cite aussi Istanbul.
    return [...vue.querySelectorAll('button.etape-itineraire')].find((b) => b.textContent.includes('Istanbul')).textContent
  }

  it('montre « Visa obtenu » pour un tampon figé, même si la destination a gagné des leçons depuis', () => {
    // Le tampon a été décroché quand Istanbul comptait 12 étapes ; elle en a 24 aujourd'hui.
    let progres = progresInitial()
    for (const lecon of tr.lecons.slice(0, 12)) {
      progres = enregistrerEtape(progres, 'tr', lecon.id, 8, 8, '2026-08-30').progres
    }
    const fige = { ...progres, visas: { tr: { jour: '2026-08-30' } }, parcours: { tr: 1 } }

    expect(rendreIstanbul(fige)).toContain(t.visaObtenu)
    // La même progression sans historisation redescend à « 12 étapes sur 24 ».
    expect(rendreIstanbul(progres)).toContain(t.etapesFaites(12, 24))
    expect(rendreIstanbul(progres)).not.toContain(t.visaObtenu)
    // Et figerAvancement ne fabrique pas de visa à 12/24 : le tampon vient bien de l'historique.
    expect(figerAvancement(progres, tr, '2026-09-10').visas.tr).toBeUndefined()
  })
})

describe('l’app en arabe', () => {
  it('pose dir=rtl et lang=ar sur la racine, et dir=auto + lang sur chaque mot cible', () => {
    localStorage.setItem('rihla.langue', 'ar')
    localStorage.setItem('rihla.cap', 'es')
    localStorage.setItem('rihla.destination', 'es')
    localStorage.setItem('rihla.theme', 'clair')
    const vue = monter(<App />)

    expect(document.documentElement.dir).toBe('rtl')
    expect(document.documentElement.lang).toBe('ar')

    clic(bouton(vue, 'تعلّم'))
    clic([...vue.querySelectorAll('button.carte')].find((b) => b.textContent.includes('التحيات')))

    const mot = vue.querySelector('.carte-mot__face--recto [dir="auto"]')
    expect(mot.textContent).toBe('Hola')
    expect(mot.getAttribute('lang')).toBe('es-ES')
    // Le sens (langue des définitions) ne porte ni dir="auto" ni lang.
    const sens = vue.querySelector('.carte-mot__face--verso .mot-cible')
    expect(sens.textContent).toBe('مرحبا')
    expect(sens.hasAttribute('lang')).toBe(false)
    expect(sens.hasAttribute('dir')).toBe(false)
  })
})

describe('le Barid — le duel à distance', () => {
  const graine = 4242
  const defiDeFatima = { n: 'فاطمة', l: 'tr', g: graine, s: 8, t: 42 }
  const preparer = () => {
    localStorage.setItem('rihla.langue', 'fr')
    localStorage.setItem('rihla.cap', 'route')
    localStorage.setItem('rihla.theme', 'clair')
  }

  afterEach(() => {
    window.location.hash = ''
  })

  it('un lien reçu ouvre la lettre, fait jouer les MÊMES dix questions, tranche, paie, et s’efface de l’adresse', () => {
    preparer()
    window.location.hash = `#barid=${encoderLettre(defiDeFatima)}`
    const vue = monter(<App />)

    expect(window.location.hash).toBe('')
    expect(vue.textContent).toContain(t.barid.defiDe('فاطمة'))
    expect(vue.textContent).toContain(t.barid.resultat(8, 10, 42))

    clic(bouton(vue, t.barid.releve))
    for (const question of construireBarid(LANGUES, 'tr', graine)) {
      const attendu = question.type === 'comprendre' ? question.mot.fr : question.mot.t
      const options = [...vue.querySelectorAll('button.option')]
      expect(options).toHaveLength(4)
      // Le tirage à l'écran est bien celui de la graine : la bonne réponse y est.
      clic(options.find((b) => b.textContent.trim() === attendu))
      clic(primaire(vue))
    }

    expect(vue.textContent).toContain(t.barid.gagne)
    expect(vue.textContent).toContain(t.plusXp(30))
    expect(bouton(vue, t.barid.riposter)).toBeTruthy()
    expect(bouton(vue, t.barid.envoyerResultat)).toBeTruthy()
    const progres = chargerProgres()
    expect(progres.barid[graine]).toMatchObject({ l: 'tr', s: 10, adv: { n: 'فاطمة', s: 8, t: 42 }, verdict: 'gagne' })
    expect(progres.xp).toBe(30)
  })

  it('une réponse à mon défi affiche le verdict, l’inscrit sans XP, et propose de relancer', () => {
    preparer()
    // J'avais lancé ce défi : 7/10 en 51 s (14 XP).
    sauverProgres(terminerBarid(progresInitial(), { graine, langueId: 'tr', score: 7, temps: 51 }, '2026-09-19').progres)
    window.location.hash = `#barid=${encoderLettre({ n: 'Amine', re: { l: 'tr', g: graine, s: 9, t: 38, s0: 7, t0: 51 } })}`
    const vue = monter(<App />)

    expect(vue.textContent).toContain(t.barid.reponseDe('Amine'))
    expect(vue.textContent).toContain(t.barid.perdu)
    const progres = chargerProgres()
    expect(progres.barid[graine]).toMatchObject({ s: 7, adv: { n: 'Amine', s: 9, t: 38 }, verdict: 'perdu' })
    expect(progres.xp).toBe(14)

    clic(bouton(vue, t.barid.relancer))
    expect(bouton(vue, t.barid.lancer)).toBeTruthy()
  })

  it('un lien abîmé ouvre le comptoir avec l’explication, jamais une lettre', () => {
    preparer()
    window.location.hash = `#barid=${encoderLettre({ n: 'x', l: 'tr', g: 5, s: 11, t: 4 })}`
    const vue = monter(<App />)
    expect(vue.textContent).toContain(t.barid.erreurs.abime)
    expect(vue.textContent).not.toContain(t.barid.releve)
  })

  it('depuis l’Accueil : on joue ses dix questions et la lettre est prête à partir', () => {
    preparer()
    const vue = monter(<App />)
    clic(bouton(vue, t.barid.titre))
    expect(vue.textContent).toContain(t.barid.intro)
    clic(bouton(vue, t.barid.lancer))
    for (let i = 0; i < 10; i++) {
      clic(vue.querySelector('button.option'))
      clic(primaire(vue))
    }
    expect(vue.textContent).toContain(t.barid.finDefi)
    expect(bouton(vue, t.barid.envoyer)).toBeTruthy()
    expect(bouton(vue, t.barid.copierLien)).toBeTruthy()
    expect(Object.keys(chargerProgres().barid)).toHaveLength(1)
  })
})

// ————— En ligne : un faux serveur, piloté à la main —————
const MOI = { id: 'amine000amine000', secret: 'secret-amine-secret-amine', nom: 'Amine' }
const SARA = { id: 'sara0000sara0000', nom: 'Sara' }

const brancherEnLigne = ({ actif = true } = {}) => {
  localStorage.setItem('rihla.serveur', 'http://localhost:8787')
  localStorage.setItem('rihla.voyageur', JSON.stringify(MOI))
  if (actif) localStorage.setItem('rihla.enligne', 'oui')
}

// Les trois portes vers le serveur, remplacées : on garde chaque « connexion »
// pour lui faire dire ce que le serveur dirait.
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

const attendreMicro = () => act(async () => {})

describe('la Course — le duel en direct', () => {
  afterEach(() => vi.useRealTimers())

  it('crée une salle, attend, égrène le compte à rebours, joue au rythme du serveur et affiche SON verdict', async () => {
    brancherEnLigne()
    vi.useFakeTimers()
    const { transport, salles } = fauxTransport()
    const surTerminer = vi.fn(() => ({ xpGagne: 26, verdict: 'gagne' }))
    const vue = monter(
      <Course t={t} locale="fr" source="fr" langueId="tr" surTerminer={surTerminer} surClassement={() => {}} surQuitter={() => {}} transport={transport} />
    )
    expect(vue.textContent).toContain(t.course.intro)

    clic(bouton(vue, t.course.creer))
    await attendreMicro()
    expect(transport.creerSalle).toHaveBeenCalledWith('tr')
    expect(salles[0].code).toBe('ABC23')
    expect(salles[0].voyageur).toEqual({ id: MOI.id, nom: 'Amine' })
    expect(vue.textContent).toContain('ABC23')

    const serveur = (m) => act(() => salles[0].gestionnaires.surMessage(m))
    const moi = (extra) => ({ id: MOI.id, nom: 'Amine', score: 0, i: 0, fini: false, revanche: false, present: true, ...extra })
    const sara = (extra) => ({ ...SARA, score: 0, i: 0, fini: false, revanche: false, present: true, ...extra })

    serveur({ type: 'salle', phase: 'attente', langue: 'tr', joueurs: [moi()] })
    expect(vue.textContent).toContain(t.course.attenteAdversaire)

    const graine = 4242
    const questions = construireBarid(LANGUES, 'tr', graine)
    serveur({ type: 'depart', graine, langue: 'tr', debut: 0, dans: 3000, joueurs: [moi(), sara()] })
    expect(vue.textContent).toContain(t.course.pret)
    expect(vue.textContent).toContain('3')
    // Une seconde par act : le tick suivant n'est programmé qu'une fois le
    // rendu passé, il ne se laisse pas avancer en bloc.
    act(() => vi.advanceTimersByTime(1000))
    expect(vue.textContent).toContain('2')
    act(() => vi.advanceTimersByTime(1000))
    act(() => vi.advanceTimersByTime(1000))
    expect(vue.querySelectorAll('button.option')).toHaveLength(4)

    // La bonne réponse à la première question part telle quelle au serveur.
    const attendu = questions[0].type === 'comprendre' ? questions[0].mot.fr : questions[0].mot.t
    clic([...vue.querySelectorAll('button.option')].find((b) => b.textContent.trim() === attendu))
    expect(salles[0].envoyes).toEqual([{ type: 'repondre', i: 0, optionId: questions[0].mot.id }])
    expect(vue.querySelector('[role="status"]').textContent).toContain(t.bonneReponse)

    // L'adversaire avance : sa barre suit.
    serveur({ type: 'etat', joueurs: [moi({ score: 1, i: 1 }), sara({ score: 2, i: 3 })] })
    expect(vue.textContent).toContain('Sara')
    expect([...vue.querySelectorAll('.piste-progres__barre')].some((b) => b.style.width === '30%')).toBe(true)

    for (let i = 1; i < 10; i++) {
      clic(primaire(vue))
      clic(vue.querySelector('button.option'))
    }
    expect(salles[0].envoyes).toHaveLength(10)
    clic(primaire(vue))
    expect(vue.textContent).toContain(t.course.attenteFin)

    serveur({
      type: 'fin',
      graine,
      joueurs: [
        { id: MOI.id, nom: 'Amine', score: 8, temps: 20, verdict: 'gagne', points: 3, present: true },
        { id: SARA.id, nom: 'Sara', score: 7, temps: 18, verdict: 'perdu', points: 1, present: true },
      ],
    })
    expect(surTerminer).toHaveBeenCalledTimes(1)
    expect(surTerminer).toHaveBeenCalledWith({ graine, langueId: 'tr', score: 8, temps: 20, adversaire: { n: 'Sara', s: 7, t: 18 }, verdictImpose: 'gagne' })
    expect(vue.textContent).toContain(t.barid.gagne)
    expect(vue.textContent).toContain(t.plusXp(26))
    expect(vue.textContent).toContain(t.course.points(3))

    clic(bouton(vue, t.course.revanche))
    expect(salles[0].envoyes.at(-1)).toEqual({ type: 'revanche' })
    expect(vue.textContent).toContain(t.course.revancheAttente)
    // La revanche repart : nouvelle graine, compte à rebours, rien d'inscrit deux fois.
    serveur({ type: 'depart', graine: 777, langue: 'tr', debut: 0, dans: 3000, joueurs: [moi(), sara()] })
    expect(vue.textContent).toContain(t.course.pret)
    expect(surTerminer).toHaveBeenCalledTimes(1)
  })

  it('demande le consentement avant le premier appel ; un lien #salle= rejoint ensuite directement', async () => {
    brancherEnLigne({ actif: false })
    const { transport, salles } = fauxTransport()
    const vue = monter(
      <Course t={t} locale="fr" source="fr" codeInitial="xyz78" surTerminer={() => ({})} surClassement={() => {}} surQuitter={() => {}} transport={transport} />
    )
    expect(vue.textContent).toContain(t.enligne.consentTitre)
    expect(transport.ouvrirSalle).not.toHaveBeenCalled()
    clic(bouton(vue, t.enligne.activer))
    expect(localStorage.getItem('rihla.enligne')).toBe('oui')
    expect(salles[0].code).toBe('XYZ78')
    expect(vue.textContent).toContain(t.course.connexion)
  })

  it('un adversaire au hasard passe par le hall, puis par la salle qu’il désigne', () => {
    brancherEnLigne()
    const { transport, salles, halls } = fauxTransport()
    const vue = monter(
      <Course t={t} locale="fr" source="fr" langueId="es" surTerminer={() => ({})} surClassement={() => {}} surQuitter={() => {}} transport={transport} />
    )
    clic(bouton(vue, t.course.hasard))
    expect(halls[0].code).toBe('es')
    expect(vue.textContent).toContain(t.course.recherche)
    act(() => halls[0].gestionnaires.surMessage({ type: 'salle', code: 'QR7ZK' }))
    expect(halls[0].fermee).toBe(true)
    expect(salles[0].code).toBe('QR7ZK')
  })

  it('une salle pleine, une salle introuvable ou une connexion perdue le disent, avec la sortie qui convient', () => {
    brancherEnLigne()
    const { transport, salles } = fauxTransport()
    const vue = monter(
      <Course t={t} locale="fr" source="fr" codeInitial="ABC23" surTerminer={() => ({})} surClassement={() => {}} surQuitter={() => {}} transport={transport} />
    )
    act(() => salles[0].gestionnaires.surMessage({ type: 'erreur', code: 'pleine' }))
    expect(vue.textContent).toContain(t.course.erreurs.pleine)
    expect(salles[0].fermee).toBe(true)
    clic(bouton(vue, t.course.retour))
    clic(bouton(vue, t.course.entrer))
    expect(vue.textContent).toContain(t.course.erreurs.code)

    // Le serveur ferme sans avoir jamais répondu : la salle n'existe pas.
    const vue2 = monter(
      <Course t={t} locale="fr" source="fr" codeInitial="ZZZ22" surTerminer={() => ({})} surClassement={() => {}} surQuitter={() => {}} transport={transport} />
    )
    act(() => salles[1].gestionnaires.surFermeture({ code: 1006, voulu: false }))
    expect(vue2.textContent).toContain(t.course.erreurs.introuvable)
    expect(bouton(vue2, t.course.reessayer)).toBeUndefined()
  })
})

describe('les classements', () => {
  it('montre le jour et la semaine, ma ligne hors du top, et renvoie mon score du jour', async () => {
    brancherEnLigne()
    const jour = jourLocal()
    const transport = {
      lireClassement: vi.fn(async (type) =>
        type === 'jour'
          ? { lignes: [{ rang: 1, id: 'x', nom: 'فاطمة', score: 9, temps: 40 }], total: 60, moi: { rang: 57, score: 5, temps: 80 } }
          : { lignes: [], total: 0, moi: null }
      ),
      envoyerScore: vi.fn(async () => ({ ok: true })),
    }
    const progres = { ...progresInitial(), defis: { [jour]: { score: 5, total: 10, temps: 80 } } }
    const vue = monter(<Classement t={t} progres={progres} surQuitter={() => {}} transport={transport} />)
    await attendreMicro()
    expect(transport.lireClassement).toHaveBeenCalledWith('jour', jour, MOI.id)
    expect(vue.textContent).toContain('فاطمة')
    expect(vue.textContent).toContain(t.classement.scoreJour(9, 10, 40))
    expect(vue.textContent).toContain(t.classement.monRang(57, 60))
    expect(vue.textContent).toContain(t.classement.toi)

    clic(bouton(vue, t.classement.envoyer))
    await attendreMicro()
    expect(transport.envoyerScore).toHaveBeenCalledWith(expect.objectContaining({ id: MOI.id }), { type: 'jour', cle: jour, score: 5, temps: 80 })
    expect(vue.textContent).toContain(t.classement.envoye)

    clic(bouton(vue, t.classement.semaine))
    await attendreMicro()
    expect(transport.lireClassement).toHaveBeenLastCalledWith('semaine', expect.stringMatching(/^\d{4}-W\d{2}$/), MOI.id)
    expect(vue.textContent).toContain(t.classement.vide)
  })

  it('sans consentement, rien n’est lu', () => {
    brancherEnLigne({ actif: false })
    const transport = { lireClassement: vi.fn(), envoyerScore: vi.fn() }
    const vue = monter(<Classement t={t} progres={progresInitial()} surQuitter={() => {}} transport={transport} />)
    expect(vue.textContent).toContain(t.enligne.consentTitre)
    expect(transport.lireClassement).not.toHaveBeenCalled()
  })
})
