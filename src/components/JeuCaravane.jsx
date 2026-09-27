import { useMemo, useState } from 'react'
import { nomLangue } from '../data/langues.js'
import { assembler, cibleEpellation, construireLettres } from '../lib/epellation.js'
import { melanger } from '../lib/quiz.js'
import { fanfare, retourReponse } from '../lib/sons.js'
import { parler } from '../lib/tts.js'
import { BoutonQuitter } from './Quitter.jsx'
import { Ecoute } from './Ecoute.jsx'
import { FinDeJeu } from './FinDeJeu.jsx'
import { PisteCaravane } from './ScenesJeux.jsx'
import { Sens } from './MotCible.jsx'

const tousLesMots = (langue) => langue.lecons.flatMap((l) => l.mots)
const NB_MOTS = 8

// La Caravane : épelle chaque mot avec les tuiles-lettres ;
// à chaque mot réussi, la caravane avance d'une étape vers la ville.
export function JeuCaravane({ t, locale, source, langue, surXp, surQuitter }) {
  const [partie, setPartie] = useState(0)
  const mots = useMemo(
    () =>
      melanger(tousLesMots(langue))
        .map((mot) => ({ ...mot, cible: cibleEpellation(mot) }))
        .filter((mot) => mot.cible)
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
  const tuilesLettres = useMemo(() => (mot ? construireLettres(mot.cible) : []), [mot, partie])

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
    if (assembler(fentes, placement) === mot.cible) {
      setEtat('bonne')
      retourReponse(true)
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
          fanfare()
          setFin({ xp: cumul })
        }
      }, 750)
    } else {
      setEtat('fausse')
      retourReponse(false)
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
      <FinDeJeu
        t={t}
        locale={locale}
        langue={langue}
        titre={t.jeux.caravaneArrivee}
        detail={t.jeux.motSur(mots.length, mots.length)}
        xp={fin.xp}
        couleur="var(--majorelle)"
        surQuitter={surQuitter}
        surRejouer={rejouer}
      />
    )
  }

  if (!mot) return null

  const utilisees = new Set(placees.map((p) => p.cle))
  let curseurAffichage = 0

  return (
    <div className="vue vue--pleine" style={{ gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <BoutonQuitter t={t} etiquette={t.fermer} aPerdre={iMot > 0 || etat === 'bonne'} jeu surQuitter={surQuitter} />
        <span style={{ flex: '1 1 auto', fontSize: 15.5, fontWeight: 600 }}>{t.jeux.caravane}</span>
        <span className="texte-2" style={{ fontSize: 13, fontWeight: 600 }}>{t.jeux.motSur(iMot + 1, mots.length)}</span>
      </div>

      {/* Un mot épelé, une étape de faite : au dernier, la caravane entre en
          ville. Décoratif — « Mot 3 sur 8 » est écrit juste au-dessus. */}
      <PisteCaravane langue={langue} etape={iMot + (etat === 'bonne' ? 1 : 0)} total={mots.length} />

      <div
        className={`carte ${etat === 'fausse' ? 'anim-secouer' : etat === 'bonne' ? 'anim-pop' : ''}`}
        style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, flex: '0 0 auto' }}
      >
        <span className="surtitre">
          {t.jeux.epelle} · {nomLangue(langue, locale)}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="mot-cible" style={{ fontSize: 24 }}><Sens mot={mot} source={source} langue={langue} /></div>
          <Ecoute t={t} texte={mot.t} langue={langue} />
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
