import { useEffect, useRef, useState } from 'react'
import { retenirRetour } from '../lib/retour.js'
import { Feuille } from './Feuille.jsx'
import { Croix } from './Icones.jsx'

// La croix qui ferme une étape ou un jeu. Tant qu'il n'y a rien à perdre, elle
// ferme ; dès que le voyageur a répondu, elle DEMANDE — un doigt qui glisse
// sur la croix à la septième question ne doit pas coûter toute l'étape. Le
// bouton retour du système (Android, navigateur) pose la même question
// (src/lib/retour.js) ; le presser une seconde fois la referme : on reste.
export function BoutonQuitter({ t, etiquette = t.fermer, aPerdre = false, jeu = false, surQuitter, taille = 22, style }) {
  const [demande, setDemande] = useState(false)
  const croix = useRef(null)

  useEffect(() => {
    if (!aPerdre) {
      setDemande(false)
      return undefined
    }
    return retenirRetour(() => setDemande((ouverte) => !ouverte))
  }, [aPerdre])

  const refermer = () => {
    setDemande(false)
    // Le focus revient d'où il est parti.
    croix.current?.focus()
  }

  return (
    <>
      <button
        ref={croix}
        type="button"
        className="bouton-quitter"
        onClick={() => (aPerdre ? setDemande(true) : surQuitter())}
        aria-label={etiquette}
        aria-haspopup={aPerdre ? 'dialog' : undefined}
        style={style}
      >
        <Croix taille={taille} trait={2.2} />
      </button>
      {demande ? (
        <Feuille
          titre={jeu ? t.quitter.titreJeu : t.quitter.titreLecon}
          texte={jeu ? t.quitter.texteJeu : t.quitter.texteLecon}
          sur={{ libelle: t.quitter.rester, action: refermer }}
          autre={{ libelle: t.quitter.partir, action: surQuitter }}
          surFermer={refermer}
        />
      ) : null}
    </>
  )
}
