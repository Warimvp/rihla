import { useEffect, useId, useRef } from 'react'

// La feuille : une question posée en bas de l'écran, à portée de pouce, à la
// place des boîtes du système (`window.confirm` parle au nom du site, en
// petit, et n'a rien du carnet de voyage).
//
// Deux choix, jamais plus. Le choix SÛR est le bouton principal et reçoit le
// focus : on ne perd rien en appuyant trop vite sur Entrée. Échap et un
// toucher hors de la feuille la referment — c'est le choix sûr, lui aussi.
// Le voile anime son FOND, pas son opacité (la feuille deviendrait translucide).
export function Feuille({ titre, texte, sur, autre, surFermer }) {
  const premier = useRef(null)
  const second = useRef(null)
  const idTitre = useId()
  const idTexte = useId()

  useEffect(() => {
    premier.current?.focus()
  }, [])

  const auClavier = (e) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      surFermer()
      return
    }
    // Deux boutons : le focus tourne entre eux, sans filer derrière le voile.
    if (e.key === 'Tab') {
      e.preventDefault()
      ;(document.activeElement === premier.current ? second : premier).current?.focus()
    }
  }

  return (
    <div className="voile" onClick={surFermer}>
      <div
        className="feuille"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={idTitre}
        aria-describedby={idTexte}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={auClavier}
      >
        <h2 id={idTitre}>{titre}</h2>
        <p id={idTexte} className="texte-2" style={{ fontSize: 14, lineHeight: 1.55 }}>
          {texte}
        </p>
        <button ref={premier} type="button" className="bouton bouton--primaire bouton--pleine" onClick={sur.action}>
          {sur.libelle}
        </button>
        <button ref={second} type="button" className="bouton bouton--secondaire bouton--pleine" onClick={autre.action}>
          {autre.libelle}
        </button>
      </div>
    </div>
  )
}

// L'annonce : ce qui vient de se passer, dit près du pouce — au-dessus de la
// barre d'onglets, où qu'on soit dans la page. Toujours montée (vide, elle
// n'est là que pour les lecteurs d'écran, qui n'annoncent pas une région
// apparue avec son texte). `action` : un geste offert avec l'annonce
// (« Annuler » après un effacement).
export function Annonce({ message, action }) {
  return (
    <div role="status" aria-live="polite" className={message ? 'annonce' : 'lecteur-seul'}>
      {message ? <span>{message}</span> : null}
      {message && action ? (
        <button type="button" className="annonce__action" onClick={action.sur}>
          {action.libelle}
        </button>
      ) : null}
    </div>
  )
}
