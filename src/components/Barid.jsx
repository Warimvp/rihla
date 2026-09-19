import { useEffect, useState } from 'react'
import { LANGUES, langueParId, nomLangue } from '../data/langues.js'
import {
  NB_QUESTIONS_BARID,
  TOUTE_LA_ROUTE,
  bilanBarid,
  construireBarid,
  decoderLettre,
  encoderLettre,
  estBonneOption,
  lienLettre,
  nettoyerNom,
  nouvelleGraine,
  verdict,
} from '../lib/barid.js'
import { fanfare, retourReponse } from '../lib/sons.js'
import { parler } from '../lib/tts.js'
import { nomVoyageur, reglerNom } from '../lib/voyageur.js'
import { Boussole, Croix, Etoile8, LettreIcone } from './Icones.jsx'
import { ChoixDestination } from './Communs.jsx'
import { EclatEtoiles } from './EclatEtoiles.jsx'
import { QuestionDuel } from './QuestionDuel.jsx'

const IDS = LANGUES.map((l) => l.id)

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
 * Le Barid — le duel à distance. Trois moments, un seul écran :
 *   • le comptoir : on choisit une destination et on joue ses 10 questions,
 *     ou on colle un défi reçu ;
 *   • la lettre reçue : qui défie, avec quel score, et le verdict d'une
 *     réponse à l'un de nos propres défis ;
 *   • la partie, puis le bilan d'où part la lettre (partage natif, sinon
 *     presse-papiers, sinon le texte à sélectionner).
 * Toute la logique (tirage, verdict, encodage, progrès) vit dans lib/barid.js.
 */
