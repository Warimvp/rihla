import { useEffect, useMemo, useRef, useState } from 'react'
import { nomLangue } from '../data/langues.js'
import { melanger } from '../lib/quiz.js'
import { fanfare, retourReponse } from '../lib/sons.js'
import { parler } from '../lib/tts.js'
import { BoutonQuitter } from './Quitter.jsx'
import { Ecoute } from './Ecoute.jsx'
import { FinDeJeu } from './FinDeJeu.jsx'
import { MotCible, Romanisation, Sens } from './MotCible.jsx'
import { CielDuSouk } from './ScenesJeux.jsx'

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
    if (xp > 0) fanfare()
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
    retourReponse(bonne)
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
      <FinDeJeu
        t={t}
        locale={locale}
        langue={langue}
        titre={t.jeux.soukFerme}
        detail={`${t.jeux.score(score)} · ${t.jeux.meilleurCombo(meilleur)}`}
        xp={fin.xp}
        succes={score > 0}
        couleur="var(--terracotta)"
        surQuitter={surQuitter}
        surRejouer={rejouer}
      />
    )
  }

  const { cible, direction, options } = manche

  return (
    <div className="vue vue--pleine" style={{ gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <BoutonQuitter t={t} etiquette={t.fermer} aPerdre={score > 0} jeu surQuitter={surQuitter} />
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

      {/* Le jour passe sur la ville : le soleil se couche quand le souk ferme.
          Décoratif — le temps est écrit en secondes juste au-dessus. */}
      <CielDuSouk langue={langue} reste={temps} duree={DUREE} />

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
            {/* Le chrono tourne pendant l'écoute lente : la tortue se paie en
                secondes, sinon elle deviendrait un bouton pause. */}
            <Ecoute t={t} texte={cible.t} langue={langue} taille={52} />
            <MotCible balise="div" className="mot-cible" style={{ fontSize: 26 }} texte={cible.t} langue={langue} />
            {cible.r ? <Romanisation balise="div" texte={cible.r} /> : null}
          </>
        ) : (
          <div className="mot-cible" style={{ fontSize: 26 }}><Sens mot={cible} source={source} langue={langue} /></div>
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
                {direction === 'versSens' ? <Sens mot={option} source={source} langue={langue} /> : <MotCible texte={option.t} langue={langue} />}
                {direction === 'versMot' && option.r ? (
                  <Romanisation texte={option.r} style={{ marginInlineStart: 8 }} />
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
