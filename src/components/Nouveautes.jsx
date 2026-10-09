import { useEffect, useId, useRef } from 'react'

// Les nouveautés : posées en bas de l'écran, comme la feuille, une seule fois
// après une mise à jour (src/lib/miseajour.js). Un seul bouton, qui reçoit le
// focus ; Échap et un toucher hors de la feuille la referment aussi — ce n'est
// pas une question, il n'y a rien à perdre. Le texte vit dans `t.nouveautes`
// (FR + AR) : un point = un titre et une phrase.
export function Nouveautes({ t, surFermer }) {
  const bouton = useRef(null)
  const idTitre = useId()
  const n = t.nouveautes

  useEffect(() => {
    bouton.current?.focus()
  }, [])

  const auClavier = (e) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      surFermer()
    }
  }

  return (
    <div className="voile-nouveautes" onClick={surFermer}>
      <div
        className="nouveautes"
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitre}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={auClavier}
      >
        <h2 id={idTitre}>{n.titre}</h2>
        <p className="texte-2" style={{ fontSize: 14, lineHeight: 1.55 }}>
          {n.intro}
        </p>
        <ul className="nouveautes__liste">
          {n.points.map((point) => (
            <li key={point.titre} className="nouveautes__point">
              <strong>{point.titre}</strong>
              <span className="texte-2">{point.texte}</span>
            </li>
          ))}
        </ul>
        <button ref={bouton} type="button" className="bouton bouton--primaire bouton--pleine" onClick={surFermer}>
          {n.bouton}
        </button>
      </div>
    </div>
  )
}
