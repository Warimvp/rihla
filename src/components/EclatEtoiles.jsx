import { Etoile8 } from './Icones.jsx'

// Une pluie d'étoiles khatam qui jaillit du centre — pour les validations,
// visas et fins de jeu. Pur CSS (voir .eclat), respecte prefers-reduced-motion.

const COULEURS = ['var(--safran)', 'var(--terracotta)', 'var(--majorelle)']

export function EclatEtoiles({ nombre = 12 }) {
  const etoiles = Array.from({ length: nombre }, (_, i) => {
    const angle = (i / nombre) * 2 * Math.PI
    const distance = 74 + (i % 3) * 30
    return {
      dx: Math.round(Math.cos(angle) * distance),
      dy: Math.round(Math.sin(angle) * distance),
      delai: (i % 4) * 60,
      taille: 10 + (i % 3) * 5,
      couleur: COULEURS[i % COULEURS.length],
    }
  })
  return (
    <span className="eclat" aria-hidden="true">
      {etoiles.map((e, i) => (
        <span
          key={i}
          className="eclat__etoile"
          style={{ '--dx': `${e.dx}px`, '--dy': `${e.dy}px`, animationDelay: `${e.delai}ms` }}
        >
          <Etoile8 taille={e.taille} couleur={e.couleur} />
        </span>
      ))}
    </span>
  )
}
