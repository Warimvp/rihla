import { useEffect, useState } from 'react'
import { LANGUES, langueParId } from './data/langues.js'
import { defaultLocale, getDictionary, getDirection, locales } from './i18n.js'
import {
  ajouterXp,
  chargerProgres,
  enregistrerDefi,
  enregistrerEtape,
  jourLocal,
  progresInitial,
  sauverProgres,
  visaObtenu,
} from './lib/progression.js'
import { ajouterAuCarnet, reviserMot } from './lib/carnet.js'
import { Accueil } from './components/Accueil.jsx'
import { Apprendre } from './components/Apprendre.jsx'
import { Lecon } from './components/Lecon.jsx'
import { Passeport } from './components/Passeport.jsx'
import { Reglages } from './components/Reglages.jsx'
import { BarreOnglets } from './components/Communs.jsx'
import { Carnet } from './components/Carnet.jsx'
import { Defi } from './components/Defi.jsx'
import { JeuCaravane } from './components/JeuCaravane.jsx'
import { JeuDuel } from './components/JeuDuel.jsx'
import { JeuOreille } from './components/JeuOreille.jsx'
import { JeuSouk } from './components/JeuSouk.jsx'
import { JeuZellige } from './components/JeuZellige.jsx'

const JEUX = { zellige: JeuZellige, souk: JeuSouk, caravane: JeuCaravane, oreille: JeuOreille, duel: JeuDuel }

const lireLocal = (cle, defaut) => {
  try {
    return localStorage.getItem(cle) ?? defaut
  } catch {
    return defaut
  }
}

const ecrireLocal = (cle, valeur) => {
  try {
    localStorage.setItem(cle, valeur)
  } catch {
    // Stockage indisponible (navigation privée…) : l'app fonctionne sans persistance.
  }
}

