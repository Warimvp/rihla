import { nomLangue, nomVille } from '../data/langues.js'
import { VignetteVille } from './Vignettes.jsx'

// Tampon de visa : la vignette de la ville au centre, trois formes et trois
// encres qui tournent à des cadences différentes, léger désaxage comme un
// vrai coup de tampon. Couleurs en jetons CSS (via style, pas en attributs
// SVG) pour rester lisibles en mode nuit. Un tampon par destination, tous
// différents.

const ENCRES = [
  { trait: 'var(--terracotta)', texte: 'var(--terracotta-fonce)' },
  { trait: 'var(--safran)', texte: 'var(--safran-fonce)' },
  { trait: 'var(--menthe)', texte: 'var(--menthe-fonce)' },
]

const ROTATIONS = [-5, 4, -3, 5, -4, 3]
const FORMES = 3

// L'ordre où les destinations sont ENTRÉES au programme — pas celui de la
// route. Un tampon décroché garde son encre et sa forme : ranger Paris entre
// Lisbonne et Venise d'après la place sur la route aurait redessiné douze
// tampons déjà collés dans des passeports. Une nouvelle destination s'ajoute
// À LA FIN (le test refuse une destination absente d'ici).
export const ORDRE_TAMPONS = ['es', 'pt', 'it', 'de', 'en', 'tr', 'ar', 'ru', 'fa', 'sw', 'hi', 'zh', 'ko', 'ja', 'fr']

export const indexTampon = (langueId) => {
  const i = ORDRE_TAMPONS.indexOf(langueId)
  return i < 0 ? ORDRE_TAMPONS.length : i
}

export function TamponVisa({ langue, locale = 'fr', anime = false }) {
  const index = indexTampon(langue.id)
  const encre = ENCRES[index % ENCRES.length]
  // La forme change quand les encres ont fait un tour : `index % 3` pour les
  // deux donnait la même période, donc trois combinaisons pour toutes les villes.
  const forme = Math.floor(index / ENCRES.length) % FORMES
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
        <VignetteVille langue={langue} x={30} y={16} taille={36} trait={3} style={{ color: encre.trait }} />
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
