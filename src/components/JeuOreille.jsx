import { useState } from 'react'
import { sensPour } from '../i18n.js'
import { nomLangue } from '../data/langues.js'
import { melanger } from '../lib/quiz.js'
import { fanfare, retourReponse } from '../lib/sons.js'
import { peutParler } from '../lib/tts.js'
import { Coche, Croix } from './Icones.jsx'
import { BoutonQuitter } from './Quitter.jsx'
import { Ecoute, useVoixPretes } from './Ecoute.jsx'
import { FinDeJeu } from './FinDeJeu.jsx'
import { MotCible, Romanisation } from './MotCible.jsx'
import { OndesOreille } from './ScenesJeux.jsx'

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
      <FinDeJeu
        t={t}
        locale={locale}
        langue={langue}
        titre={t.jeux.bienJoue}
        detail={t.scoreSur(fin.score, manches.length)}
        xp={fin.xp}
        succes={fin.score > 0}
        couleur="var(--menthe)"
        surQuitter={surQuitter}
        surRejouer={rejouer}
      />
    )
  }

  return (
    <div className="vue vue--pleine" style={{ gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <BoutonQuitter t={t} etiquette={t.fermer} aPerdre={iManche > 0 || choix !== null} jeu surQuitter={surQuitter} />
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

      <div className="carte" style={{ padding: '8px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, flex: '0 0 auto', overflow: 'hidden' }}>
        {/* Se prononce seule à chaque manche (la clé remonte le composant).
            Les ronds s'arrêtent avec la réponse : il n'y a plus rien à écouter. */}
        <OndesOreille actives={!choix}>
          <Ecoute key={`${partie}:${iManche}`} t={t} texte={manche.mot.t} langue={langue} grand auto />
        </OndesOreille>
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