export default function App() {
  const [locale, setLocale] = useState(() => {
    const l = lireLocal('rihla.langue', defaultLocale)
    return locales.includes(l) ? l : defaultLocale
  })
  const t = getDictionary(locale)

  useEffect(() => {
    document.documentElement.lang = locale
    document.documentElement.dir = getDirection(locale)
    ecrireLocal('rihla.langue', locale)
  }, [locale])

  const [theme, setTheme] = useState(() => {
    const choix = lireLocal('rihla.theme', 'auto')
    return ['clair', 'auto', 'sombre'].includes(choix) ? choix : 'auto'
  })

  // L'« auto » est natif : sans attribut, le media query CSS et les deux
  // balises theme-color suivent le système tout seuls. L'attribut (et
  // l'écrasement des theme-color) ne sert qu'aux choix explicites.
  useEffect(() => {
    if (theme === 'auto') delete document.documentElement.dataset.theme
    else document.documentElement.dataset.theme = theme
    const metas = document.querySelectorAll('meta[name="theme-color"]')
    for (const meta of metas) {
      if (theme === 'auto') {
        meta.setAttribute('content', meta.getAttribute('media')?.includes('dark') ? '#171210' : '#4E46C8')
      } else {
        meta.setAttribute('content', theme === 'sombre' ? '#171210' : '#4E46C8')
      }
    }
    ecrireLocal('rihla.theme', theme)
  }, [theme])

  // Langue des définitions (indépendante de la langue de l'interface) :
  // « anglais → arabe » = interface FR, définitions AR, par exemple.
  const [sourceChoix, setSourceChoix] = useState(() => {
    const s = lireLocal('rihla.source', 'auto')
    return ['auto', 'fr', 'ar'].includes(s) ? s : 'auto'
  })
  const source = sourceChoix === 'auto' ? locale : sourceChoix
  useEffect(() => {
    ecrireLocal('rihla.source', sourceChoix)
  }, [sourceChoix])

  const [progres, setProgres] = useState(() => chargerProgres())
  const [onglet, setOnglet] = useState('carte')
  const [destinationId, setDestinationId] = useState(() => lireLocal('rihla.destination', LANGUES[0].id))
  const [leconActive, setLeconActive] = useState(null)
  const [jeuActif, setJeuActif] = useState(null)
  const [defiActif, setDefiActif] = useState(false)
  const [carnetActif, setCarnetActif] = useState(null)

  useEffect(() => {
    ecrireLocal('rihla.destination', destinationId)
  }, [destinationId])

  const majProgres = (p) => {
    setProgres(p)
    sauverProgres(p)
  }

  const ouvrirDestination = (langue) => {
    setDestinationId(langue.id)
    setOnglet('apprendre')
  }

  const ouvrirLecon = (langue, lecon) => {
    setDestinationId(langue.id)
    setLeconActive({ langueId: langue.id, leconId: lecon.id })
  }

  const effacer = () => {
    if (window.confirm(t.confirmEffacer)) majProgres(progresInitial())
  }

  if (carnetActif) {
    return (
      <div className="app">
        <Carnet
          t={t}
          locale={locale}
          source={source}
          progresInitialSession={carnetActif.progresDepart}
          surReponse={(langueId, motId, bonne) => majProgres(reviserMot(progres, langueId, motId, bonne, jourLocal()))}
          surTerminer={(xp) => {
            if (xp > 0) majProgres(ajouterXp(progres, xp))
          }}
          surQuitter={() => setCarnetActif(null)}
        />
      </div>
    )
  }

  if (defiActif) {
    const terminerDefi = (score, total) => {
      const resultat = enregistrerDefi(progres, score, total)
      majProgres(resultat.progres)
      return resultat
    }
    return (
      <div className="app">
        <Defi t={t} locale={locale} source={source} surTerminer={terminerDefi} surQuitter={() => setDefiActif(false)} />
      </div>
    )
  }

  if (jeuActif) {
    const langue = langueParId(jeuActif.langueId)
    const Jeu = JEUX[jeuActif.type]
    return (
      <div className="app">
        <Jeu
          t={t}
          locale={locale}
          source={source}
          langue={langue}
          surXp={(montant) => majProgres(ajouterXp(progres, montant))}
          surQuitter={() => setJeuActif(null)}
        />
      </div>
    )
  }

  if (leconActive) {
    const langue = langueParId(leconActive.langueId)
    const lecon = langue.lecons.find((l) => l.id === leconActive.leconId)
    const terminer = (score, total) => {
      const visaAvant = visaObtenu(progres, langue)
      const resultat = enregistrerEtape(progres, langue.id, lecon.id, score, total)
      const progresFinal = resultat.valide
        ? ajouterAuCarnet(resultat.progres, langue.id, lecon.mots, jourLocal())
        : resultat.progres
      majProgres(progresFinal)
      return {
        xpGagne: resultat.xpGagne,
        valide: resultat.valide,
        nouveauVisa: visaObtenu(progresFinal, langue) && !visaAvant,
      }
    }
    return (
      <div className="app">
        <Lecon
          t={t}
          locale={locale}
          source={source}
          langue={langue}
          lecon={lecon}
          indexLangue={LANGUES.indexOf(langue)}
          surTerminer={terminer}
          surQuitter={() => {
            setLeconActive(null)
            setOnglet('apprendre')
          }}
        />
      </div>
    )
  }

  const destination = langueParId(destinationId) ?? LANGUES[0]

  return (
    <div className="app">
      {onglet === 'carte' ? (
        <Accueil
          t={t}
          locale={locale}
          progres={progres}
          surDestination={ouvrirDestination}
          surLecon={ouvrirLecon}
          surDefi={() => setDefiActif(true)}
          surCarnet={() => setCarnetActif({ progresDepart: progres })}
        />
      ) : null}
      {onglet === 'apprendre' ? (
        <Apprendre
          t={t}
          locale={locale}
          progres={progres}
          langue={destination}
          surLecon={ouvrirLecon}
          surJeu={(type) => setJeuActif({ type, langueId: destination.id })}
        />
      ) : null}
      {onglet === 'passeport' ? <Passeport t={t} locale={locale} progres={progres} /> : null}
      {onglet === 'reglages' ? (
        <Reglages
          t={t}
          locale={locale}
          surLocale={setLocale}
          theme={theme}
          surTheme={setTheme}
          sourceChoix={sourceChoix}
          surSource={setSourceChoix}
          surEffacer={effacer}
        />
      ) : null}
      <BarreOnglets actif={onglet} sur={setOnglet} t={t} />
    </div>
  )
}
