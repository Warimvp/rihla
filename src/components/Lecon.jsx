import { useMemo, useState } from 'react'
import { sensPour } from '../i18n.js'
import { nomLangue, nomVille, titreLecon } from '../data/langues.js'
import { construireQuiz, estBonne } from '../lib/quiz.js'
import { parler } from '../lib/tts.js'
import { Coche, Croix, Etoile8, HautParleur } from './Icones.jsx'
import { TamponVisa } from './TamponVisa.jsx'
import { EclatEtoiles } from './EclatEtoiles.jsx'

export function Lecon({ t, locale, source, langue, lecon, indexLangue, surTerminer, surQuitter }) {
  const [phase, setPhase] = useState('cartes')
  const [tour, setTour] = useState(0)
  const [iCarte, setICarte] = useState(0)
  const [retournee, setRetournee] = useState(false)
  const questions = useMemo(() => construireQuiz(lecon.mots), [lecon, tour])
  const [iQuestion, setIQuestion] = useState(0)
  const [choix, setChoix] = useState(null)
  const [score, setScore] = useState(0)
  const [bilan, setBilan] = useState(null)

  const mots = lecon.mots
  const total = questions.length

  const rejouer = () => {
    setPhase('cartes')
    setTour(tour + 1)
    setICarte(0)
    setRetournee(false)
    setIQuestion(0)
    setChoix(null)
    setScore(0)
    setBilan(null)
  }

  const suivantCarte = () => {
    if (iCarte + 1 < mots.length) {
      setICarte(iCarte + 1)
      setRetournee(false)
    } else {
      setPhase('quiz')
    }
  }

  const choisir = (option) => {
    if (choix) return
    setChoix(option)
    if (estBonne(questions[iQuestion], option)) setScore(score + 1)
    parler(questions[iQuestion].mot.t, langue.tts)
  }

  const continuerQuiz = () => {
    if (iQuestion + 1 < total) {
      setIQuestion(iQuestion + 1)
      setChoix(null)
    } else {
      setBilan(surTerminer(score, total))
      setPhase('fin')
    }
  }

  const fraction = phase === 'cartes' ? (iCarte + 1) / mots.length : (iQuestion + 1) / total

  if (phase === 'fin' && bilan) {
    return (
      <div className="vue vue--pleine" style={{ alignItems: 'center', justifyContent: 'center', gap: 18, textAlign: 'center' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 180, height: 180 }}>
          {bilan.valide ? <EclatEtoiles nombre={bilan.nouveauVisa ? 14 : 10} /> : null}
          {bilan.nouveauVisa ? (
            <div style={{ width: 180, height: 180 }}>
              <TamponVisa langue={langue} index={indexLangue} locale={locale} anime />
            </div>
          ) : (
            <span className={bilan.valide ? 'tampon--anime' : undefined} style={{ display: 'inline-flex' }}>
              <Etoile8 taille={84} couleur={bilan.valide ? 'var(--safran)' : 'var(--ligne-2)'} />
            </span>
          )}
        </div>
        <h1 style={{ fontSize: 27 }}>
          {bilan.nouveauVisa ? t.visaDecroche(nomVille(langue, locale)) : bilan.valide ? t.etapeValidee : t.mauvaiseReponse}
        </h1>
        <p className="texte-2">{t.scoreSur(score, total)}</p>
        <span className="chip chip--safran">{t.plusXp(bilan.xpGagne)}</span>
        {!bilan.valide ? <p className="texte-2" style={{ maxWidth: '30ch' }}>{t.etapeRatee}</p> : null}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', marginTop: 10 }}>
          <button type="button" className="bouton bouton--primaire bouton--pleine" onClick={surQuitter}>
            {t.retourEtapes}
          </button>
          <button type="button" className="bouton bouton--secondaire bouton--pleine" onClick={rejouer}>
            {t.rejouer}
          </button>
        </div>
      </div>
    )
  }

  const question = questions[iQuestion]
  const bonne = question ? question.options.find((o) => estBonne(question, o)) : null

  return (
    <div className="vue vue--pleine" style={{ gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          type="button"
          onClick={surQuitter}
          aria-label={t.quitterLecon}
          style={{
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
          }}
        >
          <Croix taille={22} trait={2.2} />
        </button>
        <div className="piste-progres" style={{ flex: '1 1 auto', height: 8 }}>
          <div className="piste-progres__barre" style={{ width: `${fraction * 100}%`, height: 8 }}></div>
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--encre-2)', flex: '0 0 auto' }}>
          {phase === 'cartes' ? `${iCarte + 1}/${mots.length}` : `${iQuestion + 1}/${total}`}
        </span>
      </div>

      <span className="surtitre">
        {nomLangue(langue, locale)} · {titreLecon(lecon, locale)}
      </span>

      {phase === 'cartes' ? (
        <>
          <div
            className={`carte-mot ${retournee ? 'carte-mot--retournee' : ''}`}
            onClick={() => setRetournee(!retournee)}
            style={{ flex: '0 0 auto', cursor: 'pointer' }}
          >
            <div className="carte-mot__interieur">
              <div className="carte-mot__face carte-mot__face--recto">
                <button
                  type="button"
                  className="bouton bouton--rond"
                  aria-label={t.ecouter}
                  onClick={(e) => {
                    e.stopPropagation()
                    parler(mots[iCarte].t, langue.tts)
                  }}
                >
                  <HautParleur taille={24} trait={1.8} />
                </button>
                <div className="mot-cible">{mots[iCarte].t}</div>
                {mots[iCarte].r ? <div className="romanisation">{mots[iCarte].r}</div> : null}
              </div>
              <div className="carte-mot__face carte-mot__face--verso fond-zellige" style={{ borderRadius: 'var(--r-carte)' }}>
                <div className="mot-cible" style={{ color: 'var(--papier)', fontSize: 27 }}>
                  {sensPour(mots[iCarte], source, langue.id)}
                </div>
                <div style={{ fontSize: 14, color: 'var(--sur-majorelle)' }}>{mots[iCarte].t}</div>
              </div>
            </div>
          </div>
          <div style={{ flex: '1 1 auto' }}></div>
          {!retournee ? (
            <button
              type="button"
              className="bouton bouton--primaire bouton--pleine"
              onClick={() => {
                setRetournee(true)
                parler(mots[iCarte].t, langue.tts)
              }}
            >
              {t.voirReponse}
            </button>
          ) : (
            <button type="button" className="bouton bouton--primaire bouton--pleine" onClick={suivantCarte}>
              {t.suivant}
            </button>
          )}
        </>
      ) : (
        <>
          <div
            className="carte"
            style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, flex: '0 0 auto' }}
          >
            {question.type === 'comprendre' ? (
              <>
                <button
                  type="button"
                  className="bouton bouton--rond"
                  aria-label={t.ecouter}
                  onClick={() => parler(question.mot.t, langue.tts)}
                >
                  <HautParleur taille={24} trait={1.8} />
                </button>
                <div className="mot-cible">{question.mot.t}</div>
                {question.mot.r ? <div className="romanisation">{question.mot.r}</div> : null}
              </>
            ) : (
              <div className="mot-cible" style={{ fontFamily: 'var(--police-titre)' }}>{sensPour(question.mot, source, langue.id)}</div>
            )}
          </div>
          <p style={{ fontSize: 15, fontWeight: 500 }}>
            {question.type === 'comprendre' ? t.promptComprendre : t.promptProduire(nomLangue(langue, locale))}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {question.options.map((option) => {
              const revele = choix !== null
              const estCorrecte = revele && estBonne(question, option)
              const estFausse = revele && option === choix && !estBonne(question, option)
              const classe = estCorrecte
                ? 'option option--correcte anim-pop'
                : estFausse
                  ? 'option option--fausse anim-secouer'
                  : 'option'
              return (
                <button key={option.id} type="button" className={classe} disabled={revele} onClick={() => choisir(option)}>
                  <span>
                    {question.type === 'comprendre' ? sensPour(option, source, langue.id) : option.t}
                    {question.type === 'produire' && option.r ? (
                      <span className="romanisation" style={{ marginInlineStart: 8 }}>{option.r}</span>
                    ) : null}
                  </span>
                  {estCorrecte ? <Coche taille={20} trait={2.4} /> : null}
                  {estFausse ? <Croix taille={20} trait={2.4} /> : null}
                </button>
              )
            })}
          </div>
          <div style={{ flex: '1 1 auto' }}></div>
          {choix !== null ? (
            <>
              <div className={`bandeau-reponse ${estBonne(question, choix) ? 'bandeau-reponse--bonne' : 'bandeau-reponse--mauvaise'}`}>
                <span
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 999,
                    background: estBonne(question, choix) ? 'var(--menthe)' : 'var(--terracotta)',
                    color: 'var(--papier)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: '0 0 auto',
                  }}
                >
                  {estBonne(question, choix) ? <Coche taille={16} trait={2.6} /> : <Croix taille={16} trait={2.6} />}
                </span>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>
                    {estBonne(question, choix) ? t.bonneReponse : t.mauvaiseReponse}
                  </span>
                  <span style={{ fontSize: 12.5 }}>
                    {estBonne(question, choix)
                      ? t.encoreQuestions(total - iQuestion - 1)
                      : `${t.laBonneEtait} ${question.type === 'comprendre' ? sensPour(bonne, source, langue.id) : bonne.t}`}
                  </span>
                </span>
              </div>
              <button type="button" className="bouton bouton--primaire bouton--pleine" onClick={continuerQuiz}>
                {t.continuer}
              </button>
            </>
          ) : null}
        </>
      )}
    </div>
  )
}
