// @vitest-environment jsdom
//
// Les parcours : ce qu'un voyageur fait sans qu'on le lui explique. Premier
// lancement dans sa langue, changer de destination, retrouver les jeux, ne
// pas perdre une étape sur un geste, revenir en arrière avec le bouton du
// téléphone.
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App, { DELAI_REPRISE } from '../App.jsx'
import { LANGUES } from '../data/langues.js'
import { getDictionary } from '../i18n.js'
import { enregistrerEtape, progresInitial } from '../lib/progression.js'
import { EVENEMENT_RETOUR } from '../lib/retour.js'
import { mulberry32 } from '../lib/quiz.js'
import { exporterProgres } from '../lib/sauvegarde.js'
import { Accueil } from './Accueil.jsx'
import { Apprendre } from './Apprendre.jsx'
import { Cap } from './Cap.jsx'
import { Lecon } from './Lecon.jsx'
import { BoutonQuitter } from './Quitter.jsx'
import { Reglages } from './Reglages.jsx'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const t = getDictionary('fr')
const ar = getDictionary('ar')
const es = LANGUES.find((l) => l.id === 'es')
const fr = LANGUES.find((l) => l.id === 'fr')

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
const parLabel = (conteneur, label) => [...conteneur.querySelectorAll('button')].find((b) => b.getAttribute('aria-label') === label)
// Le bouton retour du téléphone : l'historique revient sur une entrée plus basse.
const retourSysteme = (etat = null) => act(() => window.dispatchEvent(new PopStateEvent('popstate', { state: etat })))
const langueDuTelephone = (langues) => vi.spyOn(window.navigator, 'languages', 'get').mockReturnValue(langues)

