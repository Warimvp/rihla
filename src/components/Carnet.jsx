import { useMemo, useState } from 'react'
import { sensPour } from '../i18n.js'
import { LANGUES, nomLangue } from '../data/langues.js'
import { INTERVALLES, XP_PAR_MOT, construireRevision, motsDus, prochaineBoite } from '../lib/carnet.js'
import { jourLocal } from '../lib/progression.js'
import { parler } from '../lib/tts.js'
import { Coche, Croix, Etoile8, HautParleur } from './Icones.jsx'
import { Pastille } from './Communs.jsx'
import { EclatEtoiles } from './EclatEtoiles.jsx'

// La session de révision espacée : les mots dus du carnet, toutes langues
// mêlées, avec le mouvement de rang annoncé après chaque réponse.
export function Carnet({ t, locale, source, progresInitialSession, surReponse, surTerminer, surQuitter }) {
  const session = useMemo(
    () => construireRevision(motsDus(progresInitialSession, LANGUES, jourLocal())),
    [progresInitialSession]
  )
  const [iQuestion, setIQuestion] = useState(0)
  const [choix, setChoix] = useState(null)
  const [bonnes, setBonnes] = useState(0)
  const [fin, setFin] = useState(null)

  const total = session.length
  const question = session[iQuestion]

  const choisir = (option) => {
    if (choix || !question) return
    const bonne = option.id === question.mot.id
    setChoix(option)
    if (bonne) setBonnes(bonnes + 1)
    surReponse(question.langue.id, question.mot.id, bonne)
    parler(question.mot.t, question.langue.tts)
  }

  const continuer = () => {
    if (iQuestion + 1 < total) {
      setIQuestion(iQuestion + 1)
      setChoix(null)
    } else {
      const xp = bonnes * XP_PAR_MOT
      surTerminer(xp)
      setFin({ xp })
    }
  }

  if (fin) {
    return (
      <div className="vue vue--pleine" style={{ alignItems: 'center', justifyContent: 'center', gap: 18, textAlign: 'center' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 120, height: 120 }}>
          {bonnes > 0 ? <EclatEtoiles /> : null}
          <span className="tampon--anime" style={{ display: 'inline-flex' }}>
            <Etoile8 taille={84} couleur={bonnes > 0 ? 'var(--menthe)' : 'var(--ligne-2)'} />
          </span>
        </div>
        <h1 style={{ fontSize: 27 }}>{t.carnet.finTitre}</h1>
        <p className="texte-2">{t.scoreSur(bonnes, total)}</p>
        {fin.xp > 0 ? <span className="chip chip--safran">{t.plusXp(fin.xp)}</span> : null}
        <p className="texte-2" style={{ fontSize: 13, maxWidth: '30ch' }}>{t.carnet.finSub}</p>
        <button type="button" className="bouton bouton--primaire bouton--pleine" style={{ marginTop: 10 }} onClick={surQuitter}>
          {t.continuer}
        </button>
      </div>
    )
  }

  if (!question) return null

  const bonneOption = question.options.find((o) => o.id === question.mot.id)
  const aRepondu = choix !== null
  const aReussi = aRepondu && choix.id === question.mot.id
  const rangApres = prochaineBoite(question.entree.boite, aReussi)

  return (
    <div className="vue vue--pleine" style={{ gap: 16 }}>
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
          <div className="piste-progres__barre" style={{ width: `${((iQuestion + 1) / total) * 100}%`, height: 8, background: 'var(--menthe)' }}></div>
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--encre-2)', flex: '0 0 auto' }}>
          {iQuestion + 1}/{total}
        </span>
      </div>

      <span className="surtitre">{t.carnet.titre}</span>

      <div className="carte" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flex: '0 0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Pastille langue={question.langue} taille={26} />
          <span className="texte-2" style={{ fontSize: 13, fontWeight: 500 }}>{nomLangue(question.langue, locale)}</span>
        </div>
        {question.type === 'comprendre' ? (
          <>
            <div className="mot-cible" style={{ fontSize: 26 }}>{question.mot.t}</div>
            {question.mot.r ? <div className="romanisation">{question.mot.r}</div> : null}
            <button type="button" className="bouton bouton--rond" style={{ width: 44, height: 44 }} aria-label={t.ecouter} onClick={() => parler(question.mot.t, question.langue.tts)}>
              <HautParleur taille={20} trait={1.8} />
            </button>
          </>
        ) : (
          <div className="mot-cible" style={{ fontSize: 25 }}>{sensPour(question.mot, source, question.langue.id)}</div>
        )}
      </div>

      <p style={{ fontSize: 15, fontWeight: 500 }}>
        {question.type === 'comprendre' ? t.promptComprendre : t.promptProduire(nomLangue(question.langue, locale))}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {question.options.map((option) => {
          const estCorrecte = aRepondu && option.id === question.mot.id
          const estFausse = aRepondu && option === choix && option.id !== question.mot.id
          const classe = estCorrecte
            ? 'option option--correcte anim-pop'
            : estFausse
              ? 'option option--fausse anim-secouer'
              : 'option'
          return (
            <button key={option.id} type="button" className={classe} disabled={aRepondu} onClick={() => choisir(option)}>
              <span>
                {question.type === 'comprendre' ? sensPour(option, source, question.langue.id) : option.t}
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
      {aRepondu ? (
        <>
          <div className={`bandeau-reponse ${aReussi ? 'bandeau-reponse--bonne' : 'bandeau-reponse--mauvaise'}`}>
            <span
              style={{
                width: 30,
                height: 30,
                borderRadius: 999,
                background: aReussi ? 'var(--menthe)' : 'var(--terracotta)',
                color: 'var(--papier)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: '0 0 auto',
              }}
            >
              {aReussi ? <Coche taille={16} trait={2.6} /> : <Croix taille={16} trait={2.6} />}
            </span>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{aReussi ? t.bonneReponse : t.mauvaiseReponse}</span>
              <span style={{ fontSize: 12.5 }}>
                {aReussi
                  ? t.carnet.rangMonte(rangApres, INTERVALLES[rangApres - 1])
                  : `${t.laBonneEtait} ${question.type === 'comprendre' ? sensPour(bonneOption, source, question.langue.id) : bonneOption.t} · ${t.carnet.rangRetombe}`}
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
