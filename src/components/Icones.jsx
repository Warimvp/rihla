// Icônes maison, tracé 1.9 sur grille 24 — jamais d'emoji en guise d'icône.

const Svg = ({ taille = 20, couleur = 'currentColor', trait = 1.9, className, children }) => (
  <svg
    width={taille}
    height={taille}
    viewBox="0 0 24 24"
    fill="none"
    stroke={couleur}
    strokeWidth={trait}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {children}
  </svg>
)

export const Boussole = (props) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="9" />
    <polygon points="15.5 8.5 13 13 8.5 15.5 11 11" fill="currentColor" stroke="none" />
  </Svg>
)

export const Livre = (props) => (
  <Svg {...props}>
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" />
    <path d="M4 18.5V5.5" />
    <path d="M20 18v3H6.5" />
  </Svg>
)

export const PasseportIcone = (props) => (
  <Svg {...props}>
    <rect x="5" y="3" width="14" height="18" rx="2.5" />
    <circle cx="12" cy="10" r="3" />
    <path d="M8.5 16.5h7" />
  </Svg>
)

export const Rouages = (props) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M12 3v3" />
    <path d="M12 18v3" />
    <path d="M3 12h3" />
    <path d="M18 12h3" />
    <path d="M5.6 5.6l2.1 2.1" />
    <path d="M16.3 16.3l2.1 2.1" />
    <path d="M5.6 18.4l2.1-2.1" />
    <path d="M16.3 7.7l2.1-2.1" />
  </Svg>
)

export const HautParleur = (props) => (
  <Svg {...props}>
    <polygon points="11 5 6 9 3 9 3 15 6 15 11 19 11 5" fill="currentColor" stroke="none" />
    <path d="M15 9.5a3.5 3.5 0 0 1 0 5" />
    <path d="M17.5 7a7 7 0 0 1 0 10" />
  </Svg>
)

export const FlecheAvant = (props) => (
  <Svg {...props} className={`icone-directionnelle ${props.className ?? ''}`}>
    <path d="M5 12h14" />
    <path d="M13 6l6 6-6 6" />
  </Svg>
)

export const ChevronAvant = (props) => (
  <Svg {...props} className={`icone-directionnelle ${props.className ?? ''}`}>
    <path d="M9 6l6 6-6 6" />
  </Svg>
)

export const Coche = (props) => (
  <Svg {...props}>
    <path d="M5 12l5 5 9-10" />
  </Svg>
)

export const Croix = (props) => (
  <Svg {...props}>
    <path d="M6 6l12 12" />
    <path d="M18 6L6 18" />
  </Svg>
)

// L'étoile à 8 branches pleine (le khatam du logo), pour la série de jours —
// distincte de la boussole, réservée à l'onglet Carte.
export const Etoile8 = ({ taille = 14, couleur = 'currentColor' }) => (
  <svg width={taille} height={taille} viewBox="0 0 24 24" aria-hidden="true">
    <g fill={couleur}>
      <rect x="7" y="7" width="10" height="10" />
      <rect x="7" y="7" width="10" height="10" transform="rotate(45 12 12)" />
    </g>
  </svg>
)

export const TuileZellige = (props) => (
  <Svg {...props}>
    <rect x="4" y="4" width="16" height="16" rx="3" />
    <g fill="currentColor" stroke="none">
      <rect x="9" y="9" width="6" height="6" />
      <rect x="9" y="9" width="6" height="6" transform="rotate(45 12 12)" />
    </g>
  </Svg>
)

export const Auvent = (props) => (
  <Svg {...props}>
    <path d="M4 9l1.5-4h13L20 9" />
    <path d="M4 9a2 2 0 0 0 4 0a2 2 0 0 0 4 0a2 2 0 0 0 4 0a2 2 0 0 0 4 0" />
    <path d="M6 12.5V19h12v-6.5" />
    <path d="M9.5 19v-4h5v4" />
  </Svg>
)

export const CaravaneIcone = (props) => (
  <Svg {...props}>
    <path d="M3 18c5-1 8-4 10-8" strokeDasharray="3 3" />
    <g fill="currentColor" stroke="none">
      <rect x="14" y="4.5" width="5" height="5" />
      <rect x="14" y="4.5" width="5" height="5" transform="rotate(45 16.5 7)" />
    </g>
  </Svg>
)

export const CarnetIcone = (props) => (
  <Svg {...props}>
    <rect x="5" y="3" width="14" height="18" rx="2" />
    <path d="M8.5 3v18" />
    <path d="M12 8h4" />
    <path d="M12 12h4" />
  </Svg>
)

export const Onde = (props) => (
  <Svg {...props}>
    <circle cx="6" cy="12" r="1.7" fill="currentColor" stroke="none" />
    <path d="M10.5 8.5a5 5 0 0 1 0 7" />
    <path d="M14 5.5a9.5 9.5 0 0 1 0 13" />
  </Svg>
)

export const DuelIcone = (props) => (
  <Svg {...props}>
    <g fill="currentColor" stroke="none">
      <rect x="4.5" y="4.5" width="5.5" height="5.5" />
      <rect x="4.5" y="4.5" width="5.5" height="5.5" transform="rotate(45 7.25 7.25)" />
      <rect x="14" y="14" width="5.5" height="5.5" />
      <rect x="14" y="14" width="5.5" height="5.5" transform="rotate(45 16.75 16.75)" />
    </g>
    <path d="M13.2 10.8l-2.4 2.4" />
  </Svg>
)
