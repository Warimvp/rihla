import { useEffect, useRef, useState } from 'react'
import { LANGUES, langueParId, nomLangue } from '../data/langues.js'
import { NB_QUESTIONS_BARID, TOUTE_LA_ROUTE, construireBarid, estBonneOption } from '../lib/barid.js'
import { etatClientInitial, normaliserCode, reduireClient } from '../lib/salle.js'
import {
  chercherAdversaire as chercherParDefaut,
  creerSalle as creerParDefaut,
  enLigneActif,
  lienSalle,
  ouvrirSalle as ouvrirParDefaut,
} from '../lib/enligne.js'
import { identite, reglerNom } from '../lib/voyageur.js'
import { fanfare, retourReponse } from '../lib/sons.js'
import { parler } from '../lib/tts.js'
import { CoupeIcone, CourseIcone, Croix, Etoile8 } from './Icones.jsx'
import { ChoixDestination } from './Communs.jsx'
import { EclatEtoiles } from './EclatEtoiles.jsx'
import { ConsentementEnLigne } from './EnLigne.jsx'
import { QuestionDuel } from './QuestionDuel.jsx'

const TRANSPORT_PAR_DEFAUT = { creerSalle: creerParDefaut, ouvrirSalle: ouvrirParDefaut, chercherAdversaire: chercherParDefaut }

const champ = {
  width: '100%',
  boxSizing: 'border-box',
  borderRadius: 14,
  border: '1.5px solid var(--ligne)',
  background: 'var(--sable)',
  color: 'var(--encre)',
  padding: 12,
  fontSize: 14,
  fontFamily: 'var(--police-ui)',
}

const boutonFermer = {
  width: 44,
  height: 44,
  marginInlineStart: -11,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: 'var(--encre-2)',
  flex: '0 0 auto',
}

const couleurVerdict = { gagne: 'chip--menthe', perdu: 'chip--terracotta', egal: 'chip--safran' }

/**
 * La Course — le duel en direct. Deux voyageurs dans une salle (code à cinq
 * caractères, partagé par lien, ou tirés au sort par le hall), les mêmes dix
 * questions en même temps ; le serveur note et chronomètre (src/lib/salle.js
 * est la règle, serveur/ la fait tourner). L'écran n'a que trois moments à
 * lui — le comptoir, la recherche, l'erreur — le reste suit l'état que le
 * serveur envoie (`reduireClient`).
 */
