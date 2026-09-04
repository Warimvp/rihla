import { useMemo, useState } from 'react'
import { sensPour } from '../i18n.js'
import { nomLangue } from '../data/langues.js'
import { melanger } from '../lib/quiz.js'
import { parler } from '../lib/tts.js'
import { Croix, Etoile8 } from './Icones.jsx'
import { EclatEtoiles } from './EclatEtoiles.jsx'

const tousLesMots = (langue) => langue.lecons.flatMap((l) => l.mots)
const NB_PAIRES = 6

// Memory en mosaïque : 12 tuiles zellige, associer chaque mot à son sens.
export function JeuZellige({ t, locale, source, langue, surXp, surQuitter }) {
  const [partie, setPartie] = useState(0)
  const paires = useMemo(() => melanger(tousLesMots(langue)).slice(0, NB_PAIRES), [langue, partie])
  const tuiles = useMemo(
    () =>
      melanger([
        ...paires.map((mot) => ({ motId: mot.id, face: 't', texte: mot.t, tts: true })),
        ...paires.map((mot) => ({ motId: mot.id, face: 'sens', texte: sensPour(mot, source, langue.id), tts: false })),
      ]).map((tuile, idx) => ({ ...tuile, idx })),
    [paires, source, langue]
  )
  const [ouvertes, setOuvertes] = useState([])
  const [gagnees, setGagnees] = useState(() => new Set())
  const [coups, setCoups] = useState(0)
  const [fin, setFin] = useState(null)

  const rejouer = () => {
    setPartie(partie + 1)
    setOuvertes([])
    setGagnees(new Set())
    setCoups(0)
    setFin(null)
  }

  const cliquer = (tuile) => {
    if (fin || gagnees.has(tuile.motId)) return
    if (ouvertes.length === 2 || ouvertes.some((o) => o.idx === tuile.idx)) return
    if (tuile.tts) parler(tuile.texte, langue.tts)
    const nouvelles = [...ouvertes, tuile]
    setOuvertes(nouvelles)
    if (nouvelles.length < 2) return
    const [a, b] = nouvelles
    const nbCoups = coups + 1
    setCoups(nbCoups)
    if (a.motId === b.motId && a.face !== b.face) {
      const complet = gagnees.size + 1 === paires.length
      setTimeout(() => {
        setGagnees((avant) => new Set([...avant, a.motId]))
        setOuvertes([])
        if (complet) {
          const xp = 30 + (nbCoups <= 10 ? 20 : nbCoups <= 14 ? 10 : 0)
          surXp(xp)
          setFin({ xp })
        }
      }, 380)
    } else {
      setTimeout(() => setOuvertes([]), 820)
    }
  }

  if (fin) {
    return (
      <div className="vue vue--pleine" style={{ alignItems: 'center', justifyContent: 'center', gap: 18, textAlign: 'center' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 120, height: 120 }}>
          <EclatEtoiles />
          <span className="tampon--anime" style={{ display: 'inline-flex' }}>
            <Etoile8 taille={84} couleur="var(--safran)" />
          </span>
        </div>
        <h1 style={{ fontSize: 27 }}>{t.jeux.bienJoue}</h1>
        <p className="texte-2">
          {t.jeux.pairesTrouvees(paires.length, paires.length)} · {t.jeux.coups(coups)}
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
        <span style={{ flex: '1 1 auto', fontSize: 15.5, fontWeight: 600 }}>{t.jeux.zellige}</span>
        <span className="texte-2" style={{ fontSize: 13, fontWeight: 600 }}>
          {t.jeux.pairesTrouvees(gagnees.size, paires.length)}
        </span>
      </div>

      <span className="surtitre">
        {nomLangue(langue, locale)} · {t.jeux.zelligeDesc}
      </span>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
        {tuiles.map((tuile) => {
          const visible = gagnees.has(tuile.motId) || ouvertes.some((o) => o.idx === tuile.idx)
          const gagnee = gagnees.has(tuile.motId)
          return (
            <button
              key={tuile.idx}
              type="button"
              className={`tuile ${visible ? 'tuile--vue' : ''} ${gagnee ? 'tuile--gagnee' : ''}`}
              onClick={() => cliquer(tuile)}
              aria-label={visible ? tuile.texte : t.jeux.zellige}
            >
              <span className="tuile__interieur" style={{ display: 'block' }}>
                <span className="tuile__face tuile__face--cachee">
                  <Etoile8 taille={30} couleur="var(--majorelle-pale)" />
                </span>
                <span className="tuile__face tuile__face--mot">{tuile.texte}</span>
              </span>
            </button>
          )
        })}
      </div>

      <div style={{ flex: '1 1 auto' }}></div>
      <p className="texte-2" style={{ fontSize: 12.5, textAlign: 'center' }}>{t.jeux.coups(coups)}</p>
    </div>
  )
}
