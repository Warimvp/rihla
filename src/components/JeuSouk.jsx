import { useEffect, useMemo, useRef, useState } from 'react'
import { sensPour } from '../i18n.js'
import { nomLangue } from '../data/langues.js'
import { melanger } from '../lib/quiz.js'
import { parler } from '../lib/tts.js'
import { Croix, Etoile8, HautParleur } from './Icones.jsx'
import { EclatEtoiles } from './EclatEtoiles.jsx'

const tousLesMots = (langue) => langue.lecons.flatMap((l) => l.mots)
const DUREE = 45
const XP_MAX = 100

function nouvelleManche(pool, precedentId) {
  const candidats = pool.filter((m) => m.id !== precedentId)
  const cible = candidats[Math.floor(Math.random() * candidats.length)]
  const distracteurs = melanger(pool.filter((m) => m.id !== cible.id)).slice(0, 2)
  return {
    cible,
    direction: Math.random() < 0.5 ? 'versSens' : 'versMot',
    options: melanger([cible, ...distracteurs]),
  }
}

// Le Souk : 45 secondes au chrono, attraper le bon mot sur le bon étal.
export function JeuSouk({ t, locale, source, langue, surXp, surQuitter }) {
  const pool = useMemo(() => tousLesMots(langue), [langue])
  const [temps, setTemps] = useState(DUREE)
  const [manche, setManche] = useState(() => nouvelleManche(pool, null))
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [meilleur, setMeilleur] = useState(0)
  const [xpCumul, setXpCumul] = useState(0)
  const [retour, setRetour] = useState(null)
  const [fin, setFin] = useState(null)
  const crediteRef = useRef(false)

  useEffect(() => {
    if (fin) return undefined
    const id = setInterval(() => setTemps((v) => Math.max(0, v - 1)), 1000)
    return () => clearInterval(id)
  }, [fin])

  useEffect(() => {
    if (temps > 0 || fin || crediteRef.current) return
    crediteRef.current = true
    const xp = Math.min(XP_MAX, xpCumul)
    if (xp > 0) surXp(xp)
    setFin({ xp })
  }, [temps, fin, xpCumul, surXp])

  useEffect(() => {
    if (!fin && manche.direction === 'versSens') parler(manche.cible.t, langue.tts)
  }, [manche, fin, langue])

  const rejouer = () => {
    crediteRef.current = false
    setTemps(DUREE)
    setManche(nouvelleManche(pool, null))
    setScore(0)
    setCombo(0)
    setMeilleur(0)
    setXpCumul(0)
    setRetour(null)
    setFin(null)
  }

  const repondre = (option) => {
    if (retour || fin || temps <= 0) return
    const bonne = option.id === manche.cible.id
    setRetour({ choisiId: option.id, bonne })
    if (bonne) {
      const gain = 10 + 2 * Math.min(5, combo)
      setScore(score + 1)
      setCombo(combo + 1)
      setMeilleur(Math.max(meilleur, combo + 1))
      setXpCumul(xpCumul + gain)
      if (manche.direction === 'versMot') parler(manche.cible.t, langue.tts)
      setTimeout(() => {
        setRetour(null)
        setManche(nouvelleManche(pool, manche.cible.id))
      }, 380)
    } else {
      setCombo(0)
      setTimeout(() => {
        setRetour(null)
        setManche(nouvelleManche(pool, manche.cible.id))
      }, 780)
    }
  }

  if (fin) {
    return (
      <div className="vue vue--pleine" style={{ alignItems: 'center', justifyContent: 'center', gap: 18, textAlign: 'center' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 120, height: 120 }}>
          {score > 0 ? <EclatEtoiles /> : null}
          <span className="tampon--anime" style={{ display: 'inline-flex' }}>
            <Etoile8 taille={84} couleur={score > 0 ? 'var(--terracotta)' : 'var(--ligne-2)'} />
          </span>
        </div>
        <h1 style={{ fontSize: 27 }}>{t.jeux.soukFerme}</h1>
        <p className="texte-2">
          {t.jeux.score(score)} · {t.jeux.meilleurCombo(meilleur)}
        </p>
        <span className="chip chip--safran">{t.plusXp(fin.xp)}</span>
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

  const { cible, direction, options } = manche

  return (
    <div className="vue vue--pleine" style={{ gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
        <div className="chrono">
          <div
            className={`chrono__barre ${temps <= 10 ? 'chrono__barre--urgent' : ''}`}
            style={{ width: `${(temps / DUREE) * 100}%` }}
          ></div>
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: temps <= 10 ? 'var(--terracotta-fonce)' : 'var(--encre-2)', flex: '0 0 auto', minWidth: 34, textAlign: 'end' }}>
          {t.jeux.secondes(temps)}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="surtitre">
          {t.jeux.souk} · {nomLangue(langue, locale)}
        </span>
        <span className="chip chip--menthe" style={{ minHeight: 26, visibility: combo > 1 ? 'visible' : 'hidden' }}>
          {t.jeux.combo(combo)}
        </span>
      </div>

      <div
        className={`carte ${retour && !retour.bonne ? 'anim-secouer' : ''}`}
        style={{ padding: '22px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, flex: '0 0 auto' }}
      >
        {direction === 'versSens' ? (
          <>
            <button type="button" className="bouton bouton--rond" aria-label={t.ecouter} onClick={() => parler(cible.t, langue.tts)}>
              <HautParleur taille={24} trait={1.8} />
            </button>
            <div className="mot-cible" style={{ fontSize: 26 }}>{cible.t}</div>
            {cible.r ? <div className="romanisation">{cible.r}</div> : null}
          </>
        ) : (
          <div className="mot-cible" style={{ fontSize: 26 }}>{sensPour(cible, source, langue.id)}</div>
        )}
        <div className="texte-2" style={{ fontSize: 13 }}>{t.jeux.quelEtal}</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {options.map((option) => {
          const estCible = option.id === cible.id
          const choisi = retour?.choisiId === option.id
          const classe = retour
            ? estCible
              ? 'option etal option--correcte anim-pop'
              : choisi
                ? 'option etal option--fausse'
                : 'option etal'
            : 'option etal'
          return (
            <button key={option.id} type="button" className={classe} onClick={() => repondre(option)}>
              <span>
                {direction === 'versSens' ? sensPour(option, source, langue.id) : option.t}
                {direction === 'versMot' && option.r ? (
                  <span className="romanisation" style={{ marginInlineStart: 8 }}>{option.r}</span>
                ) : null}
              </span>
            </button>
          )
        })}
      </div>

      <div style={{ flex: '1 1 auto' }}></div>
      <p className="texte-2" style={{ fontSize: 12.5, textAlign: 'center' }}>{t.jeux.score(score)}</p>
    </div>
  )
}
