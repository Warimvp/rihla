import { nomLangue, nomVille } from '../data/langues.js'

// Tampon de visa : trois formes et trois encres qui tournent, léger désaxage
// comme un vrai coup de tampon. Couleurs en jetons CSS (via style, pas en
// attributs SVG) pour rester lisibles en mode nuit.

const ENCRES = [
  { trait: 'var(--terracotta)', texte: 'var(--terracotta-fonce)' },
  { trait: 'var(--safran)', texte: 'var(--safran-fonce)' },
  { trait: 'var(--menthe)', texte: 'var(--menthe-fonce)' },
]

const ROTATIONS = [-5, 4, -3, 5, -4, 3]

function Etoile8({ couleur, x, y, cote }) {
  const centre = { x: x + cote / 2, y: y + cote / 2 }
  return (
    <g style={{ fill: couleur }}>
      <rect x={x} y={y} width={cote} height={cote} />
      <rect x={x} y={y} width={cote} height={cote} transform={`rotate(45 ${centre.x} ${centre.y})`} />
    </g>
  )
}

export function TamponVisa({ langue, index = 0, locale = 'fr', anime = false }) {
  const encre = ENCRES[index % ENCRES.length]
  const forme = index % 3
  const rotation = ROTATIONS[index % ROTATIONS.length]
  const ville = nomVille(langue, locale).toUpperCase()
  const nom = nomLangue(langue, locale).toUpperCase()
  const styleTrait = { fill: 'none', stroke: encre.trait }
  return (
    <div
      className={anime ? 'tampon--anime' : undefined}
      style={{ transform: anime ? undefined : `rotate(${rotation}deg)`, width: '100%', height: '100%' }}
    >
      <svg width="100%" height="100%" viewBox="0 0 96 96" aria-hidden="true">
        {forme === 0 ? (
          <g>
            <circle cx="48" cy="48" r="40" strokeWidth="2.5" style={styleTrait} />
            <circle cx="48" cy="48" r="33" strokeWidth="1" style={styleTrait} />
          </g>
        ) : forme === 1 ? (
          <polygon
            points="48,8 76,20 88,48 76,76 48,88 20,76 8,48 20,20"
            strokeWidth="2.5"
            strokeDasharray="5 4"
            style={styleTrait}
          />
        ) : (
          <rect
            x="12"
            y="12"
            width="72"
            height="72"
            rx="14"
            strokeWidth="2.5"
            strokeDasharray="6 4"
            style={styleTrait}
          />
        )}
        <Etoile8 couleur={encre.trait} x={41.5} y={31} cote={13} />
        <text
          x="48"
          y="64"
          textAnchor="middle"
          fontSize="9.5"
          letterSpacing="1.5"
          fontWeight="600"
          fontFamily="Readex Pro, sans-serif"
          style={{ fill: encre.texte }}
        >
          {ville}
        </text>
        <text
          x="48"
          y="75"
          textAnchor="middle"
          fontSize="7"
          letterSpacing="1"
          fontFamily="Readex Pro, sans-serif"
          style={{ fill: encre.texte }}
        >
          {nom}
        </text>
      </svg>
    </div>
  )
}