export function Barid({
  t,
  locale,
  source,
  progres,
  lettre = null,
  erreurInitiale = null,
  langueId = TOUTE_LA_ROUTE,
  surTerminer,
  surReponseRecue,
  surQuitter,
}) {
  const [phase, setPhase] = useState(lettre ? 'recu' : 'comptoir')
  const [recu, setRecu] = useState(lettre)
  const [nom, setNom] = useState(() => nomVoyageur())
  const [destination, setDestination] = useState(langueId)
  const [zone, setZone] = useState('')
  const [erreur, setErreur] = useState(erreurInitiale)
  const [partie, setPartie] = useState(null)
  const [iQuestion, setIQuestion] = useState(0)
  const [choix, setChoix] = useState(null)
  const [score, setScore] = useState(0)
  const [debut, setDebut] = useState(0)
  const [maintenant, setMaintenant] = useState(0)
  const [bilan, setBilan] = useState(null)
  const [message, setMessage] = useState(null)
  const [texteVisible, setTexteVisible] = useState(null)

  const total = NB_QUESTIONS_BARID
  const nomPropre = nettoyerNom(nom)
  const nomAffiche = nomPropre || t.barid.anonyme
  const nomDestination = (id) => (id === TOUTE_LA_ROUTE ? t.barid.touteLaRoute : nomLangue(langueParId(id), locale))
  const titreVerdict = (v) => (v === 'gagne' ? t.barid.gagne : v === 'perdu' ? t.barid.perdu : t.barid.egalite)

  // Une réponse à l'un de nos défis : le verdict s'inscrit dès l'ouverture,
  // même si on referme sans jouer la relance.
  useEffect(() => {
    if (lettre?.re) surReponseRecue(lettre.re, lettre.n)
  }, [])

  useEffect(() => {
    if (phase !== 'jeu') return undefined
    const id = setInterval(() => setMaintenant(Date.now()), 1000)
    return () => clearInterval(id)
  }, [phase])

  const annoncer = (texte) => {
    setMessage(texte)
    setTimeout(() => setMessage(null), 3500)
  }

  const ouvrirLettre = (texte) => {
    const resultat = decoderLettre(texte, IDS)
    if (!resultat.ok) {
      setErreur(resultat.erreur)
      return
    }
    setErreur(null)
    setZone('')
    if (resultat.lettre.re) surReponseRecue(resultat.lettre.re, resultat.lettre.n)
    setRecu(resultat.lettre)
    setPhase('recu')
  }

  const commencer = ({ graine, langueId: l, adversaire = null, riposteDe = null }) => {
    setPartie({ graine, langueId: l, questions: construireBarid(LANGUES, l, graine), adversaire, riposteDe })
    setIQuestion(0)
    setChoix(null)
    setScore(0)
    setBilan(null)
    setMessage(null)
    setTexteVisible(null)
    const top = Date.now()
    setDebut(top)
    setMaintenant(top)
    setPhase('jeu')
  }

  const question = partie?.questions[iQuestion]

  const choisir = (option) => {
    if (choix || !question) return
    const bonne = estBonneOption(question, option)
    setChoix(option)
    if (bonne) setScore(score + 1)
    retourReponse(bonne)
    parler(question.mot.t, question.langue.tts)
  }

  const continuer = () => {
    if (iQuestion + 1 < partie.questions.length) {
      setIQuestion(iQuestion + 1)
      setChoix(null)
      return
    }
    const temps = Math.max(0, Math.round((Date.now() - debut) / 1000))
    const resultat = surTerminer({ graine: partie.graine, langueId: partie.langueId, score, temps, adversaire: partie.adversaire })
    if (resultat.verdict !== 'perdu') fanfare()
    setBilan({ ...resultat, score, temps })
    setPhase('fin')
  }

  // Partage natif quand il existe (WhatsApp est à un geste), sinon le
  // presse-papiers, sinon le texte affiché à sélectionner soi-même.
  const envoyer = async (contenu, texte, { copierSeulement = false } = {}) => {
    const url = lienLettre(encoderLettre(contenu))
    const complet = `${texte} ${url}`
    try {
      if (!copierSeulement && typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: 'Rihla', text: texte, url })
        return
      }
      await navigator.clipboard.writeText(complet)
      annoncer(t.barid.copie)
    } catch (e) {
      if (e?.name === 'AbortError') return
      setTexteVisible(complet)
      annoncer(t.barid.echecCopie)
    }
  }

  const entete = (titre, extra = null) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button type="button" onClick={surQuitter} aria-label={t.fermer} style={boutonFermer}>
        <Croix taille={22} trait={2.2} />
      </button>
      <span style={{ flex: '1 1 auto', fontSize: 15.5, fontWeight: 600 }}>{titre}</span>
      {extra}
    </div>
  )

  const chipResultat = (qui, s, temps, accent) => (
    <span className="chip" style={{ background: accent ? 'var(--majorelle-pale)' : 'var(--sable)', color: accent ? 'var(--majorelle-fonce)' : 'var(--encre)', minHeight: 30 }}>
      {qui} · {t.barid.resultat(s, total, temps)}
    </span>
  )

  // ————— Le comptoir —————
  if (phase === 'comptoir') {
    const compte = bilanBarid(progres)
    return (
      <div className="vue" style={{ gap: 16 }}>
        {entete(t.barid.titre)}

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center' }}>
          <span style={{ color: 'var(--majorelle-fonce)' }}>
            <LettreIcone taille={56} trait={1.4} />
          </span>
          <h1 style={{ fontSize: 26 }}>{t.barid.sousTitre}</h1>
          <p className="texte-2" style={{ fontSize: 13.5, maxWidth: '36ch', lineHeight: 1.6 }}>{t.barid.intro}</p>
          {compte.joues > 0 ? (
            <span className="chip chip--menthe" style={{ minHeight: 28 }}>{t.barid.bilan(compte.gagnes, compte.perdus, compte.egalites)}</span>
          ) : null}
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
              onChange={(e) => {
                setNom(e.target.value)
                reglerNom(e.target.value)
              }}
              style={champ}
            />
          </label>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 14.5, fontWeight: 600 }}>{t.barid.destination}</span>
            <ChoixDestination t={t} locale={locale} valeur={destination} surChoisir={setDestination} />
          </div>

          <button
            type="button"
            className="bouton bouton--primaire bouton--pleine"
            onClick={() => commencer({ graine: nouvelleGraine(), langueId: destination })}
          >
            {t.barid.lancer}
          </button>
          <p className="texte-2" style={{ fontSize: 12.5, textAlign: 'center' }}>{t.barid.sansAmi}</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ flex: '1 1 auto', height: 1, background: 'var(--ligne)' }}></span>
          <span className="texte-2" style={{ fontSize: 13 }}>{t.barid.ou}</span>
          <span style={{ flex: '1 1 auto', height: 1, background: 'var(--ligne)' }}></span>
        </div>

        <div className="carte" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span style={{ fontSize: 14.5, fontWeight: 600 }}>{t.barid.relever}</span>
          <textarea
            value={zone}
            onChange={(e) => {
              setZone(e.target.value)
              setErreur(null)
            }}
            placeholder={t.barid.coller}
            rows={3}
            style={{ ...champ, fontSize: 12.5, resize: 'vertical' }}
          />
          <button type="button" className="bouton bouton--secondaire bouton--pleine" onClick={() => ouvrirLettre(zone)}>
            {t.barid.ouvrir}
          </button>
          <p role="status" className={erreur ? 'texte-2' : 'lecteur-seul'} style={{ fontSize: 12.5, color: 'var(--terracotta-fonce)' }}>
            {erreur ? (t.barid.erreurs[erreur] ?? t.barid.erreurs.abime) : ''}
          </p>
        </div>
      </div>
    )
  }

  // ————— La lettre reçue —————
  if (phase === 'recu' && recu) {
    const nomAdv = recu.n || t.barid.anonyme
    const re = recu.re
    const verdictRecu = re ? verdict({ s: re.s0, t: re.t0 }, { s: re.s, t: re.t }) : null
    const locale_ = progres.barid?.[recu.g]
    // Son propre lien, rouvert : rien à relever, on le renvoie à un ami.
    const mienne = Boolean(recu.g && locale_ && !locale_.adv && locale_.s === recu.s && locale_.t === recu.t)
    return (
      <div className="vue" style={{ gap: 16 }}>
        {entete(t.barid.titre)}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center' }}>
          <span style={{ color: 'var(--majorelle-fonce)' }}>
            <LettreIcone taille={56} trait={1.4} />
          </span>
          <h1 style={{ fontSize: 26 }}>{re ? t.barid.reponseDe(nomAdv) : t.barid.defiDe(nomAdv)}</h1>
        </div>

        {re ? (
          <div className="carte" style={{ padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <span className="surtitre">{nomDestination(re.l)}</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
              {chipResultat(nomAdv, re.s, re.t, false)}
              {chipResultat(t.barid.toi, re.s0, re.t0, true)}
            </div>
            <span className={`chip ${couleurVerdict[verdictRecu]}`}>{titreVerdict(verdictRecu)}</span>
          </div>
        ) : null}

        {recu.g ? (
          <div className="carte" style={{ padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, borderColor: 'var(--majorelle)', borderWidth: 1.5 }}>
            {re ? <span style={{ fontSize: 15, fontWeight: 600 }}>{t.barid.teRelance(nomAdv)}</span> : null}
            <span className="surtitre">{nomDestination(recu.l)}</span>
            <span className="chip chip--safran">
              {t.barid.aBattre} · {t.barid.resultat(recu.s, total, recu.t)}
            </span>
            {mienne ? <p className="texte-2" style={{ fontSize: 13 }}>{t.barid.tonPropre}</p> : null}
          </div>
        ) : null}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {recu.g && !mienne ? (
            <button
              type="button"
              className="bouton bouton--primaire bouton--pleine"
              onClick={() => commencer({ graine: recu.g, langueId: recu.l, adversaire: { n: recu.n, s: recu.s, t: recu.t } })}
            >
              {t.barid.releve}
            </button>
          ) : (
            <button
              type="button"
              className="bouton bouton--primaire bouton--pleine"
              onClick={() => {
                setDestination(re?.l ?? recu.l ?? destination)
                setPhase('comptoir')
              }}
            >
              {t.barid.relancer}
            </button>
          )}
          <button type="button" className="bouton bouton--fantome bouton--pleine" onClick={surQuitter}>
            {t.barid.plusTard}
          </button>
        </div>
      </div>
    )
  }

  // ————— Le bilan, d'où part la lettre —————
  if (phase === 'fin' && bilan && partie) {
    const { adversaire, riposteDe } = partie
    const v = bilan.verdict
    const titre = adversaire ? titreVerdict(v) : riposteDe ? t.barid.finRiposte : t.barid.finDefi
    const sousTitre = adversaire ? null : riposteDe ? t.barid.finRiposteSub : t.barid.finDefiSub
    const couleur = v === 'perdu' ? 'var(--terracotta)' : v === 'gagne' ? 'var(--menthe)' : v === 'egal' ? 'var(--safran)' : 'var(--majorelle)'
    const langueTexte = nomDestination(partie.langueId)
    const lettreDefi = { n: nomPropre, l: partie.langueId, g: partie.graine, s: bilan.score, t: bilan.temps }
    const lettreResultat = adversaire
      ? { n: nomPropre, re: { l: partie.langueId, g: partie.graine, s: bilan.score, t: bilan.temps, s0: adversaire.s, t0: adversaire.t } }
      : null
    const lettreRiposte = riposteDe ? { ...lettreDefi, re: riposteDe } : null
    const texteDefi = t.barid.message.defi(nomAffiche, bilan.score, total, bilan.temps, langueTexte)
    const texteResultat = adversaire ? t.barid.message.resultat(nomAffiche, bilan.score, total, bilan.temps) : null
    const texteRiposte = riposteDe
      ? t.barid.message.riposte(nomAffiche, riposteDe.s, total, riposteDe.t, bilan.score, bilan.temps, langueTexte)
      : null
    const aEnvoyer = lettreRiposte ? [lettreRiposte, texteRiposte] : [lettreDefi, texteDefi]
    return (
      <div className="vue vue--pleine" style={{ alignItems: 'center', justifyContent: 'center', gap: 16, textAlign: 'center' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 120, height: 120 }}>
          {v !== 'perdu' ? <EclatEtoiles /> : null}
          <span className="tampon--anime" style={{ display: 'inline-flex' }}>
            <Etoile8 taille={84} couleur={couleur} />
          </span>
        </div>
        <h1 style={{ fontSize: 27 }}>{titre}</h1>
        {sousTitre ? <p className="texte-2" style={{ maxWidth: '32ch', fontSize: 13.5, lineHeight: 1.6 }}>{sousTitre}</p> : null}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
          {chipResultat(t.barid.toi, bilan.score, bilan.temps, true)}
          {adversaire ? chipResultat(adversaire.n || t.barid.anonyme, adversaire.s, adversaire.t, false) : null}
        </div>
        {bilan.xpGagne > 0 ? <span className="chip chip--safran">{t.plusXp(bilan.xpGagne)}</span> : null}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', marginTop: 6 }}>
          {adversaire ? (
            <>
              <button
                type="button"
                className="bouton bouton--primaire bouton--pleine"
                onClick={() =>
                  commencer({
                    graine: nouvelleGraine(),
                    langueId: partie.langueId,
                    riposteDe: { l: partie.langueId, g: partie.graine, s: bilan.score, t: bilan.temps, s0: adversaire.s, t0: adversaire.t },
                  })
                }
              >
                {t.barid.riposter}
              </button>
              <button type="button" className="bouton bouton--secondaire bouton--pleine" onClick={() => envoyer(lettreResultat, texteResultat)}>
                {t.barid.envoyerResultat}
              </button>
            </>
          ) : (
            <>
              <button type="button" className="bouton bouton--primaire bouton--pleine" onClick={() => envoyer(...aEnvoyer)}>
                {lettreRiposte ? t.barid.envoyerRiposte : t.barid.envoyer}
              </button>
              <button type="button" className="bouton bouton--secondaire bouton--pleine" onClick={() => envoyer(...aEnvoyer, { copierSeulement: true })}>
                {t.barid.copierLien}
              </button>
            </>
          )}
          <button type="button" className="bouton bouton--fantome bouton--pleine" onClick={surQuitter}>
            {t.barid.terminer}
          </button>
        </div>
        <p role="status" className={message ? 'texte-2' : 'lecteur-seul'} style={{ fontSize: 12.5 }}>
          {message ?? ''}
        </p>
        {texteVisible ? (
          <textarea readOnly value={texteVisible} rows={4} onFocus={(e) => e.target.select()} style={{ ...champ, fontSize: 12.5, resize: 'vertical' }} />
        ) : null}
      </div>
    )
  }

  // ————— La partie —————
  const ecoule = Math.max(0, Math.floor((maintenant - debut) / 1000))
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
          <button type="button" onClick={surQuitter} aria-label={t.fermer} style={boutonFermer}>
            <Croix taille={22} trait={2.2} />
          </button>
          <div className="piste-progres" style={{ flex: '1 1 auto', height: 8 }}>
            <div className="piste-progres__barre" style={{ width: `${((iQuestion + 1) / total) * 100}%`, height: 8 }}></div>
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--encre-2)', flex: '0 0 auto' }}>
            {iQuestion + 1}/{total}
          </span>
          <span className="chip" style={{ minHeight: 26, padding: '0 10px', background: 'var(--sable)', fontVariantNumeric: 'tabular-nums', flex: '0 0 auto' }}>
            {t.barid.chrono(ecoule)}
          </span>
        </div>
      }
      sousEnTete={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span className="surtitre">
            {t.barid.titre} · {nomDestination(partie?.langueId)}
          </span>
          {partie?.adversaire ? (
            <span className="chip chip--safran" style={{ minHeight: 26 }}>
              {t.barid.aBattre} · {t.barid.resultat(partie.adversaire.s, total, partie.adversaire.t)}
            </span>
          ) : null}
        </div>
      }
    />
  )
}