beforeEach(() => {
  vi.spyOn(Math, 'random').mockImplementation(mulberry32(7))
  Element.prototype.scrollIntoView = vi.fn()
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

describe('le premier lancement', () => {
  it('parle arabe à un téléphone en arabe, sans passer par les Réglages', () => {
    langueDuTelephone(['ar-MA', 'fr-FR'])
    const vue = monter(<App />)
    expect(document.documentElement.lang).toBe('ar')
    expect(document.documentElement.dir).toBe('rtl')
    expect(vue.querySelector('h1').textContent).toBe(ar.cap.titre)
  })

  it('parle français aux autres, et le premier écran laisse changer de langue', () => {
    langueDuTelephone(['en-US'])
    const vue = monter(<App />)
    expect(vue.querySelector('h1').textContent).toBe(t.cap.titre)
    const langues = [...vue.querySelectorAll('.segmente--langue button')]
    expect(langues.map((b) => b.textContent)).toEqual(['Français', 'العربية'])
    expect(langues.map((b) => b.getAttribute('aria-pressed'))).toEqual(['true', 'false'])
    clic(langues[1])
    expect(vue.querySelector('h1').textContent).toBe(ar.cap.titre)
    expect(document.documentElement.dir).toBe('rtl')
    // Le choix est gardé : il passera devant la langue du téléphone.
    expect(localStorage.getItem('rihla.langue')).toBe('ar')
    clic(vue.querySelectorAll('.segmente--langue button')[0])
    expect(vue.querySelector('h1').textContent).toBe(t.cap.titre)
  })

  it('un choix déjà fait passe devant la langue du téléphone', () => {
    langueDuTelephone(['ar-MA'])
    localStorage.setItem('rihla.langue', 'fr')
    const vue = monter(<App />)
    expect(vue.querySelector('h1').textContent).toBe(t.cap.titre)
    expect(document.documentElement.dir).toBe('ltr')
  })

  it('le sélecteur de langue existe seul : sans lui, l’écran du cap ne change pas', () => {
    const vue = monter(<Cap t={t} locale="fr" capActuel="route" surChoisir={() => {}} surFermer={() => {}} />)
    expect(vue.querySelector('.segmente--langue')).toBeNull()
  })
})

describe('se repérer', () => {
  const partir = () => {
    localStorage.setItem('rihla.cap', 'route')
    localStorage.setItem('rihla.langue', 'fr')
    return monter(<App />)
  }

  it('le premier onglet dit ce qu’il ouvre, et l’aide est sous la main dès l’accueil', () => {
    const vue = partir()
    expect([...vue.querySelectorAll('.onglet')].map((o) => o.textContent)).toEqual(['Accueil', 'Apprendre', 'Passeport', 'Réglages'])
    clic(parLabel(vue, t.guide.ouvrir))
    expect(vue.textContent).toContain(t.guide.sousTitre)
  })

  it('le bouton retour du téléphone ferme l’écran ouvert au lieu de quitter l’app', () => {
    const pose = vi.spyOn(window.history, 'pushState')
    const vue = partir()
    expect(pose).not.toHaveBeenCalled()
    clic(parLabel(vue, t.guide.ouvrir))
    // Une entrée posée pour l'écran ouvert…
    expect(pose).toHaveBeenCalledTimes(1)
    expect(pose.mock.calls[0][0]).toEqual({ rihla: 1 })
    // … que le retour reprend : le guide se ferme, l'accueil est là.
    retourSysteme(null)
    expect(vue.textContent).not.toContain(t.guide.sousTitre)
    expect(vue.querySelector('.carte-depart')).not.toBeNull()
    // Un retour de plus n'est pas pour nous : rien ne bouge.
    retourSysteme(null)
    expect(vue.querySelector('.carte-depart')).not.toBeNull()
  })

  it('fermé par sa croix, l’écran reprend lui-même son entrée dans l’historique', () => {
    const reprise = vi.spyOn(window.history, 'go').mockImplementation(() => {})
    const vue = partir()
    clic(parLabel(vue, t.guide.ouvrir))
    clic(parLabel(vue, t.fermer))
    expect(reprise).toHaveBeenCalledWith(-1)
    expect(vue.querySelector('.carte-depart')).not.toBeNull()
  })

  it('l’accueil offre l’aide seulement quand on sait l’ouvrir', () => {
    const surGuide = vi.fn()
    const avec = monter(<Accueil t={t} locale="fr" progres={progresInitial()} surGuide={surGuide} surDestination={() => {}} surLecon={() => {}} surDefi={() => {}} surCarnet={() => {}} surBarid={() => {}} />)
    clic(avec.querySelector('.bouton-aide'))
    expect(surGuide).toHaveBeenCalledTimes(1)
    const sans = monter(<Accueil t={t} locale="fr" progres={progresInitial()} surDestination={() => {}} surLecon={() => {}} surDefi={() => {}} surCarnet={() => {}} surBarid={() => {}} />)
    expect(sans.querySelector('.bouton-aide')).toBeNull()
  })
})

describe('une destination, sans rien chercher', () => {
  const apprendre = (progres, props = {}) =>
    monter(<Apprendre t={t} locale="fr" source="fr" progres={progres} langue={es} surLecon={() => {}} surJeu={() => {}} {...props} />)

  it('on change de destination sur place', () => {
    const surDestination = vi.fn()
    const vue = apprendre(progresInitial(), { surDestination })
    const villes = [...vue.querySelectorAll('.rangee-destinations button')]
    // Les quinze villes, et pas « toute la route » : ici on apprend UNE langue.
    expect(villes).toHaveLength(LANGUES.length)
    expect(vue.querySelector('.rangee-destinations').getAttribute('aria-label')).toBe(t.changerDestination)
    expect(villes.filter((b) => b.getAttribute('aria-pressed') === 'true').map((b) => b.textContent)).toEqual(['ESGrenade'])
    clic(villes.find((b) => b.textContent.includes('Paris')))
    expect(surDestination).toHaveBeenCalledWith(fr)
    // Toucher la ville où l'on est déjà ne fait rien.
    clic(villes[0])
    expect(surDestination).toHaveBeenCalledTimes(1)
  })

  it('le sommaire mène aux étapes, aux mots voyageurs et aux jeux', () => {
    const vue = apprendre(progresInitial())
    const liens = [...vue.querySelectorAll('.sommaire__lien')]
    expect(liens.map((l) => l.textContent)).toEqual([t.sommaire.etapes, t.sommaire.voyageurs, t.sommaire.jeux])
    for (const id of ['etapes', 'voyageurs', 'jeux']) expect(vue.querySelector(`#${id}`), id).not.toBeNull()
    clic(liens[2])
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(1)
    expect(Element.prototype.scrollIntoView.mock.contexts[0].id).toBe('jeux')
  })

  it('l’étape à suivre est la première qui reste à valider — elle seule, et elle le dit', () => {
    let progres = progresInitial()
    const aSuivre = (p) => [...apprendre(p).querySelectorAll('.carte-etape--a-suivre')]
    expect(aSuivre(progres).map((c) => c.textContent)).toEqual([`Salutations${t.etapeNumero(1)} · ${t.motsCompte(8)}${t.aSuivre}`])
    // La deuxième validée, la première ratée : c'est toujours la première.
    progres = enregistrerEtape(progres, 'es', 'enroute', 8, 8, '2026-09-27').progres
    progres = enregistrerEtape(progres, 'es', 'salutations', 2, 8, '2026-09-27').progres
    const cartes = aSuivre(progres)
    expect(cartes).toHaveLength(1)
    expect(cartes[0].textContent).toContain('Salutations')
    expect(cartes[0].getAttribute('aria-current')).toBe('step')
    // Tout validé : plus rien à suivre.
    for (const lecon of es.lecons) progres = enregistrerEtape(progres, 'es', lecon.id, 8, 8, '2026-09-27').progres
    expect(aSuivre(progres)).toHaveLength(0)
  })
})

describe('une étape, sans la perdre', () => {
  const lecon = (surQuitter) =>
    monter(<Lecon t={t} locale="fr" source="fr" langue={es} lecon={es.lecons[0]} surTerminer={() => ({})} surSuivante={() => {}} surQuitter={surQuitter} />)

  it('on peut passer les cartes et aller droit aux questions', () => {
    const vue = lecon(() => {})
    expect(vue.querySelector('.carte-mot')).not.toBeNull()
    clic(bouton(vue, t.passerAuQuiz))
    expect(vue.querySelector('.carte-mot')).toBeNull()
    expect(vue.textContent).toContain('1/8')
    expect(bouton(vue, t.passerAuQuiz)).toBeUndefined()
  })

  it('tant qu’on n’a pas répondu, la croix ferme sans rien demander', () => {
    const surQuitter = vi.fn()
    const vue = lecon(surQuitter)
    clic(bouton(vue, t.passerAuQuiz))
    clic(parLabel(vue, t.quitterLecon))
    expect(surQuitter).toHaveBeenCalledTimes(1)
    expect(vue.querySelector('.feuille')).toBeNull()
  })

  it('une fois qu’on a répondu, elle demande — et « Continuer » garde l’étape', () => {
    const surQuitter = vi.fn()
    const vue = lecon(surQuitter)
    clic(bouton(vue, t.passerAuQuiz))
    clic(vue.querySelector('.option, .lettre'))
    clic(parLabel(vue, t.quitterLecon))
    expect(surQuitter).not.toHaveBeenCalled()
    const feuille = vue.querySelector('.feuille')
    expect(feuille.getAttribute('role')).toBe('alertdialog')
    expect(feuille.getAttribute('aria-modal')).toBe('true')
    expect(document.getElementById(feuille.getAttribute('aria-labelledby')).textContent).toBe(t.quitter.titreLecon)
    expect(document.getElementById(feuille.getAttribute('aria-describedby')).textContent).toBe(t.quitter.texteLecon)
    // Le choix sûr est le bouton principal, et c'est lui qui a le focus.
    expect(document.activeElement.textContent).toBe(t.quitter.rester)
    expect(document.activeElement.classList.contains('bouton--primaire')).toBe(true)
    clic(document.activeElement)
    expect(vue.querySelector('.feuille')).toBeNull()
    expect(surQuitter).not.toHaveBeenCalled()
    expect(vue.textContent).toContain('1/8')
    // Et « Quitter » quitte.
    clic(parLabel(vue, t.quitterLecon))
    clic(bouton(vue.querySelector('.feuille'), t.quitter.partir))
    expect(surQuitter).toHaveBeenCalledTimes(1)
  })

  it('Échap et un toucher hors de la feuille la referment ; le focus tourne entre ses deux boutons', () => {
    const vue = lecon(() => {})
    clic(bouton(vue, t.passerAuQuiz))
    clic(vue.querySelector('.option, .lettre'))
    const touche = (key) => act(() => document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })))
    clic(parLabel(vue, t.quitterLecon))
    touche('Tab')
    expect(document.activeElement.textContent).toBe(t.quitter.partir)
    touche('Tab')
    expect(document.activeElement.textContent).toBe(t.quitter.rester)
    touche('Escape')
    expect(vue.querySelector('.feuille')).toBeNull()
    // Le focus revient à la croix.
    expect(document.activeElement.getAttribute('aria-label')).toBe(t.quitterLecon)
    clic(parLabel(vue, t.quitterLecon))
    clic(vue.querySelector('.voile'))
    expect(vue.querySelector('.feuille')).toBeNull()
  })

  it('le bouton retour du téléphone pose la même question, et la referme au second appui', () => {
    const demander = () => {
      let resultat
      act(() => {
        resultat = window.dispatchEvent(new Event(EVENEMENT_RETOUR, { cancelable: true }))
      })
      return resultat
    }
    const vue = lecon(() => {})
    // Rien à perdre : l'écran ne retient personne.
    expect(demander()).toBe(true)
    clic(bouton(vue, t.passerAuQuiz))
    clic(vue.querySelector('.option, .lettre'))
    // Une réponse donnée : le retour est retenu, la question posée.
    expect(demander()).toBe(false)
    expect(vue.querySelector('.feuille')).not.toBeNull()
    expect(demander()).toBe(false)
    expect(vue.querySelector('.feuille')).toBeNull()
  })

  it('dans l’app, le retour du téléphone en pleine étape ne la ferme pas', () => {
    localStorage.setItem('rihla.cap', 'route')
    localStorage.setItem('rihla.langue', 'fr')
    const pose = vi.spyOn(window.history, 'pushState')
    const vue = monter(<App />)
    clic(vue.querySelector('.carte-depart'))
    expect(pose).toHaveBeenCalledTimes(1)
    clic(bouton(vue, t.passerAuQuiz))
    clic(vue.querySelector('.option, .lettre'))
    retourSysteme(null)
    // L'étape est toujours là, la question est posée, et l'entrée reprise par
    // le navigateur a été reposée — le retour suivant nous reviendra.
    expect(vue.querySelector('.feuille')).not.toBeNull()
    expect(vue.textContent).toContain('1/8')
    expect(pose).toHaveBeenCalledTimes(2)
    expect(pose.mock.calls[1][0]).toEqual({ rihla: 1 })
  })

  it('un jeu parle de sa partie, pas d’une étape', () => {
    const vue = monter(<BoutonQuitter t={t} aPerdre jeu surQuitter={() => {}} />)
    clic(parLabel(vue, t.fermer))
    expect(vue.querySelector('.feuille').textContent).toContain(t.quitter.titreJeu)
    expect(vue.querySelector('.feuille').textContent).toContain(t.quitter.texteJeu)
  })
})

