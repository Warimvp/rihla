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
import { LANGUES } from '../data/langues.js'
import { getDictionary } from '../i18n.js'
import { enregistrerEtape, figerAvancement, progresInitial } from '../lib/progression.js'
import { mulberry32 } from '../lib/quiz.js'
import { Accueil } from './Accueil.jsx'
import { Lecon } from './Lecon.jsx'

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