export function Course({
  t,
  locale,
  source,
  langueId = TOUTE_LA_ROUTE,
  codeInitial = null,
  surTerminer,
  surClassement,
  surQuitter,
  transport = TRANSPORT_PAR_DEFAUT,
}) {
  const voyageur = identite()
  const [phase, setPhase] = useState('intro') // intro | consentement | recherche | salle | erreur
  const [destination, setDestination] = useState(langueId)
  const [nom, setNom] = useState(voyageur.nom)
  const [codeSaisi, setCodeSaisi] = useState('')
  const [code, setCode] = useState(null)
  const [salle, setSalle] = useState(etatClientInitial)
  const [questions, setQuestions] = useState([])
  const [iQuestion, setIQuestion] = useState(0)
  const [choix, setChoix] = useState(null)
  const [score, setScore] = useState(0)
  const [compte, setCompte] = useState(0)
  const [pret, setPret] = useState(false)
  const [termine, setTermine] = useState(false)
  const [revancheDemandee, setRevancheDemandee] = useState(false)
  const [bilan, setBilan] = useState(null)
  const [erreur, setErreur] = useState(null)
  const [message, setMessage] = useState(null)
  const connexion = useRef(null)
  const hall = useRef(null)
  const phaseRef = useRef(phase)
  const langueRef = useRef(langueId)
  const suite = useRef(null) // l'action reprise après le consentement
  const graineInscrite = useRef(null)

  const total = NB_QUESTIONS_BARID
  const nomAffiche = nom || t.barid.anonyme
  const nomDestination = (id) => (id === TOUTE_LA_ROUTE ? t.barid.touteLaRoute : nomLangue(langueParId(id), locale))
  const moi = salle.joueurs.find((j) => j.id === voyageur.id) ?? null
  const autre = salle.joueurs.find((j) => j.id !== voyageur.id) ?? null
  const nomAutre = autre?.nom || t.course.adversaire

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  // Tout se ferme avec l'écran.
  useEffect(
    () => () => {
      connexion.current?.fermer()
      hall.current?.fermer()
    },
    []
  )

  const annoncer = (texte) => {
    setMessage(texte)
    setTimeout(() => setMessage(null), 3500)
  }

  // Rien ne part sans le consentement : l'action attend derrière l'écran.
  const demarrer = (action) => {
    if (enLigneActif()) return action()
    suite.current = action
    setPhase('consentement')
  }

  const enregistrerFin = (m) => {
    const moiFin = m.joueurs.find((j) => j.id === voyageur.id)
    const autreFin = m.joueurs.find((j) => j.id !== voyageur.id) ?? null
    if (!moiFin || graineInscrite.current === m.graine) return
    graineInscrite.current = m.graine
    const resultat = surTerminer({
      graine: m.graine,
      langueId: langueRef.current,
      score: moiFin.score,
      temps: moiFin.temps,
      adversaire: autreFin ? { n: autreFin.nom, s: autreFin.score, t: autreFin.temps } : null,
      verdictImpose: moiFin.verdict,
    })
    if (moiFin.verdict !== 'perdu') fanfare()
    setBilan({ ...resultat, moi: moiFin, autre: autreFin })
  }

  const surMessage = (m) => {
    setSalle((s) => reduireClient(s, m))
    if (m.type === 'salle' || m.type === 'depart' || m.type === 'reprise') langueRef.current = m.langue
    if (m.type === 'depart') {
      setQuestions(construireBarid(LANGUES, m.langue, m.graine))
      setIQuestion(0)
      setChoix(null)
      setScore(0)
      setPret(false)
      setTermine(false)
      setRevancheDemandee(false)
      setBilan(null)
      setCompte(Math.max(1, Math.ceil(m.dans / 1000)))
    } else if (m.type === 'reprise') {
      setQuestions(construireBarid(LANGUES, m.langue, m.graine))
      setIQuestion(Math.min(m.i, total - 1))
      setChoix(null)
      setScore(m.score)
      setPret(true)
      setTermine(m.i >= total)
    } else if (m.type === 'fin') {
      enregistrerFin(m)
    } else if (m.type === 'erreur' && m.code === 'pleine') {
      connexion.current?.fermer()
      setErreur('pleine')
      setPhase('erreur')
    }
  }

  const rejoindre = (brut) => {
    const propre = normaliserCode(brut)
    if (!propre) {
      setErreur('code')
      return
    }
    connexion.current?.fermer()
    setErreur(null)
    setCode(propre)
    setSalle(etatClientInitial())
    setBilan(null)
    graineInscrite.current = null
    setPhase('salle')
    connexion.current = transport.ouvrirSalle(
      propre,
      { id: voyageur.id, nom: identite().nom },
      {
        surMessage,
        surFermeture: ({ voulu }) => {
          if (voulu || phaseRef.current !== 'salle') return
          setSalle((s) => {
            if (s.phase === 'fin') return s
            setErreur(s.phase === 'connexion' ? 'introuvable' : 'connexion')
            setPhase('erreur')
            return s
          })
        },
      }
    )
  }

  const creer = async () => {
    setErreur(null)
    setPhase('salle')
    setSalle(etatClientInitial())
    try {
      const { code: nouveau } = await transport.creerSalle(destination)
      rejoindre(nouveau)
    } catch {
      setErreur('serveur')
      setPhase('erreur')
    }
  }

  const chercher = () => {
    setErreur(null)
    setPhase('recherche')
    hall.current?.fermer()
    hall.current = transport.chercherAdversaire(
      destination,
      { id: voyageur.id, nom: identite().nom },
      {
        surMessage: (m) => {
          if (m.type === 'salle') {
            hall.current?.fermer()
            rejoindre(m.code)
          } else if (m.type === 'erreur') {
            hall.current?.fermer()
            setErreur(m.code === 'personne' ? 'personne' : 'serveur')
            setPhase('intro')
          }
        },
        surFermeture: ({ voulu }) => {
          if (voulu || phaseRef.current !== 'recherche') return
          setErreur('connexion')
          setPhase('intro')
        },
      }
    )
  }

  const annulerRecherche = () => {
    hall.current?.fermer()
    setPhase('intro')
  }

  const quitterSalle = () => {
    connexion.current?.fermer()
    setPhase('intro')
  }

  useEffect(() => {
    if (codeInitial) demarrer(() => rejoindre(codeInitial))
  }, [])

  // Le compte à rebours : le serveur dit « dans 3 s », on égrène localement.
  useEffect(() => {
    if (salle.phase !== 'compte' || pret) return undefined
    if (compte <= 0) {
      setPret(true)
      return undefined
    }
    const id = setTimeout(() => setCompte((c) => c - 1), 1000)
    return () => clearTimeout(id)
  }, [salle.phase, compte, pret])

  const question = questions[iQuestion]

  const choisir = (option) => {
    if (choix || !question || termine) return
    const bonne = estBonneOption(question, option)
    setChoix(option)
    if (bonne) setScore(score + 1)
    retourReponse(bonne)
    parler(question.mot.t, question.langue.tts)
    connexion.current?.envoyer({ type: 'repondre', i: iQuestion, optionId: option.id })
  }

  const continuer = () => {
    if (iQuestion + 1 < questions.length) {
      setIQuestion(iQuestion + 1)
      setChoix(null)
    } else {
      setTermine(true)
    }
  }

  const demanderRevanche = () => {
    connexion.current?.envoyer({ type: 'revanche' })
    setRevancheDemandee(true)
  }

  const partagerCode = async ({ copierSeulement = false } = {}) => {
    const texte = t.course.messageInvitation(nomAffiche, code)
    const url = lienSalle(code)
    try {
      if (!copierSeulement && typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: 'Rihla', text: texte, url })
        return
      }
      await navigator.clipboard.writeText(`${texte} ${url}`)
      annoncer(t.course.copie)
    } catch (e) {
      if (e?.name !== 'AbortError') annoncer(t.barid.echecCopie)
    }
  }

  const entete = (titre, surFermer = surQuitter) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button type="button" onClick={surFermer} aria-label={t.fermer} style={boutonFermer}>
        <Croix taille={22} trait={2.2} />
      </button>
      <span style={{ flex: '1 1 auto', fontSize: 15.5, fontWeight: 600 }}>{titre}</span>
    </div>
  )

  const barreJoueur = (etiquette, j, couleur) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 12.5, fontWeight: 600, color: couleur, minWidth: '6ch', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '10ch' }}>{etiquette}</span>
      <div className="piste-progres" style={{ flex: '1 1 auto', height: 8 }}>
        <div className="piste-progres__barre" style={{ width: `${((j?.i ?? 0) / total) * 100}%`, height: 8, background: couleur }}></div>
      </div>
      <span style={{ fontSize: 12.5, fontWeight: 700, fontVariantNumeric: 'tabular-nums', minWidth: '3ch', textAlign: 'end' }}>{j?.score ?? 0}</span>
    </div>
  )

  const barres = (
    <div className="carte" style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6, flex: '0 0 auto' }}>
      {barreJoueur(t.course.toi, moi, 'var(--majorelle-fonce)')}
      {barreJoueur(nomAutre, autre, 'var(--terracotta-fonce)')}
    </div>
  )

  const zoneErreur = (
    <p role="status" className={erreur ? 'texte-2' : 'lecteur-seul'} style={{ fontSize: 12.5, color: 'var(--terracotta-fonce)', textAlign: 'center' }}>
      {erreur ? (t.course.erreurs[erreur] ?? t.enligne.horsLigne) : ''}
    </p>
  )

  // ————— Le consentement —————
  if (phase === 'consentement') {
    return (
      <ConsentementEnLigne
        t={t}
        surActiver={() => {
          const action = suite.current
          suite.current = null
          setPhase('intro')
          action?.()
        }}
        surRefuser={surQuitter}
      />
    )
  }

  // ————— Le comptoir —————
  if (phase === 'intro') {
    return (
      <div className="vue" style={{ gap: 16 }}>
        {entete(t.course.titre)}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center' }}>
          <span style={{ color: 'var(--majorelle-fonce)' }}>
            <CourseIcone taille={56} trait={1.4} />
          </span>
          <h1 style={{ fontSize: 26 }}>{t.course.sousTitre}</h1>
          <p className="texte-2" style={{ fontSize: 13.5, maxWidth: '36ch', lineHeight: 1.6 }}>{t.course.intro}</p>
        </div>

        <div className="carte" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 14.5, fontWeight: 600 }}>{t.barid.nom}</span>
            <input
              type="text"
              value={nom}
              maxLength={24}
              placeholder={t.barid.nomPlaceholder}
              autoComplete="nickname"
              onChange={(e) => setNom(reglerNom(e.target.value))}
              style={champ}
            />
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 14.5, fontWeight: 600 }}>{t.barid.destination}</span>
            <ChoixDestination t={t} locale={locale} valeur={destination} surChoisir={setDestination} />
          </div>
          <button type="button" className="bouton bouton--primaire bouton--pleine" onClick={() => demarrer(chercher)}>
            {t.course.hasard}
          </button>
          <button type="button" className="bouton bouton--secondaire bouton--pleine" onClick={() => demarrer(creer)}>
            {t.course.creer}
          </button>
        </div>

        <div className="carte" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span style={{ fontSize: 14.5, fontWeight: 600 }}>{t.course.rejoindre}</span>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              type="text"
              value={codeSaisi}
              placeholder={t.course.codePlaceholder}
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              onChange={(e) => {
                setCodeSaisi(e.target.value)
                setErreur(null)
              }}
              style={{ ...champ, flex: '1 1 auto', letterSpacing: 2, fontWeight: 600, textTransform: 'uppercase' }}
            />
            <button type="button" className="bouton bouton--secondaire" style={{ flex: '0 0 auto', padding: '0 16px' }} onClick={() => demarrer(() => rejoindre(codeSaisi))}>
              {t.course.entrer}
            </button>
          </div>
        </div>

        {zoneErreur}

        <button type="button" className="bouton bouton--fantome bouton--pleine" onClick={surClassement}>
          <CoupeIcone taille={18} trait={2} /> {t.classement.titre}
        </button>
      </div>
    )
  }

  // ————— La recherche d'un adversaire —————
  if (phase === 'recherche') {
    return (
      <div className="vue vue--pleine" style={{ alignItems: 'center', justifyContent: 'center', gap: 18, textAlign: 'center' }}>
        <span className="tampon--anime" style={{ display: 'inline-flex', color: 'var(--majorelle)' }}>
          <Etoile8 taille={64} couleur="var(--majorelle)" />
        </span>
        <h1 style={{ fontSize: 26 }}>{t.course.recherche}</h1>
        <p className="texte-2" style={{ fontSize: 13.5, maxWidth: '32ch' }}>{nomDestination(destination)}</p>
        <button type="button" className="bouton bouton--fantome bouton--pleine" style={{ marginTop: 10 }} onClick={annulerRecherche}>
          {t.course.annuler}
        </button>
      </div>
    )
  }

  // ————— Une erreur —————
  if (phase === 'erreur') {
    return (
      <div className="vue vue--pleine" style={{ alignItems: 'center', justifyContent: 'center', gap: 18, textAlign: 'center' }}>
        <Etoile8 taille={64} couleur="var(--terracotta)" />
        <h1 style={{ fontSize: 24, maxWidth: '20ch' }}>{t.course.erreurs[erreur] ?? t.enligne.horsLigne}</h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', marginTop: 10 }}>
          {code && erreur === 'connexion' ? (
            <button type="button" className="bouton bouton--primaire bouton--pleine" onClick={() => rejoindre(code)}>
              {t.course.reessayer}
            </button>
          ) : null}
          <button type="button" className="bouton bouton--secondaire bouton--pleine" onClick={() => setPhase('intro')}>
            {t.course.retour}
          </button>
        </div>
      </div>
    )
  }

  // ————— Dans la salle —————
  if (salle.phase === 'connexion' || salle.phase === 'attente') {
    return (
      <div className="vue" style={{ gap: 16 }}>
        {entete(t.course.titre, quitterSalle)}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center', marginTop: 8 }}>
          <span className="surtitre">{t.course.salle}</span>
          <div style={{ fontFamily: 'var(--police-titre)', fontSize: 44, letterSpacing: 6, color: 'var(--majorelle-fonce)', direction: 'ltr' }} aria-label={code ?? ''}>
            {code ?? '·····'}
          </div>
          <p className="texte-2" style={{ fontSize: 13.5 }}>{nomDestination(salle.langue ?? destination)}</p>
          <span className="chip chip--safran">{salle.phase === 'connexion' ? t.course.connexion : t.course.attenteAdversaire}</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
            {salle.joueurs.map((j) => (
              <span key={j.id} className="chip" style={{ background: j.id === voyageur.id ? 'var(--majorelle-pale)' : 'var(--sable)', color: j.id === voyageur.id ? 'var(--majorelle-fonce)' : 'var(--encre)' }}>
                {j.nom || t.barid.anonyme}
              </span>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
          <button type="button" className="bouton bouton--primaire bouton--pleine" disabled={!code} onClick={() => partagerCode()}>
            {t.course.partagerCode}
          </button>
          <button type="button" className="bouton bouton--secondaire bouton--pleine" disabled={!code} onClick={() => partagerCode({ copierSeulement: true })}>
            {t.course.copierCode}
          </button>
          <button type="button" className="bouton bouton--fantome bouton--pleine" onClick={quitterSalle}>
            {t.course.annuler}
          </button>
        </div>
        <p role="status" className={message ? 'texte-2' : 'lecteur-seul'} style={{ fontSize: 12.5, textAlign: 'center' }}>
          {message ?? ''}
        </p>
      </div>
    )
  }

  if (salle.phase === 'compte' && !pret) {
    return (
      <div className="vue vue--pleine" style={{ alignItems: 'center', justifyContent: 'center', gap: 14, textAlign: 'center' }}>
        <span className="surtitre">{nomDestination(salle.langue)}</span>
        <h1 style={{ fontSize: 26 }}>{t.course.pret}</h1>
        <div key={compte} className="anim-pop" style={{ fontFamily: 'var(--police-titre)', fontSize: 96, lineHeight: 1, color: 'var(--majorelle-fonce)' }}>
          {compte}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span className="chip" style={{ background: 'var(--majorelle-pale)', color: 'var(--majorelle-fonce)' }}>{t.course.toi}</span>
          <span className="chip chip--terracotta">{nomAutre}</span>
        </div>
      </div>
    )
  }

  if (salle.phase === 'fin' && bilan) {
    const v = bilan.moi.verdict
    const couleur = v === 'perdu' ? 'var(--terracotta)' : v === 'gagne' ? 'var(--menthe)' : 'var(--safran)'
    const titre = v === 'gagne' ? t.barid.gagne : v === 'perdu' ? t.barid.perdu : t.barid.egalite
    const autreParti = autre && !autre.present
    return (
      <div className="vue vue--pleine" style={{ alignItems: 'center', justifyContent: 'center', gap: 14, textAlign: 'center' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 120, height: 120 }}>
          {v !== 'perdu' ? <EclatEtoiles /> : null}
          <span className="tampon--anime" style={{ display: 'inline-flex' }}>
            <Etoile8 taille={84} couleur={couleur} />
          </span>
        </div>
        <h1 style={{ fontSize: 27 }}>{titre}</h1>
        {bilan.autre && !bilan.autre.present && bilan.moi.verdict === 'gagne' && bilan.moi.score <= bilan.autre.score ? (
          <p className="texte-2" style={{ fontSize: 13 }}>{t.course.forfait}</p>
        ) : null}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
          <span className="chip" style={{ background: 'var(--majorelle-pale)', color: 'var(--majorelle-fonce)' }}>
            {t.course.toi} · {t.barid.resultat(bilan.moi.score, total, bilan.moi.temps)}
          </span>
          {bilan.autre ? (
            <span className="chip" style={{ background: 'var(--sable)' }}>
              {bilan.autre.nom || t.barid.anonyme} · {t.barid.resultat(bilan.autre.score, total, bilan.autre.temps)}
            </span>
          ) : null}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
          {bilan.xpGagne > 0 ? <span className="chip chip--safran">{t.plusXp(bilan.xpGagne)}</span> : null}
          <span className={`chip ${couleurVerdict[v]}`}>{t.course.points(bilan.moi.points)}</span>
        </div>
        <p role="status" className="texte-2" style={{ fontSize: 13, minHeight: 20 }}>
          {autreParti
            ? t.course.parti(nomAutre)
            : revancheDemandee
              ? t.course.revancheAttente
              : autre?.revanche
                ? t.course.veutRevanche(nomAutre)
                : ''}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', marginTop: 4 }}>
          {!autreParti && autre ? (
            <button type="button" className="bouton bouton--primaire bouton--pleine" disabled={revancheDemandee} onClick={demanderRevanche}>
              {t.course.revanche}
            </button>
          ) : null}
          <button type="button" className="bouton bouton--secondaire bouton--pleine" onClick={surClassement}>
            {t.course.classement}
          </button>
          <button type="button" className="bouton bouton--fantome bouton--pleine" onClick={surQuitter}>
            {t.course.terminer}
          </button>
        </div>
      </div>
    )
  }

  if (salle.phase === 'fin' || salle.phase === 'connexion') return null

  if (termine) {
    return (
      <div className="vue vue--pleine" style={{ gap: 16 }}>
        {entete(t.course.titre, quitterSalle)}
        {barres}
        <div style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, textAlign: 'center' }}>
          <span className="tampon--anime" style={{ display: 'inline-flex' }}>
            <Etoile8 taille={64} couleur="var(--majorelle)" />
          </span>
          <p style={{ fontSize: 15, fontWeight: 500, maxWidth: '30ch' }}>{t.course.attenteFin}</p>
          <span className="chip" style={{ background: 'var(--majorelle-pale)', color: 'var(--majorelle-fonce)' }}>
            {t.course.toi} · {score}/{total}
          </span>
        </div>
      </div>
    )
  }

  return (
    <QuestionDuel
      t={t}
      locale={locale}
      source={source}
      question={question}
      iQuestion={iQuestion}
      total={total}
      choix={choix}
      surChoisir={choisir}
      surContinuer={continuer}
      enTete={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button type="button" onClick={quitterSalle} aria-label={t.fermer} style={boutonFermer}>
            <Croix taille={22} trait={2.2} />
          </button>
          <span className="surtitre" style={{ flex: '1 1 auto' }}>
            {t.course.titre} · {nomDestination(salle.langue ?? destination)}
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--encre-2)', flex: '0 0 auto' }}>
            {iQuestion + 1}/{total}
          </span>
        </div>
      }
      sousEnTete={barres}
    />
  )
}