describe('les Réglages, rangés', () => {
  it('quatre sections titrées, chacune avec ses cartes', () => {
    const vue = monter(
      <Reglages
        t={t}
        locale="fr"
        surLocale={() => {}}
        theme="auto"
        surTheme={() => {}}
        sourceChoix="auto"
        surSource={() => {}}
        objectifJour={20}
        surObjectif={() => {}}
        libelleCap="La route"
        surChangerCap={() => {}}
        surGuide={() => {}}
        progres={progresInitial()}
        surRestaurer={() => {}}
        surEffacer={() => {}}
      />
    )
    const sections = [...vue.querySelectorAll('.titre-section')]
    expect(sections.map((s) => s.textContent)).toEqual([t.reglagesSections.voyage, t.reglagesSections.affichage, t.reglagesSections.aide, t.aPropos])
    // L'ordre du texte suit les sections : le cap avant la langue, le guide après.
    const texte = vue.textContent
    const rang = (mot) => texte.indexOf(mot)
    expect(rang(t.reglagesSections.voyage)).toBeLessThan(rang(t.cap.reglage))
    expect(rang(t.objectif.titre)).toBeLessThan(rang(t.reglagesSections.affichage))
    expect(rang(t.reglagesSections.affichage)).toBeLessThan(rang(t.langueInterface))
    expect(rang(t.apparence.titre)).toBeLessThan(rang(t.reglagesSections.aide))
    expect(rang(t.reglagesSections.aide)).toBeLessThan(rang(t.sauvegarde.titre))
    expect(rang(t.partager.titre)).toBeGreaterThan(rang(t.sauvegarde.titre))
    // L'effacement reste tout en bas, à part.
    expect(rang(t.effacer)).toBeGreaterThan(rang(t.faitAuMaroc))
    // Un titre par niveau : h1 pour l'écran, h2 pour les sections.
    expect(vue.querySelectorAll('h1')).toHaveLength(1)
    for (const s of sections) expect(s.tagName).toBe('H2')
  })
})

