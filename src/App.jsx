import { useEffect, useState } from 'react'
import { LANGUES, langueParId, nomLangue, nomVille } from './data/langues.js'
import { defaultLocale, getDictionary, getDirection, locales } from './i18n.js'
import {
  acheterGel,
  ajouterXp,
  offrirGel,
  attribuerXpDuJour,
  chargerProgres,
  enregistrerDefi,
  enregistrerEtape,
  figerAvancement,
  figerAvancements,
  jourLocal,
  prochaineEtape,
  progresInitial,
  reglerObjectif,
  sauverProgres,
  visaObtenu,
} from './lib/progression.js'
import { ajouterAuCarnet, reviserMot } from './lib/carnet.js'
import { CLE_LIEN, accuserReponse, decoderLettre, terminerBarid } from './lib/barid.js'
import { CLE_LIEN_SALLE, enLigneActif, envoyerScore } from './lib/enligne.js'
import { normaliserCode } from './lib/salle.js'
import { identite } from './lib/voyageur.js'
import { Accueil } from './components/Accueil.jsx'
import { Barid } from './components/Barid.jsx'
import { Classement } from './components/Classement.jsx'
import { Course } from './components/Course.jsx'
import { Cap } from './components/Cap.jsx'
import { Apprendre } from './components/Apprendre.jsx'
import { Lecon } from './components/Lecon.jsx'
import { Passeport } from './components/Passeport.jsx'
import { Reglages } from './components/Reglages.jsx'
import { BarreOnglets } from './components/Communs.jsx'
import { Carnet } from './components/Carnet.jsx'
import { Defi } from './components/Defi.jsx'
import { Guide } from './components/Guide.jsx'
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

// Sans stockage, un choix ne survit pas au rechargement : inutile alors de
// bloquer chaque lancement sur l'écran de cap — on suit la route par défaut.
const stockageDispo = () => {
  try {
    localStorage.setItem('rihla.test', '1')
    localStorage.removeItem('rihla.test')
    return true
  } catch {
    return false
  }
}

