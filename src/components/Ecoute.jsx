import { useEffect, useState } from 'react'
import { parler, peutParler, surVoixPretes } from '../lib/tts.js'
import { HautParleur, Tortue } from './Icones.jsx'

// La liste des voix du système arrive APRÈS le premier rendu (`voiceschanged`).
// Ce hook force un re-rendu quand elle est là, pour que `peutParler(langue.tts)`
// soit réévalué. À n'utiliser que là où changer d'avis est sans danger — jamais
// pour reconstruire le quiz d'une leçon en cours.
export function useVoixPretes() {
  const [, setTick] = useState(0)
  useEffect(() => surVoixPretes(() => setTick((n) => n + 1)), [])
}

/**
 * Écouter un mot ou une phrase de la langue cible, autant de fois qu'on veut,
 * à vitesse normale ou lentement (la tortue). Toujours la paire : réécouter
 * au même débit n'aide pas à découper une phrase qu'on n'a pas saisie.
 *
 * Sans voix pour LA langue, rien ne s'affiche — deux boutons qui ne font rien
 * mentiraient autant qu'une voix française lisant du swahili. `grand` (la
 * question d'écoute pure, où le son EST l'énoncé) le dit en toutes lettres.
 * `auto` prononce à l'arrivée ; remonter le composant (`key`) pour rejouer.
 */
export function Ecoute({ t, texte, langue, taille = 44, grand = false, auto = false }) {
  useVoixPretes()
  const [muet, setMuet] = useState(false)
  const dire = (lent) => setMuet(!parler(texte, langue.tts, { lent }))

  // Un échec ne vaut que pour CE mot dans CETTE langue : le Carnet et le Défi
  // mêlent les langues, un swahili muet ne doit pas faire taire l'espagnol suivant.
  useEffect(() => {
    setMuet(false)
    if (auto) dire(false)
  }, [auto, texte, langue.tts])

  if (muet || !peutParler(langue.tts)) {
    return grand ? <span className="texte-2" style={{ fontSize: 13 }}>{t.sonIndispo}</span> : null
  }

  const lent = (
    <button
      type="button"
      className="bouton bouton--rond"
      style={{ width: 44, height: 44 }}
      aria-label={t.ecouterLent}
      title={t.ecouterLent}
      onClick={(e) => {
        e.stopPropagation()
        dire(true)
      }}
    >
      <Tortue taille={22} trait={1.7} />
    </button>
  )

  if (grand) {
    return (
      <>
        <div className="ecoute">
          <button type="button" className="bouton-ecoute-grand" aria-label={t.jeux.reecouter} onClick={() => dire(false)}>
            <HautParleur taille={32} trait={1.8} />
          </button>
          {lent}
        </div>
        <span className="texte-2" style={{ fontSize: 13 }}>{t.jeux.reecouter}</span>
      </>
    )
  }

  return (
    <div className="ecoute">
      <button
        type="button"
        className="bouton bouton--rond"
        style={{ width: taille, height: taille }}
        aria-label={t.ecouter}
        title={t.ecouter}
        onClick={(e) => {
          e.stopPropagation()
          dire(false)
        }}
      >
        <HautParleur taille={taille >= 52 ? 24 : 20} trait={1.8} />
      </button>
      {lent}
    </div>
  )
}
