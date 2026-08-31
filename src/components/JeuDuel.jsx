import { useState } from 'react'
import { sens } from '../i18n.js'
import { nomLangue } from '../data/langues.js'
import { melanger } from '../lib/quiz.js'
import { parler } from '../lib/tts.js'
import { Croix, DuelIcone, Etoile8 } from './Icones.jsx'
import { EclatEtoiles } from './EclatEtoiles.jsx'

const tousLesMots = (langue) => langue.lecons.flatMap((l) => l.mots)
const NB_MANCHES = 8
const XP_DUEL = 30

function tirerManche(pool, precedentId) {
  const candidats = pool.filter((m) => m.id !== precedentId)
  const cible = candidats[Math.floor(Math.random() * candidats.length)]
  const options = [cible]
  for (const autre of melanger(pool)) {
    if (options.length === 4) break
    if (!options.some((o) => o.id === autre.id)) options.push(autre)
  }
  return { cible, options: melanger(options) }
}

// Deux joueurs, un téléphone posé à plat : la moitié haute est pivotée à 180°
// pour faire face au second joueur. Premier sur la bonne réponse = le point.
export function JeuDuel({ t, locale, langue, surXp, surQuitter }) {
  const [phase, setPhase] = useState('intro')
  const [iManche, setIManche] = useState(0)
  const [manche, setManche] = useState(null)
  const [verrous, setVerrous] = useState({ haut: false, bas: false })
  const [vainqueurManche, setVainqueurManche] = useState(null)
  const [scores, setScores] = useState({ haut: 0, bas: 0 })
  const [fin, setFin] = useState(null)

  const commencer = () => {
    setPhase('jeu')
    setIManche(0)
    setManche(tirerManche(tousLesMots(langue), null))
    setVerrous({ haut: false, bas: false })
    setVainqueurManche(null)
    setScores({ haut: 0, bas: 0 })
    setFin(null)
  }

  const mancheSuivante = (scoresApres) => {
    if (iManche + 1 < NB_MANCHES) {
      setIManche(iManche + 1)
      setManche(tirerManche(tousLesMots(langue), manche.cible.id))
      setVerrous({ haut: false, bas: false })
      setVainqueurManche(null)
    } else {
      surXp(XP_DUEL)
      setFin({ scores: scoresApres, xp: XP_DUEL })
      setPhase('fin')
    }
  }

  const toucher = (cote, option) => {
    if (phase !== 'jeu' || vainqueurManche || verrous[cote]) return
    if (option.id === manche.cible.id) {
      const scoresApres = { ...scores, [cote]: scores[cote] + 1 }
      setScores(scoresApres)
      setVainqueurManche(cote)
      parler(manche.cible.t, langue.tts)
      setTimeout(() => mancheSuivante(scoresApres), 1050)
    } else {
      const verrousApres = { ...verrous, [cote]: true }
      setVerrous(verrousApres)
      if (verrousApres.haut && verrousApres.bas) {
        setVainqueurManche('personne')
        setTimeout(() => mancheSuivante(scores), 1050)
      }
    }
  }

  if (phase === 'intro') {
    return (
      <div className="vue vue--pleine" style={{ alignItems: 'center', justifyContent: 'center', gap: 18, textAlign: 'center' }}>
        <span style={{ color: 'var(--majorelle-fonce)' }}>
          <DuelIcone taille={72} trait={1.4} />
        </span>
        <h1 style={{ fontSize: 27 }}>{t.jeux.duel}</h1>
        <p className="texte-2" style={{ maxWidth: '32ch', lineHeight: 1.6 }}>{t.jeux.posezTelephone}</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <span className="chip" style={{ background: 'var(--majorelle-pale)', color: 'var(--majorelle-fonce)' }}>{t.jeux.joueurA}</span>
          <span className="chip chip--terracotta">{t.jeux.joueurB}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', marginTop: 10 }}>
          <button type="button" className="bouton bouton--primaire bouton--pleine" onClick={commencer}>
            {t.commencer}
          </button>
          <button type="button" className="bouton bouton--fantome bouton--pleine" onClick={surQuitter}>
            {t.retourEtapes}
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'fin' && fin) {
    const { haut, bas } = fin.scores
    const titre = haut === bas ? t.jeux.egalite : t.jeux.gagne(haut > bas ? t.jeux.joueurA : t.jeux.joueurB)
    return (
      <div className="vue vue--pleine" style={{ alignItems: 'center', justifyContent: 'center', gap: 18, textAlign: 'center' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 120, height: 120 }}>
          <EclatEtoiles />
          <span className="tampon--anime" style={{ display: 'inline-flex' }}>
            <Etoile8 taille={84} couleur={haut === bas ? 'var(--safran)' : haut > bas ? 'var(--majorelle)' : 'var(--terracotta)'} />
          </span>
        </div>
        <h1 style={{ fontSize: 27 }}>{titre}</h1>
        <p style={{ fontSize: 22, fontWeight: 700 }}>
          <span style={{ color: 'var(--majorelle-fonce)' }}>{haut}</span>
          <span className="texte-2"> — </span>
          <span style={{ color: 'var(--terracotta-fonce)' }}>{bas}</span>
        </p>
        <span className="chip chip--safran">{t.plusXp(fin.xp)}</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', marginTop: 10 }}>
          <button type="button" className="bouton bouton--primaire bouton--pleine" onClick={surQuitter}>
            {t.retourEtapes}
          </button>
          <button type="button" className="bouton bouton--secondaire bouton--pleine" onClick={commencer}>
            {t.rejouer}
          </button>
        </div>
      </div>
    )
  }

  const cote = (nom) => {
    const couleur = nom === 'haut' ? 'var(--majorelle)' : 'var(--terracotta)'
    const couleurFonce = nom === 'haut' ? 'var(--majorelle-fonce)' : 'var(--terracotta-fonce)'
    const gagnee = vainqueurManche === nom
    const verrouille = verrous[nom]
    return (
      <div
        className={`duel-moitie duel-moitie--${nom}`}
        style={{
          flex: '1 1 0',
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          padding: '10px 16px',
          transform: nom === 'haut' ? 'rotate(180deg)' : undefined,
          borderBlockStart: nom === 'bas' ? 'none' : undefined,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="chip" style={{ background: nom === 'haut' ? 'var(--majorelle-pale)' : 'var(--terracotta-pale)', color: couleurFonce, minHeight: 26 }}>
            {nom === 'haut' ? t.jeux.joueurA : t.jeux.joueurB} · {scores[nom]}
          </span>
          {verrouille && !gagnee ? (
            <span className="chip chip--terracotta anim-secouer" style={{ minHeight: 26 }}>{t.jeux.rate}</span>
          ) : null}
        </div>
        <div
          className="carte"
          style={{ padding: '10px 14px', textAlign: 'center', fontFamily: 'var(--police-titre)', fontSize: 21, lineHeight: 1.25, borderColor: couleur, borderWidth: 1.5, flex: '0 0 auto' }}
        >
          {manche.cible.t}
          {manche.cible.r ? <span className="romanisation" style={{ marginInlineStart: 8, fontFamily: 'var(--police-ui)' }}>{manche.cible.r}</span> : null}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, flex: '1 1 auto', minHeight: 0 }}>
          {manche.options.map((option) => {
            const estCible = option.id === manche.cible.id
            const classe =
              gagnee && estCible
                ? 'option option--correcte anim-pop'
                : vainqueurManche && estCible
                  ? 'option option--correcte'
                  : 'option'
            return (
              <button
                key={option.id}
                type="button"
                className={classe}
                style={{ minHeight: 0, height: '100%', fontSize: 14, justifyContent: 'center', textAlign: 'center', opacity: verrouille && !vainqueurManche ? 0.45 : 1 }}
                disabled={Boolean(vainqueurManche) || verrouille}
                onClick={() => toucher(nom, option)}
              >
                {sens(option, locale)}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="vue vue--pleine" style={{ padding: 0, gap: 0 }}>
      {cote('haut')}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '6px 16px', borderBlock: '1px dashed var(--ligne-2)' }}>
        <button
          type="button"
          onClick={surQuitter}
          aria-label={t.quitterLecon}
          style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--encre-2)' }}
        >
          <Croix taille={18} trait={2.2} />
        </button>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--encre-2)' }}>
          {t.jeux.manche(iManche + 1, NB_MANCHES)} · {nomLangue(langue, locale)}
        </span>
        <span style={{ fontSize: 13, fontWeight: 700 }}>
          <span style={{ color: 'var(--majorelle-fonce)' }}>{scores.haut}</span>
          <span className="texte-2"> — </span>
          <span style={{ color: 'var(--terracotta-fonce)' }}>{scores.bas}</span>
        </span>
      </div>
      {cote('bas')}
    </div>
  )
}
