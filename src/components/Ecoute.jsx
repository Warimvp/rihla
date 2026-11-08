import { useEffect, useId, useState } from 'react'
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
 * Le bouton est TOUJOURS là, dans toutes les langues. Sans voix pour LA langue
 * sur cet appareil (courant sur Android : ni swahili ni persan en série), il
 * reste visible mais éteint — jamais une voix française lisant du swahili — et
 * le toucher dit pourquoi et comment y remédier. Le cacher laissait croire à
 * l'apprenant que l'app n'avait pas de son. Il reste un `<button>` actif
 * (`aria-disabled`, pas `disabled`) : un bouton désactivé n'envoie aucun clic
 * dans une WebView, donc aucune explication, et il éjecte le focus.
 * `grand` (la question d'écoute pure, où le son EST l'énoncé) le dit en toutes
 * lettres. `auto` prononce à l'arrivée ; remonter le composant (`key`) pour rejouer.
 */
export function Ecoute({ t, texte, langue, taille = 44, grand = false, auto = false }) {
  useVoixPretes()
  const idNote = useId()
  const [muet, setMuet] = useState(false)
  const [explique, setExplique] = useState(false)
  const sansVoix = muet || !peutParler(langue.tts)

  const dire = (lent) => {
    if (sansVoix) {
      setExplique(true)
      return
    }
    const parle = parler(texte, langue.tts, { lent })
    setMuet(!parle)
    if (!parle) setExplique(true)
  }

  // Un échec ne vaut que pour CE mot dans CETTE langue : le Carnet et le Défi
  // mêlent les langues, un swahili muet ne doit pas faire taire l'espagnol suivant.
  useEffect(() => {
    setMuet(false)
    setExplique(false)
    if (auto) dire(false)
  }, [auto, texte, langue.tts])

  const etat = sansVoix ? { 'aria-disabled': 'true', 'aria-describedby': idNote } : {}
  const classeIndispo = sansVoix ? ' bouton--indispo' : ''

  // Toujours montée, vide tant qu'il n'y a rien à dire : une zone `aria-live` ne
  // lit que le texte qui change dans un nœud déjà présent. Pas de `role="status"` :
  // c'est celui du bandeau de correction, que les écrans et les tests cherchent
  // en premier — une seconde zone du même rôle le leur volerait.
  const note = (
    <span id={idNote} aria-live="polite" className="ecoute__note texte-2">
      {sansVoix && explique ? t.sonIndispoAide : ''}
    </span>
  )

  const lent = (
    <button
      type="button"
      className={`bouton bouton--rond${classeIndispo}`}
      style={{ width: 44, height: 44 }}
      aria-label={t.ecouterLent}
      {...etat}
      title={sansVoix ? t.sonIndispo : t.ecouterLent}
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
          <button
            type="button"
            className={`bouton-ecoute-grand${classeIndispo}`}
            aria-label={t.jeux.reecouter}
            {...etat}
            onClick={() => dire(false)}
          >
            <HautParleur taille={32} trait={1.8} />
          </button>
          {lent}
          {note}
        </div>
        <span className="texte-2" style={{ fontSize: 13 }}>{sansVoix ? t.sonIndispo : t.jeux.reecouter}</span>
      </>
    )
  }

  return (
    <div className="ecoute">
      <button
        type="button"
        className={`bouton bouton--rond${classeIndispo}`}
        style={{ width: taille, height: taille }}
        aria-label={t.ecouter}
        {...etat}
        title={sansVoix ? t.sonIndispo : t.ecouter}
        onClick={(e) => {
          e.stopPropagation()
          dire(false)
        }}
      >
        <HautParleur taille={taille >= 52 ? 24 : 20} trait={1.8} />
      </button>
      {lent}
      {note}
    </div>
  )
}
