import { nomVille } from '../data/langues.js'
import { Etoile8 } from './Icones.jsx'
import { EclatEtoiles } from './EclatEtoiles.jsx'
import { ImageVille } from './ImageVille.jsx'

// La fin d'un jeu : une carte postale de la ville où l'on jouait — sa photo
// (ou son paysage), légèrement de travers comme posée sur la table, tamponnée
// d'une étoile. Partagée par les cinq jeux : ils ne disent que leur titre,
// leur détail et les XP gagnés.
//
// `succes` : l'étoile prend la couleur du jeu et l'éclat jaillit ; sinon elle
// reste pâle (un Souk sans une bonne réponse ne se fête pas).
export function FinDeJeu({ t, locale, langue, titre, detail, xp, succes = true, couleur = 'var(--safran)', surQuitter, surRejouer }) {
  return (
    <div className="vue vue--pleine fin-de-jeu" style={{ alignItems: 'center', justifyContent: 'center', gap: 18, textAlign: 'center' }}>
      <div className="carte-postale">
        <div className="carte-postale__image">
          <ImageVille langue={langue} />
        </div>
        <div className="carte-postale__legende">{nomVille(langue, locale)}</div>
        <div className="carte-postale__tampon">
          {succes ? <EclatEtoiles /> : null}
          <span className="tampon--anime" style={{ display: 'inline-flex' }}>
            <Etoile8 taille={58} couleur={succes ? couleur : 'var(--ligne-2)'} />
          </span>
        </div>
      </div>
      <h1 style={{ fontSize: 27 }}>{titre}</h1>
      {typeof detail === 'string' ? <p className="texte-2">{detail}</p> : detail}
      <span className="chip chip--safran">{t.plusXp(xp)}</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', marginTop: 10 }}>
        <button type="button" className="bouton bouton--primaire bouton--pleine" onClick={surQuitter}>
          {t.retourEtapes}
        </button>
        <button type="button" className="bouton bouton--secondaire bouton--pleine" onClick={surRejouer}>
          {t.rejouer}
        </button>
      </div>
    </div>
  )
}
