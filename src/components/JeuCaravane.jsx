import { useMemo, useState } from 'react'
import { sens } from '../i18n.js'
import { nomLangue } from '../data/langues.js'
import { melanger } from '../lib/quiz.js'
import { parler } from '../lib/tts.js'
import { Croix, Etoile8, HautParleur } from './Icones.jsx'
import { EclatEtoiles } from './EclatEtoiles.jsx'

const tousLesMots = (langue) => langue.lecons.flatMap((l) => l.mots)
const NB_MOTS = 8
const DISTRACTEURS = 'aeinorstlu'

// On épelle la romanisation quand l'écriture cible n'est pas latine.
const nettoyer = (texte) =>
  texte
    .toLowerCase()
    .replace(/[¿?¡!.,…？]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

// La Caravane : épelle chaque mot avec les tuiles-lettres ;
// à chaque mot réussi, l'étoile avance d'une étape sur la piste.
export function JeuCaravane({ t, locale, langue, surXp, surQuitter }) {
  const [partie, setPartie] = useState(0)
  const mots = useMemo(
    () =>
      melanger(tousLesMots(langue))
        .map((mot) => ({ ...mot, cible: nettoyer(mot.r ?? mot.t) }))
        .filter((mot) => mot.cible.length >= 2 && mot.cible.length <= 10)
        .slice(0, NB_MOTS),
    [langue, partie]
  )
  const [iMot, setIMot] = useState(0)
  const [placees, setPlacees] = useState([])
  const [etat, setEtat] = useState('saisie')
  const [fautesMot, setFautesMot] = useState(0)
  const [xpCumul, setXpCumul] = useState(0)
  const [fin, setFin] = useState(null)

  const mot = mots[iMot]
  const fentes = useMemo(() => (mot ? mot.cible.split('') : []), [mot])
  const aPlacer = useMemo(() => fentes.filter((c) => c !== ' '), [fentes])
  const tuilesLettres = useMemo(() => {
    if (!mot) return []
    const extras = Array.from({ length: 2 }, () => DISTRACTEURS[Math.floor(Math.random() * DISTRACTEURS.length)])
    return melanger([...aPlacer, ...extras]).map((c, cle) => ({ c, cle }))
  }, [mot, aPlacer, partie])

  const rejouer = () => {
    setPartie(partie + 1)
    setIMot(0)
    setPlacees([])
    setEtat('saisie')
    setFautesMot(0)
    setXpCumul(0)
    setFin(null)
  }

  const verifier = (placement) => {
    const assemble = []
    let curseur = 0
    for (const c of fentes) {
      if (c === ' ') assemble.push(' ')
      else assemble.push(placement[curseur++]?.c ?? '')
    }
    if (assemble.join('') === mot.cible) {
      setEtat('bonne')
      parler(mot.t, langue.tts)
      const gain = fautesMot === 0 ? 10 : 5
      const cumul = xpCumul + gain
      setXpCumul(cumul)
      setTimeout(() => {
        if (iMot + 1 < mots.length) {
          setIMot(iMot + 1)
          setPlacees([])
          setFautesMot(0)
          setEtat('saisie')
        } else {
          surXp(cumul)
          setFin({ xp: cumul })
        }
      }, 750)
    } else {
      setEtat('fausse')
      setFautesMot(fautesMot + 1)
      setTimeout(() => {
        setPlacees([])
        setEtat('saisie')
      }, 620)
    }
  }

  const placer = (tuile) => {
    if (etat !== 'saisie' || fin) return
    if (placees.some((p) => p.cle === tuile.cle)) return
    if (placees.length >= aPlacer.length) return
    const suivantes = [...placees, tuile]
    setPlacees(suivantes)
    if (suivantes.length === aPlacer.length) setTimeout(() => verifier(suivantes), 180)
  }

  const effacer = () => {
    if (etat !== 'saisie') return
    setPlacees(placees.slice(0, -1))
  }

  if (fin) {
    return (
      <div className="vue vue--pleine" style={{ alignItems: 'center', justifyContent: 'center', gap: 18, textAlign: 'center' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 120, height: 120 }}>
          <EclatEtoiles />
          <span className="tampon--anime" style={{ display: 'inline-flex' }}>
            <Etoile8 taille={84} couleur="var(--majorelle)" />
          </span>
        </div>
        <h1 style={{ fontSize: 27 }}>{t.jeux.caravaneArrivee}</h1>
        <p className="texte-2">{t.jeux.motSur(mots.length, mots.length)}</p>
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

  if (!mot) return null

  const utilisees = new Set(placees.map((p) => p.cle))
  let curseurAffichage = 0

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
        <span style={{ flex: '1 1 auto', fontSize: 15.5, fontWeight: 600 }}>{t.jeux.caravane}</span>
        <span className="texte-2" style={{ fontSize: 13, fontWeight: 600 }}>{t.jeux.motSur(iMot + 1, mots.length)}</span>
      </div>

      <div style={{ position: 'relative', height: 36, flex: '0 0 auto' }}>
        <div style={{ position: 'absolute', insetInline: 12, top: 18, borderTop: '2px dashed var(--ligne-2)' }}></div>
        <span
          style={{
            position: 'absolute',
            top: 6,
            insetInlineStart: `calc(12px + ${(iMot / Math.max(1, mots.length - 1)) * 88}%)`,
            transition: 'inset-inline-start 0.5s ease',
            display: 'inline-flex',
          }}
        >
          <Etoile8 taille={22} couleur="var(--safran)" />
        </span>
      </div>

      <div
        className={`carte ${etat === 'fausse' ? 'anim-secouer' : etat === 'bonne' ? 'anim-pop' : ''}`}
        style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, flex: '0 0 auto' }}
      >
        <span className="surtitre">
          {t.jeux.epelle} · {nomLangue(langue, locale)}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="mot-cible" style={{ fontSize: 24 }}>{sens(mot, locale)}</div>
          <button type="button" className="bouton bouton--rond" style={{ width: 44, height: 44 }} aria-label={t.ecouter} onClick={() => parler(mot.t, langue.tts)}>
            <HautParleur taille={20} trait={1.8} />
          </button>
        </div>
        <div dir="ltr" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 6 }}>
          {fentes.map((c, i) => {
            if (c === ' ') return <span key={i} className="fente fente--espace"></span>
            const contenu = placees[curseurAffichage++]?.c ?? ''
            return (
              <span
                key={i}
                className={`fente ${contenu ? 'fente--pleine' : ''}`}
                style={etat === 'bonne' ? { color: 'var(--menthe-fonce)', borderColor: 'var(--menthe)' } : undefined}
              >
                {contenu}
              </span>
            )
          })}
        </div>
      </div>

      <div dir="ltr" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
        {tuilesLettres.map((tuile) => (
          <button
            key={tuile.cle}
            type="button"
            className="lettre"
            disabled={utilisees.has(tuile.cle) || etat !== 'saisie'}
            onClick={() => placer(tuile)}
          >
            {tuile.c}
          </button>
        ))}
      </div>

      <div style={{ flex: '1 1 auto' }}></div>
      <button type="button" className="bouton bouton--fantome" onClick={effacer} disabled={!placees.length || etat !== 'saisie'}>
        {t.jeux.effacer}
      </button>
    </div>
  )
}
