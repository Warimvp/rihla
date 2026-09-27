// Une icône par étape : le thème de la leçon se reconnaît avant d'être lu.
// Même main que Icones.jsx — grille 24, trait rond, tout en currentColor
// (le médaillon pose l'encre, le mode nuit suit). Pas d'emoji, pas de drapeau.
// Indexées par id de leçon (LECONS_META) : le test refuse une leçon sans icône.

const DESSINS = {
  // Niveau 1 · Survie
  salutations: (
    <>
      <path d="M20 4.5H4v11h3.5V19l4.5-3.5h8z" />
      <path d="M8 8.7h8M8 11.7h5" />
    </>
  ),
  enroute: (
    <>
      <path d="M12 3v18" />
      <path d="M12 5h6l2.2 2.5L18 10h-6" />
      <path d="M12 12H6l-2.2 2.5L6 17h6" />
    </>
  ),
  atable: (
    <>
      <path d="M7 6h10l-1.1 11.2a2 2 0 0 1-2 1.8h-3.8a2 2 0 0 1-2-1.8z" />
      <path d="M7.5 11h9" />
      <path d="M10 2.2c-.9.9.9 1.3 0 2.2M14 2.2c-.9.9.9 1.3 0 2.2" />
      <path d="M5.5 21.5h13" />
    </>
  ),
  nombres: <path d="M9.5 4 8 20M16 4l-1.5 16M4.5 9.2h15.3M4.2 14.8h15.3" />,
  marche: (
    <>
      <path d="M4.5 10h15l-1.6 9.5H6.1z" />
      <path d="M8 10l4-6 4 6" />
      <path d="M9.7 13.3v3M14.3 13.3v3" />
    </>
  ),
  jours: (
    <>
      <rect x="4" y="5" width="16" height="15.5" rx="2.5" />
      <path d="M4 10h16M8.5 3v4M15.5 3v4" />
      <path d="M8 14h2M14 14h2M8 17h2" />
    </>
  ),
  couleurs: (
    <>
      <path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.4 0 2-.9 2-1.9 0-1.3-1-1.6-1-2.7 0-1 .8-1.8 2-1.8h2a3.5 3.5 0 0 0 3.5-3.6c0-4.3-3.8-7-8.5-7z" />
      <g fill="currentColor" stroke="none">
        <circle cx="7.8" cy="11" r="1.2" />
        <circle cx="11" cy="7.5" r="1.2" />
        <circle cx="15.3" cy="8.5" r="1.2" />
      </g>
    </>
  ),
  famille: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19.5a5.5 5.5 0 0 1 11 0" />
      <circle cx="17.2" cy="9.8" r="2.2" />
      <path d="M16.8 14.7a4 4 0 0 1 3.9 4.8" />
    </>
  ),
  // Niveau 2 · Conversation
  rencontre: (
    <>
      <path d="M3.5 4.5h11V12H8.5L6 14.5V12H3.5z" />
      <path d="M17.5 9h3v7.5h-2V19L16 16.5h-5V15" />
    </>
  ),
  debrouille: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="3.5" />
      <path d="M6 6l3.5 3.5M14.5 14.5 18 18M18 6l-3.5 3.5M9.5 14.5 6 18" />
    </>
  ),
  exprimer: <path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z" />,
  meteo: (
    <>
      <circle cx="8" cy="8" r="3" />
      <path d="M8 2.2v1.5M2.2 8h1.5M3.9 3.9 5 5M12.1 3.9 11 5" />
      <path d="M9.5 20.5h8a3.5 3.5 0 0 0 .3-7 5 5 0 0 0-9.5 1.2 3 3 0 0 0 1.2 5.8z" />
    </>
  ),
  heure: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  // Niveau 3 · Récits
  hotel: (
    <>
      <path d="M3.5 19V6" />
      <path d="M3.5 15h17v4" />
      <path d="M20.5 15v-2.5a3 3 0 0 0-3-3H10.5V15" />
      <circle cx="7" cy="11.5" r="1.7" />
    </>
  ),
  sante: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="4.5" />
      <path d="M12 8.2v7.6M8.2 12h7.6" />
    </>
  ),
  telephone: (
    <>
      <rect x="7" y="3" width="10" height="18" rx="2.5" />
      <path d="M11 17.7h2" />
    </>
  ),
  transport: (
    <>
      <rect x="5.5" y="3.5" width="13" height="13" rx="3" />
      <path d="M5.5 10h13" />
      <path d="M8.5 16.5 6.5 20.5M15.5 16.5l2 4" />
      <g fill="currentColor" stroke="none">
        <circle cx="9" cy="13.3" r="1" />
        <circle cx="15" cy="13.3" r="1" />
      </g>
    </>
  ),
  // Niveau 4 · Le quotidien
  ville: (
    <>
      <path d="M4 20.5V9.5l6-3" />
      <path d="M10 20.5v-16h9v16" />
      <path d="M13 8.5h3M13 12h3M13 15.5h3" />
      <path d="M2.5 20.5h19" />
    </>
  ),
  maison: (
    <>
      <path d="M3.5 11.5 12 4l8.5 7.5" />
      <path d="M6 9.8V20h12V9.8" />
      <path d="M10 20v-5.5h4V20" />
    </>
  ),
  corps: (
    <>
      <circle cx="12" cy="5" r="2.3" />
      <path d="M12 8.5V15M7 11h10M12 15l-3.5 6M12 15l3.5 6" />
    </>
  ),
  travail: (
    <>
      <rect x="3.5" y="7.5" width="17" height="12" rx="2.5" />
      <path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5" />
      <path d="M3.5 13h17" />
    </>
  ),
  // Niveau 5 · Nuances
  souvenirs: (
    <>
      <path d="M4.7 13.5a7.5 7.5 0 1 0 1.5-6" />
      <path d="M4 4.5v4h4" />
      <path d="M12 8.5V12l2.5 1.5" />
    </>
  ),
  projets: (
    <>
      <path d="M6 21V4" />
      <path d="M6 5h11.5L15 8.5l2.5 3.5H6" />
    </>
  ),
  opinions: (
    <>
      <path d="M8.7 14.5a6 6 0 1 1 6.6 0c-.5.4-.8 1.1-.8 2h-5c0-.9-.3-1.6-.8-2z" />
      <path d="M10 20h4" />
    </>
  ),
}

export const ICONES_LECONS = DESSINS

export const aUneIcone = (leconId) => Boolean(DESSINS[leconId])

// Décorative : la leçon est toujours nommée à côté.
export function IconeLecon({ id, taille = 22, trait = 1.8 }) {
  const dessin = DESSINS[id]
  if (!dessin) return null
  return (
    <svg
      width={taille}
      height={taille}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={trait}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {dessin}
    </svg>
  )
}