describe('pour qui arrive', () => {
  const accueil = (props) =>
    monter(<Accueil t={t} locale="fr" progres={progresInitial()} surDestination={() => {}} surLecon={() => {}} surDefi={() => {}} surCarnet={() => {}} surBarid={() => {}} {...props} />)

  it('l’accueil explique l’app en trois lignes, juste sous le bouton qu’elles expliquent', () => {
    const surGuide = vi.fn()
    const surFermerBienvenue = vi.fn()
    const vue = accueil({ bienvenue: true, surGuide, surFermerBienvenue })
    const carte = vue.querySelector('.bienvenue')
    expect(carte.querySelector('h2').textContent).toBe(t.bienvenue.titre)
    expect([...carte.querySelectorAll('li')].map((li) => li.textContent)).toEqual(t.bienvenue.points.map((p, i) => `${i + 1}${p}`))
    // Après la carte de départ, avant le reste.
    const ordre = [...vue.querySelectorAll('.carte-depart, .bienvenue')].map((e) => e.className.split(' ')[0])
    expect(ordre).toEqual(['carte-depart', 'carte'])
    clic(bouton(carte, t.bienvenue.guide))
    expect(surGuide).toHaveBeenCalledTimes(1)
    clic(bouton(carte, t.bienvenue.fermer))
    expect(surFermerBienvenue).toHaveBeenCalledTimes(1)
    expect(accueil({ bienvenue: false }).querySelector('.bienvenue')).toBeNull()
  })

  it('dans l’app : « J’ai compris » la range pour de bon, et une étape jouée aussi', () => {
    localStorage.setItem('rihla.cap', 'route')
    localStorage.setItem('rihla.langue', 'fr')
    let vue = monter(<App />)
    expect(vue.querySelector('.bienvenue')).not.toBeNull()
    clic(bouton(vue.querySelector('.bienvenue'), t.bienvenue.fermer))
    expect(vue.querySelector('.bienvenue')).toBeNull()
    expect(localStorage.getItem('rihla.bienvenue')).toBe('vu')
    // Au lancement suivant, elle ne revient pas.
    expect(monter(<App />).querySelector('.bienvenue')).toBeNull()

    // Jamais rangée, mais une étape déjà jouée : elle n'a plus rien à apprendre à personne.
    localStorage.removeItem('rihla.bienvenue')
    localStorage.setItem('rihla.progres.v1', JSON.stringify(enregistrerEtape(progresInitial(), 'es', 'salutations', 8, 8, '2026-09-27').progres))
    vue = monter(<App />)
    expect(vue.querySelector('.carte-depart')).not.toBeNull()
    expect(vue.querySelector('.bienvenue')).toBeNull()
  })

  it('le guide se parcourt par ses titres : des sections qu’on ouvre, la première déjà ouverte', () => {
    localStorage.setItem('rihla.cap', 'route')
    localStorage.setItem('rihla.langue', 'fr')
    const vue = monter(<App />)
    clic(parLabel(vue, t.guide.ouvrir))
    const sections = [...vue.querySelectorAll('details.guide-section')]
    expect(sections).toHaveLength(t.guide.sections.length)
    expect(sections.map((s) => s.querySelector('summary').textContent)).toEqual(t.guide.sections.map((s) => s.t))
    expect(sections.map((s) => s.open)).toEqual(sections.map((_, i) => i === 0))
    // Le texte de chaque section est là, replié ou non : rien n'a été coupé.
    sections.forEach((s, i) => expect(s.querySelector('p').textContent).toBe(t.guide.sections[i].d))
  })
})

