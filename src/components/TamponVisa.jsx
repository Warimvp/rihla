import { nomLangue, nomVille } from '../data/langues.js'

// Tampon de visa : trois formes et trois encres qui tournent, léger désaxage
// comme un vrai coup de tampon dans un passeport.

const ENCRES = [
  { trait: '#C8552F', texte: '#A84523' },
  { trait: '#E9A319', texte: '#7A5107' },
  { trait: '#23795B', texte: '#17553F' },
]

const ROTATIONS = [-5, 4, -3, 5, -4, 3]

function Etoile8({ couleur, x, y, cote }) {
  const centre = { x: x + cote / 2, y: y + cote / 2 }
  return (
    <g fill={couleur}>
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
  return (
    <div
      className={anime ? 'tampon--anime' : undefined}
      style={{ transform: anime ? undefined : `rotate(${rotation}deg)`, width: '100%', height: '100%' }}
    >
      <svg width="100%" height="100%" viewBox="0 0 96 96" aria-hidden="true">
        {forme === 0 ? (
          <g>
            <circle cx="48" cy="48" r="40" fill="none" stroke={encre.trait} strokeWidth="2.5" />
            <circle cx="48" cy="48" r="33" fill="none" stroke={encre.trait} strokeWidth="1" />
          </g>
        ) : forme === 1 ? (
          <polygon
            points="48,8 76,20 88,48 76,76 48,88 20,76 8,48 20,20"
            fill="none"
            stroke={encre.trait}
            strokeWidth="2.5"
            strokeDasharray="5 4"
          />
        ) : (
          <rect
            x="12"
            y="12"
            width="72"
            height="72"
            rx="14"
            fill="none"
            stroke={encre.trait}
            strokeWidth="2.5"
            strokeDasharray="6 4"
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
          fill={encre.texte}
          fontFamily="Readex Pro, sans-serif"
        >
          {ville}
        </text>
        <text
          x="48"
          y="75"
          textAnchor="middle"
          fontSize="7"
          letterSpacing="1"
          fill={encre.texte}
          fontFamily="Readex Pro, sans-serif"
        >
          {nom}
        </text>
      </svg>
    </div>
  )
}
