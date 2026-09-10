import { useEffect, useState } from 'react'
import { sensPour } from '../i18n.js'
import { nomLangue } from '../data/langues.js'
import { melanger } from '../lib/quiz.js'
import { fanfare, retourReponse } from '../lib/sons.js'
import { parler, peutParler } from '../lib/tts.js'
import { Coche, Croix, Etoile8, HautParleur } from './Icones.jsx'
import { EclatEtoiles } from './EclatEtoiles.jsx'
import { useVoixPretes } from './Jeux.jsx'
import { MotCible, Romanisation } from './MotCible.jsx'

const tousLesMots = (langue) => langue.lecons.flatMap((l) => l.mots)
const NB_MANCHES = 10

// Aucun texte à lire : on écoute, puis on choisit. Alterne « quel sens ? »
// (compréhension) et « quel mot écrit ? » (son ↔ graphie).
function tirerManches(pool) {
  const base = melanger(pool)
  return Array.from({ length: NB_MANCHES }, (_, i) => {
    const mot = base[i % base.length]
    const options = [mot]
    for (const autre of melanger(pool)) {
      if (options.length === 4) break
      if (!options.some((o) => o.id === autre.id)) options.push(autre)
    }
    return { mot, type: i % 2 === 0 ? 'sens' : 'mot', options: melanger(options) }
  })
}

export function JeuOreille({ t, locale, source, langue, surXp, surQuitter }) {
  const [partie, setPartie] = useState(0)
  const [manches, setManches] = useState(() => tirerManches(tousLesMots(langue)))
  const [iManche, setIManche] = useState(0)
  const [choix, setChoix] = useState(null)
  const [score, setScore] = useState(0)
  const [fin, setFin] = useState(null)
  // Si la liste des voix arrive en cours de route sans voix pour cette langue,
  // on préfère afficher « son indisponible » que jouer une partie muette.
  useVoixPretes()

  const manche = manches[iManche]

  useEffect(() => {
    if (!fin && manche) parler(manche.mot.t, langue.tts)
  }, [manche, fin, langue])

  const rejouer = () => {
    setPartie(partie + 1)
    setManches(tirerManches(tousLesMots(langue)))
    setIManche(0)
    setChoix(null)
    setScore(0)
    setFin(null)
  }

  const choisir = (option) => {
    if (choix || fin) return
    const bonne = option.id === manche.mot.id
    setChoix(option)
    if (bonne) setScore(score + 1)
    retourReponse(bonne)
  }

  // Pas d'enchaînement automatique : le jeu n'est pas chronométré, et 950 ms
  // ne laissaient ni le temps de lire la correction, ni celui de l'entendre
  // au lecteur d'écran. C'est le joueur qui continue.
  const continuer = () => {
    if (iManche + 1 < manches.length) {
      setIManche(iManche + 1)
      setChoix(null)
    } else {
      const xp = score * 8
      if (xp > 0) surXp(xp)
      if (xp > 0) fanfare()
      setFin({ xp, score })
    }
  }

  if (!peutParler(langue.tts)) {
    return (
      <div className="vue vue--pleine" style={{ alignItems: 'center', justifyContent: 'center', gap: 18, textAlign: 'center' }}>
        <p className="texte-2">{t.sonIndispo}</p>
        <button type="button" className="bouton bouton--primaire bouton--pleine" onClick={surQuitter}>
          {t.retourEtapes}
        </button>
      </div>
    )
  }

  if (fin) {
    return (
      <div className="vue vue--pleine" style={{ alignItems: 'center', justifyContent: 'center', gap: 18, textAlign: 'center' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 120, height: 120 }}>
          {fin.score > 0 ? <EclatEtoiles /> : null}
          <span className="tampon--anime" style={{ display: 'inline-flex' }}>
            <Etoile8 taille={84} couleur={fin.score > 0 ? 'var(--menthe)' : 'var(--ligne-2)'} />
          </span>
        </div>
        <h1 style={{ fontSize: 27 }}>{t.jeux.bienJoue}</h1>
        <p className="texte-2">{t.scoreSur(fin.score, manches.length)}</p>
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
    <div className="vue vue--pleine" style={{ gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          type="button"
          onClick={surQuitter}
          aria-label={t.fermer}
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
          <div className="piste-progres__barre" style={{ width: `${((iManche + 1) / manches.length) * 100}%`, height: 8 }}></div>
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--encre-2)', flex: '0 0 auto' }}>
          {iManche + 1}/{manches.length}
        </span>
      </div>

      <span className="surtitre">
        {t.jeux.oreille} · {nomLangue(langue, locale)}
      </span>

      <div className="carte" style={{ padding: '26px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, flex: '0 0 auto' }}>
        <button
          type="button"
          onClick={() => parler(manche.mot.t, langue.tts)}
          aria-label={t.jeux.reecouter}
          style={{
            width: 76,
            height: 76,
            borderRadius: 999,
            border: 'none',
            background: 'var(--majorelle)',
            color: 'var(--sur-majorelle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: 'var(--ombre-cta)',
          }}
        >
          <HautParleur taille={32} trait={1.8} />
        </button>
        <span className="texte-2" style={{ fontSize: 13 }}>{t.jeux.reecouter}</span>
      </div>

      <p style={{ fontSize: 15, fontWeight: 500 }}>
        {manche.type === 'sens' ? t.jeux.ecouteSens : t.jeux.ecouteMot}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {manche.options.map((option) => {
          const revele = choix !== null
          const estCorrecte = revele && option.id === manche.mot.id
          const estFausse = revele && option === choix && option.id !== manche.mot.id
          const classe = estCorrecte
            ? 'option option--correcte anim-pop'
            : estFausse
              ? 'option option--fausse anim-secouer'
              : 'option'
          return (
            <button key={option.id} type="button" className={classe} aria-disabled={revele} onClick={() => choisir(option)}>
              <span>
                {manche.type === 'sens' ? sensPour(option, source, langue.id) : <MotCible texte={option.t} langue={langue} />}
                {manche.type === 'mot' && option.r ? (
                  <Romanisation texte={option.r} style={{ marginInlineStart: 8 }} />
                ) : null}
              </span>
              {estCorrecte ? <Coche taille={20} trait={2.4} /> : null}
              {estFausse ? <Croix taille={20} trait={2.4} /> : null}
            </button>
          )
        })}
      </div>

      <div style={{ flex: '1 1 auto' }}></div>
      {/* Toujours monté : voir Lecon.jsx. */}
      <div
        role="status"
        aria-live="polite"
        className={choix ? `bandeau-reponse ${choix.id === manche.mot.id ? 'bandeau-reponse--bonne' : 'bandeau-reponse--mauvaise'}` : 'lecteur-seul'}
      >
        {choix ? (
          <span style={{ fontSize: 14, fontWeight: 600 }}>
            {choix.id === manche.mot.id ? t.bonneReponse : t.mauvaiseReponse}
          </span>
        ) : null}
      </div>
      {choix ? (
        <button type="button" className="bouton bouton--primaire bouton--pleine" onClick={continuer}>
          {t.continuer}
        </button>
      ) : null}

      <div style={{ flex: '1 1 auto' }}></div>
      <p className="texte-2" style={{ fontSize: 12.5, textAlign: 'center' }}>{t.jeux.score(score)}</p>
    </div>
  )
}