describe('effacer et remplacer, sans boîte du système', () => {
  const reglages = (props) =>
    monter(
      <Reglages
        t={t}
        locale="fr"
        surLocale={() => {}}
        theme="auto"
        surTheme={() => {}}
        sourceChoix="auto"
        surSource={() => {}}
        objectifJour={20}
        surObjectif={() => {}}
        libelleCap="La route"
        surChangerCap={() => {}}
        surGuide={() => {}}
        progres={progresInitial()}
        surRestaurer={() => {}}
        surEffacer={() => {}}
        {...props}
      />
    )

  beforeEach(() => {
    window.confirm = vi.fn(() => {
      throw new Error('window.confirm ne doit plus être appelé')
    })
  })

  it('effacer pose la question dans l’app : le choix sûr d’abord, et lui seul a le focus', () => {
    const surEffacer = vi.fn()
    const vue = reglages({ surEffacer })
    clic(bouton(vue, t.effacer))
    expect(surEffacer).not.toHaveBeenCalled()
    const feuille = vue.querySelector('.feuille')
    expect(feuille.getAttribute('role')).toBe('alertdialog')
    expect(feuille.textContent).toContain(t.effacement.titre)
    expect(feuille.textContent).toContain(t.effacement.texte)
    expect([...feuille.querySelectorAll('button')].map((b) => b.textContent)).toEqual([t.effacement.garder, t.effacement.effacer])
    expect(document.activeElement.textContent).toBe(t.effacement.garder)
    // Garder : rien n'est effacé.
    clic(document.activeElement)
    expect(vue.querySelector('.feuille')).toBeNull()
    expect(surEffacer).not.toHaveBeenCalled()
    // Tout effacer : c'est fait, et la feuille se referme.
    clic(bouton(vue, t.effacer))
    clic(bouton(vue.querySelector('.feuille'), t.effacement.effacer))
    expect(surEffacer).toHaveBeenCalledTimes(1)
    expect(vue.querySelector('.feuille')).toBeNull()
    expect(window.confirm).not.toHaveBeenCalled()
  })

  it('un voyage effacé s’annonce près du pouce, avec de quoi le reprendre', () => {
    const surReprendre = vi.fn()
    const vue = reglages({ surReprendre })
    const annonce = vue.querySelector('[role="status"].annonce')
    expect(annonce.textContent).toBe(`${t.effacement.fait}${t.effacement.reprendre}`)
    clic(annonce.querySelector('.annonce__action'))
    expect(surReprendre).toHaveBeenCalledTimes(1)
    // Rien à annoncer : la région reste montée, vide, pour les lecteurs d'écran.
    const calme = reglages({})
    expect(calme.querySelector('.annonce')).toBeNull()
    expect(calme.querySelector('[role="status"].lecteur-seul').textContent).toBe('')
  })

  it('dans l’app : tout effacer, puis « Annuler » — le voyage revient tel quel', () => {
    vi.useFakeTimers()
    const voyage = enregistrerEtape(progresInitial(), 'es', 'salutations', 8, 8, '2026-09-27').progres
    localStorage.setItem('rihla.cap', 'route')
    localStorage.setItem('rihla.langue', 'fr')
    localStorage.setItem('rihla.progres.v1', JSON.stringify(voyage))
    const vue = monter(<App />)
    const garde = () => JSON.parse(localStorage.getItem('rihla.progres.v1'))
    clic(vue.querySelectorAll('.onglet')[3])
    clic(bouton(vue, t.effacer))
    clic(bouton(vue.querySelector('.feuille'), t.effacement.effacer))
    expect(garde().xp).toBe(0)
    expect(garde().etapes).toEqual({})
    clic(vue.querySelector('.annonce__action'))
    expect(garde().xp).toBe(voyage.xp)
    expect(garde().etapes).toEqual(voyage.etapes)
    expect(vue.querySelector('.annonce')).toBeNull()

    // Effacé de nouveau, et le temps passe : il n'y a plus rien à reprendre.
    clic(bouton(vue, t.effacer))
    clic(bouton(vue.querySelector('.feuille'), t.effacement.effacer))
    expect(vue.querySelector('.annonce__action')).not.toBeNull()
    act(() => vi.advanceTimersByTime(DELAI_REPRISE + 50))
    expect(vue.querySelector('.annonce')).toBeNull()
    expect(garde().xp).toBe(0)
    vi.useRealTimers()
  })

  it('restaurer une sauvegarde demande avant de remplacer le voyage en cours', () => {
    const surRestaurer = vi.fn()
    const sauvegarde = exporterProgres(enregistrerEtape(progresInitial(), 'tr', 'salutations', 7, 8, '2026-09-27').progres, '2026-09-27')
    const vue = reglages({ surRestaurer })
    clic(bouton(vue, t.sauvegarde.restaurer))
    const zone = vue.querySelector('textarea')
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(zone, sauvegarde)
      zone.dispatchEvent(new Event('input', { bubbles: true }))
    })
    clic(bouton(vue, t.sauvegarde.valider))
    expect(surRestaurer).not.toHaveBeenCalled()
    const feuille = vue.querySelector('.feuille')
    expect(feuille.textContent).toContain(t.remplacement.titre)
    expect(document.activeElement.textContent).toBe(t.remplacement.garder)
    clic(bouton(feuille, t.remplacement.remplacer))
    expect(surRestaurer).toHaveBeenCalledTimes(1)
    expect(Object.keys(surRestaurer.mock.calls[0][0].etapes)).toEqual(['tr:salutations'])
    expect(vue.querySelector('.feuille')).toBeNull()
    expect(vue.querySelector('.annonce').textContent).toBe(t.sauvegarde.succes)
    expect(window.confirm).not.toHaveBeenCalled()
  })
})
