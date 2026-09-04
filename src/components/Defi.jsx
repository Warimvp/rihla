import { useMemo, useState } from 'react'
import { sensPour } from '../i18n.js'
import { LANGUES, nomLangue } from '../data/langues.js'
import { construireDefi, estBonneOption } from '../lib/defi.js'
import { jourLocal } from '../lib/progression.js'
import { parler } from '../lib/tts.js'
import { Coche, Croix, Etoile8, HautParleur } from './Icones.jsx'
import { Pastille } from './Communs.jsx'
import { EclatEtoiles } from './EclatEtoiles.jsx'

// L'étape du jour : 10 questions, toutes les langues, même tirage pour tous.
export function Defi({ t, locale, source, surTerminer, surQuitter }) {
  const questions = useMemo(() => construireDefi(LANGUES, jourLocal()), [])
  const [iQuestion, setIQuestion] = useState(0)
  const [choix, setChoix] = useState(null)
  const [score, setScore] = useState(0)
  const [bilan, setBilan] = useState(null)

  const total = questions.length
  const question = questions[iQuestion]

  const choisir = (option) => {
    if (choix) return
    setChoix(option)
    if (estBonneOption(question, option)) setScore(score + 1)
    parler(question.mot.t, question.langue.tts)
  }

  const continuer = () => {
    if (iQuestion + 1 < total) {
      setIQuestion(iQuestion + 1)
      setChoix(null)
    } else {
      setBilan(surTerminer(score, total))
    }
  }

  if (bilan) {
    return (
      <div className="vue vue--pleine" style={{ alignItems: 'center', justifyContent: 'center', gap: 18, textAlign: 'center' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 120, height: 120 }}>
          <EclatEtoiles />
          <span className="tampon--anime" style={{ display: 'inline-flex' }}>
            <Etoile8 taille={84} couleur="var(--safran)" />
          </span>
        </div>
        <h1 style={{ fontSize: 27 }}>{t.defi.finTitre}</h1>
        <p className="texte-2">{t.scoreSur(score, total)}</p>
        {bilan.xpGagne > 0 ? <span className="chip chip--safran">{t.plusXp(bilan.xpGagne)}</span> : null}
        {bilan.serieAvancee ? <span className="chip chip--menthe">{t.defi.seriePlus}</span> : null}
        {bilan.dejaFaite ? (
          <p className="texte-2" style={{ maxWidth: '30ch', fontSize: 13 }}>{t.defi.dejaFaite}</p>
        ) : null}
        <button type="button" className="bouton bouton--primaire bouton--pleine" style={{ marginTop: 10 }} onClick={surQuitter}>
          {t.continuer}
        </button>
      </div>
    )
  }

  const bonne = question.options.find((o) => estBonneOption(question, o))

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
          <div className="piste-progres__barre" style={{ width: `${((iQuestion + 1) / total) * 100}%`, height: 8, background: 'var(--safran)' }}></div>
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--encre-2)', flex: '0 0 auto' }}>
          {iQuestion + 1}/{total}
        </span>
      </div>

      <span className="surtitre">{t.defi.titre}</span>

      <div className="carte" style={{ padding: '22px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, flex: '0 0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Pastille langue={question.langue} taille={26} />
          <span className="texte-2" style={{ fontSize: 13, fontWeight: 500 }}>{nomLangue(question.langue, locale)}</span>
        </div>
        <div className="mot-cible" style={{ fontSize: 27 }}>{question.mot.t}</div>
        {question.mot.r ? <div className="romanisation">{question.mot.r}</div> : null}
        <button type="button" className="bouton bouton--rond" style={{ width: 44, height: 44 }} aria-label={t.ecouter} onClick={() => parler(question.mot.t, question.langue.tts)}>
          <HautParleur taille={20} trait={1.8} />
        </button>
      </div>

      <p style={{ fontSize: 15, fontWeight: 500 }}>{t.promptComprendre}</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {question.options.map((option) => {
          const revele = choix !== null
          const estCorrecte = revele && estBonneOption(question, option)
          const estFausse = revele && option === choix && !estBonneOption(question, option)
          const classe = estCorrecte
            ? 'option option--correcte anim-pop'
            : estFausse
              ? 'option option--fausse anim-secouer'
              : 'option'
          return (
            <button key={option.id} type="button" className={classe} disabled={revele} onClick={() => choisir(option)}>
              <span>{sensPour(option, source, question.langue.id)}</span>
              {estCorrecte ? <Coche taille={20} trait={2.4} /> : null}
              {estFausse ? <Croix taille={20} trait={2.4} /> : null}
            </button>
          )
        })}
      </div>

      <div style={{ flex: '1 1 auto' }}></div>
      {choix !== null ? (
        <>
          <div className={`bandeau-reponse ${estBonneOption(question, choix) ? 'bandeau-reponse--bonne' : 'bandeau-reponse--mauvaise'}`}>
            <span
              style={{
                width: 30,
                height: 30,
                borderRadius: 999,
                background: estBonneOption(question, choix) ? 'var(--menthe)' : 'var(--terracotta)',
                color: 'var(--papier)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: '0 0 auto',
              }}
            >
              {estBonneOption(question, choix) ? <Coche taille={16} trait={2.6} /> : <Croix taille={16} trait={2.6} />}
            </span>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>
                {estBonneOption(question, choix) ? t.bonneReponse : t.mauvaiseReponse}
              </span>
              <span style={{ fontSize: 12.5 }}>
                {estBonneOption(question, choix)
                  ? t.encoreQuestions(total - iQuestion - 1)
                  : `${t.laBonneEtait} ${sensPour(bonne, source, question.langue.id)}`}
              </span>
            </span>
          </div>
          <button type="button" className="bouton bouton--primaire bouton--pleine" onClick={continuer}>
            {t.continuer}
          </button>
        </>
      ) : null}
    </div>
  )
}