// Le cap est soit 'route', soit l'id d'une langue du catalogue : une valeur
// corrompue est ignorée, comme pour la locale et le thème.
const capValide = (valeur) =>
  valeur === 'route' || LANGUES.some((l) => l.id === valeur) ? valeur : null

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

  // Les voyages enregistrés avant l'historisation des visas reçoivent leurs
  // tampons et leur avancement d'après les étapes déjà validées (idempotent).
  const [progres, setProgres] = useState(() => figerAvancements(chargerProgres(), LANGUES))
  const [onglet, setOnglet] = useState('carte')
  const [destinationId, setDestinationId] = useState(() => lireLocal('rihla.destination', LANGUES[0].id))
  // Le cap : 'route' (suivre la route d'Ibn Battuta) ou l'id d'une langue.
  // null = jamais choisi → l'écran de choix s'affiche une fois.
  const [cap, setCap] = useState(() => capValide(lireLocal('rihla.cap', null)) ?? (stockageDispo() ? null : 'route'))
  const [capOuvert, setCapOuvert] = useState(false)
  const [guideOuvert, setGuideOuvert] = useState(false)
  const [leconActive, setLeconActive] = useState(null)
  const [jeuActif, setJeuActif] = useState(null)
  const [defiActif, setDefiActif] = useState(false)
  const [carnetActif, setCarnetActif] = useState(null)
  // Le Barid : { lettre, erreur, langueId } — ouvert depuis l'Accueil, les
  // jeux d'une destination, ou un lien `#barid=…` reçu d'un ami.
  const [baridActif, setBaridActif] = useState(null)
  // La Course (duel en direct) : { langueId, code?, cle } ; le Classement.
  const [courseActive, setCourseActive] = useState(null)
  const [classementActif, setClassementActif] = useState(false)

  useEffect(() => {
    ecrireLocal('rihla.destination', destinationId)
  }, [destinationId])

  // Un lien de défi (`#barid=`) ouvre la lettre, un lien de salle (`#salle=`)
  // ouvre la Course ; puis le fragment s'efface de la barre d'adresse :
  // recharger la page ne doit pas le rejouer, ni le garder dans l'historique.
  useEffect(() => {
    const lireLien = () => {
      const hash = window.location.hash
      const effacer = () => window.history.replaceState(null, '', window.location.pathname + window.location.search)
      // `cle` remonte l'écran (key) : une lettre qui arrive pendant que le
      // Barid est déjà ouvert doit s'afficher, pas rester derrière le comptoir.
      const cle = Date.now()
      if (hash.includes(`${CLE_LIEN_SALLE}=`)) {
        const code = normaliserCode(hash)
        effacer()
        if (code) setCourseActive({ code, cle })
        return
      }
      if (!hash.includes(`${CLE_LIEN}=`)) return
      const resultat = decoderLettre(hash, LANGUES.map((l) => l.id))
      effacer()
      setBaridActif(resultat.ok ? { lettre: resultat.lettre, cle } : { lettre: null, erreur: resultat.erreur, cle })
    }
    lireLien()
    window.addEventListener('hashchange', lireLien)
    return () => window.removeEventListener('hashchange', lireLien)
  }, [])

  // Point de passage unique : tout gain d'XP est attribué au jour où il tombe
  // (c'est ce qui alimente l'objectif quotidien).
  const majProgres = (p) => {
    const final = attribuerXpDuJour(progres, p)
    setProgres(final)
    sauverProgres(final)
  }

  const ouvrirDestination = (langue) => {
    setDestinationId(langue.id)
    setOnglet('apprendre')
  }

  const choisirCap = (valeur) => {
    const change = valeur !== cap
    setCap(valeur)
    ecrireLocal('rihla.cap', valeur)
    // Aligner la destination seulement sur un VRAI changement : reconfirmer le
    // cap en place ne doit pas déplacer l'onglet Apprendre en cours de lecture.
    if (change && valeur !== 'route') setDestinationId(valeur)
    setCapOuvert(false)
  }

  const ouvrirLecon = (langue, lecon) => {
    setDestinationId(langue.id)
    setLeconActive({ langueId: langue.id, leconId: lecon.id })
  }

  const effacer = () => {
    if (window.confirm(t.confirmEffacer)) majProgres(progresInitial())
  }

  if (guideOuvert) {
    return (
      <div className="app">
        <Guide t={t} surFermer={() => setGuideOuvert(false)} />
      </div>
    )
  }

  if (cap === null || capOuvert) {
    return (
      <div className="app">
        <Cap
          t={t}
          locale={locale}
          capActuel={cap ?? 'route'}
          annulable={capOuvert}
          surChoisir={choisirCap}
          surFermer={() => setCapOuvert(false)}
        />
      </div>
    )
  }

  // Une partie de duel jouée ici (Barid ou Course) : même registre, mêmes XP.
  const terminerDuel = (resultat) => {
    const bilan = terminerBarid(progres, resultat, jourLocal())
    majProgres(bilan.progres)
    return bilan
  }

  if (classementActif) {
    return (
      <div className="app">
        <Classement t={t} progres={progres} surQuitter={() => setClassementActif(false)} />
      </div>
    )
  }

  if (courseActive) {
    return (
      <div className="app">
        <Course
          key={courseActive.cle ?? 'course'}
          t={t}
          locale={locale}
          source={source}
          langueId={courseActive.langueId ?? (cap && cap !== 'route' ? cap : destinationId)}
          codeInitial={courseActive.code ?? null}
          surTerminer={terminerDuel}
          surClassement={() => setClassementActif(true)}
          surQuitter={() => setCourseActive(null)}
        />
      </div>
    )
  }

  if (baridActif) {
    return (
      <div className="app">
        <Barid
          key={baridActif.cle ?? 'comptoir'}
          t={t}
          locale={locale}
          source={source}
          progres={progres}
          lettre={baridActif.lettre}
          erreurInitiale={baridActif.erreur ?? null}
          langueId={baridActif.langueId ?? destinationId}
          surTerminer={terminerDuel}
          surReponseRecue={(re, nom) => majProgres(accuserReponse(progres, re, nom, jourLocal()))}
          surQuitter={() => setBaridActif(null)}
        />
      </div>
    )
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
    const terminerDefi = (score, total, temps) => {
      const jour = jourLocal()
      const resultat = enregistrerDefi(progres, score, total, jour, temps)
      majProgres(resultat.progres)
      // Le classement du jour, si le voyageur a activé le jeu en ligne : le
      // serveur garde le meilleur score ; un échec réseau ne gêne personne
      // (le bouton du Classement permet de renvoyer).
      if (enLigneActif()) envoyerScore(identite(), { type: 'jour', cle: jour, score, temps }).catch(() => {})
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
    const terminer = (score, total, reussis) => {
      const visaAvant = visaObtenu(progres, langue)
      const resultat = enregistrerEtape(progres, langue.id, lecon.id, score, total)
      const jour = jourLocal()
      // Le Carnet apprend des réponses de la leçon (rang 2 pour un mot réussi),
      // puis visa et km sont figés — ils ne se reprennent plus.
      const progresFinal = figerAvancement(
        resultat.valide ? ajouterAuCarnet(resultat.progres, langue.id, lecon.mots, jour, reussis) : resultat.progres,
        langue,
        jour
      )
      majProgres(progresFinal)
      // L'étape à enchaîner dans CETTE destination — jamais celle qu'on vient de
      // rater (« Rejouer » est là pour ça), jamais lancée toute seule.
      const suite = prochaineEtape(progresFinal, [langue], 'route')
      return {
        xpGagne: resultat.xpGagne,
        valide: resultat.valide,
        gelConsomme: resultat.gelConsomme,
        nouveauVisa: visaObtenu(progresFinal, langue) && !visaAvant,
        suivante: suite && suite.lecon.id !== lecon.id ? suite : null,
      }
    }
    return (
      <div className="app">
        <Lecon
          // La clé force un remontage quand on enchaîne sur l'étape suivante :
          // `questions` est mémoïsé mais phase, score et bilan ne se
          // réinitialiseraient pas d'eux-mêmes.
          key={`${langue.id}:${lecon.id}`}
          t={t}
          locale={locale}
          source={source}
          langue={langue}
          lecon={lecon}
          indexLangue={LANGUES.indexOf(langue)}
          surTerminer={terminer}
          surSuivante={(suite) => ouvrirLecon(suite.langue, suite.lecon)}
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
          surBarid={() => setBaridActif({ lettre: null, langueId: cap && cap !== 'route' ? cap : destinationId })}
          surCourse={() => setCourseActive({ langueId: cap && cap !== 'route' ? cap : destinationId })}
          surClassement={() => setClassementActif(true)}
          cap={cap ?? 'route'}
        />
      ) : null}
      {onglet === 'apprendre' ? (
        <Apprendre
          t={t}
          locale={locale}
          source={source}
          progres={progres}
          langue={destination}
          surLecon={ouvrirLecon}
          surJeu={(type) =>
            type === 'barid'
              ? setBaridActif({ lettre: null, langueId: destination.id })
              : type === 'course'
                ? setCourseActive({ langueId: destination.id })
                : setJeuActif({ type, langueId: destination.id })
          }
        />
      ) : null}
      {onglet === 'passeport' ? (
        <Passeport
          t={t}
          locale={locale}
          progres={progres}
          surAcheterGel={() => {
            const resultat = acheterGel(progres)
            if (resultat.achete) majProgres(resultat.progres)
          }}
          surNuitOfferte={(etat) => {
            // Récompense créditée seulement si la vidéo a été vue jusqu'au bout.
            if (etat === 'ok') majProgres(offrirGel(progres))
          }}
        />
      ) : null}
      {onglet === 'reglages' ? (
        <Reglages
          t={t}
          locale={locale}
          surLocale={setLocale}
          theme={theme}
          surTheme={setTheme}
          sourceChoix={sourceChoix}
          surSource={setSourceChoix}
          objectifJour={progres.objectifJour ?? 20}
          surObjectif={(objectif) => majProgres(reglerObjectif(progres, objectif))}
          libelleCap={
            cap && cap !== 'route' && langueParId(cap)
              ? `${nomVille(langueParId(cap), locale)} · ${nomLangue(langueParId(cap), locale)}`
              : t.cap.actuelRoute
          }
          surChangerCap={() => setCapOuvert(true)}
          surGuide={() => setGuideOuvert(true)}
          progres={progres}
          surRestaurer={(restaure) => {
            setProgres(restaure)
            sauverProgres(restaure)
          }}
          surEffacer={effacer}
        />
      ) : null}
      <BarreOnglets actif={onglet} sur={setOnglet} t={t} />
    </div>
  )
}
