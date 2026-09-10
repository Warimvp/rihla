// Les visuels de concepts : ce qu'un mot désigne, montré sans passer par le
// français ni par l'arabe. Indexés par id de concept — un concept est partagé
// par les 14 langues, donc « le thé » se dessine une fois pour شاي, çay, chá
// et お茶. Zéro octet dans langues.js, aucun champ ajouté aux mots : ce module
// est un index à part, et `langues.test.js` n'a rien à en savoir.
//
// Deux familles, deux usages :
//  • ENGENDRÉS par le code (couleurs, nombres, jours) : sans ambiguïté — cinq
//    khatams, c'est cinq — donc admis dans le QUIZ (exercice « voir » :
//    image → mot cible) ;
//  • DESSINÉS (pictogrammes de la ville, du corps, de la maison) : une aide au
//    verso de la carte-mot et sur la face « sens » du Zellige, jamais une
//    question notée — un dessin peut se lire de deux façons.
//
// Tout est en currentColor : c'est le contexte qui choisit l'encre (Majorelle
// sur papier, --sur-majorelle sur le verso), et le mode nuit suit tout seul.
// Seules les couleurs de la leçon « couleurs » sont fixes : le rouge doit
// rester rouge, de jour comme de nuit.
//
// Même grille que Icones.jsx, en 48 : tracé 2, bouts ronds, pas d'emoji.

const Cadre = ({ taille = 96, etiquette, className, children, ...reste }) => (
  <svg
    width={taille}
    height={taille}
    viewBox="0 0 48 48"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    role={etiquette ? 'img' : undefined}
    aria-label={etiquette}
    aria-hidden={etiquette ? undefined : true}
    className={className}
    {...reste}
  >
    {children}
  </svg>
)

// ————— Engendrés —————

// Un khatam (l'étoile à huit branches du thème) centré en (x, y), demi-côté r.
const Khatam = ({ x, y, r }) => (
  <g transform={`translate(${x} ${y})`} fill="currentColor" stroke="none">
    <rect x={-r} y={-r} width={2 * r} height={2 * r} rx={r * 0.15} />
    <rect x={-r} y={-r} width={2 * r} height={2 * r} rx={r * 0.15} transform="rotate(45)" />
  </g>
)

// n khatams sur une rangée (jusqu'à 5), deux rangées au-delà.
const Khatams = ({ n }) => {
  const parRangee = Math.min(n, 5)
  const rangees = Math.ceil(n / 5)
  const pas = 9
  const r = 3.4
  return Array.from({ length: n }, (_, i) => {
    const rangee = Math.floor(i / 5)
    const dansRangee = rangee === rangees - 1 ? n - rangee * 5 : parRangee
    const col = i % 5
    const x = 24 + (col - (dansRangee - 1) / 2) * pas
    const y = rangees === 1 ? 24 : 15 + rangee * 18
    return <Khatam key={i} x={x} y={y} r={r} />
  })
}

// Un aplat de la couleur elle-même, cerné pour tenir sur tout fond (le noir
// de nuit, le blanc de jour).
const Aplat = ({ couleur }) => <rect x="8" y="8" width="32" height="32" rx="8" fill={couleur} strokeOpacity="0.55" />

// Deux disques ; celui qu'on désigne est plein.
const Tailles = ({ grand }) => (
  <>
    <circle cx="17" cy="24" r="13" fill={grand ? 'currentColor' : 'none'} strokeOpacity={grand ? 1 : 0.5} />
    <circle cx="38" cy="24" r="5" fill={grand ? 'none' : 'currentColor'} strokeOpacity={grand ? 0.5 : 1} />
  </>
)

// Sept colonnes, lundi à gauche ; la CSS retourne la bande sous interface
// arabe pour que la semaine se lise dans le sens de la page.
const Semaine = ({ jour }) =>
  Array.from({ length: 7 }, (_, i) => (
    <rect
      key={i}
      x={2.3 + i * 6.4}
      y="12"
      width="5"
      height="24"
      rx="2"
      fill={i === jour ? 'currentColor' : 'none'}
      strokeOpacity={i === jour ? 1 : 0.4}
    />
  ))

const COULEURS = {
  rouge: '#c0392b',
  bleu: '#2f6fd6',
  vert: '#2e9e5b',
  jaune: '#f2c531',
  noir: '#1d1a17',
  blanc: '#ffffff',
}
const NOMBRES = { un: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, dix: 10 }
const JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche']

// ————— Dessinés (pilote : la ville, le corps, la maison) —————

const PICTOS = {
  // la ville
  rue: (
    <>
      <path d="M10 42 18 6" />
      <path d="M38 42 30 6" />
      <path d="M24 8v6M24 21v6M24 34v6" />
    </>
  ),
  banque: (
    <>
      <path d="M7 18 24 7l17 11" />
      <path d="M9 18h30" />
      <path d="M12 18v20M20 18v20M28 18v20M36 18v20" />
      <path d="M6 40h36" />
    </>
  ),
  poste: (
    <>
      <rect x="6" y="12" width="36" height="24" rx="3" />
      <path d="M6 14l18 13 18-13" />
    </>
  ),
  musee: (
    <>
      <rect x="7" y="9" width="34" height="30" rx="2" />
      <path d="M12 33l8-10 6 7 4-4 6 7" />
      <circle cx="32" cy="17" r="2.5" />
    </>
  ),
  mosquee: (
    <>
      <path d="M12 27a12 12 0 0 1 24 0" />
      <path d="M10 27h28v14H10z" />
      <path d="M39 17h5v24h-5z" />
      <path d="M39 17a2.5 2.5 0 0 1 5 0" />
      <path d="M21 41v-6a3 3 0 0 1 6 0v6" />
      <path d="M24 15v-3" />
      <path d="M6 41h38" />
    </>
  ),
  jardin: (
    <>
      <path d="M24 42V26" />
      <path d="M13 26a11 11 0 0 1 4-15 8 8 0 0 1 14 0 11 11 0 0 1 4 15z" />
      <path d="M8 42h32" />
    </>
  ),
  magasin: (
    <>
      <path d="M8 20v22h32V20" />
      <path d="M6 12h36l-3 8H9z" />
      <path d="M20 42V31h8v11" />
    </>
  ),
  plage: (
    <>
      <circle cx="36" cy="12" r="5" />
      <path d="M6 32c4-4 8-4 12 0s8 4 12 0 8-4 12 0" />
      <path d="M6 40c4-4 8-4 12 0s8 4 12 0 8-4 12 0" />
      <path d="M15 30V16" />
      <path d="M6 17a9 9 0 0 1 18 0z" />
    </>
  ),
  // le corps
  tete: (
    <>
      <circle cx="24" cy="18" r="11" />
      <path d="M13 42c0-6 5-9 11-9s11 3 11 9" />
    </>
  ),
  main: (
    <>
      <path d="M17 26V12a2.5 2.5 0 0 1 5 0v12M22 24V9a2.5 2.5 0 0 1 5 0v15M27 24V11a2.5 2.5 0 0 1 5 0v13" />
      <path d="M32 24V15a2.5 2.5 0 0 1 5 0v14c0 7-5 13-12 13-5 0-8-3-11-8l-5-8a2.5 2.5 0 0 1 4-3l4 5v-2" />
    </>
  ),
  pied: (
    // Une empreinte : la plante et cinq orteils. Un pied de profil se lisait
    // comme une botte.
    <>
      <path d="M24 44c-6 0-10-6-10-14 0-7 4-12 10-12s10 5 10 12c0 8-4 14-10 14z" />
      <circle cx="12" cy="13" r="2.5" />
      <circle cx="18" cy="8.5" r="2.7" />
      <circle cx="25" cy="7" r="2.7" />
      <circle cx="32" cy="8.5" r="2.5" />
      <circle cx="37" cy="13" r="2.2" />
    </>
  ),
  oeil: (
    <>
      <path d="M4 24c5-8 12-12 20-12s15 4 20 12c-5 8-12 12-20 12S9 32 4 24z" />
      <circle cx="24" cy="24" r="6" />
      <circle cx="24" cy="24" r="2" fill="currentColor" stroke="none" />
    </>
  ),
  coeur: <path d="M24 41C24 41 6 29 6 17a9 9 0 0 1 18-3 9 9 0 0 1 18 3c0 12-18 24-18 24z" />,
  dos: (
    <>
      <circle cx="24" cy="10" r="5" />
      <path d="M10 42V29a14 14 0 0 1 28 0v13" />
      <path d="M24 20v18" />
      <path d="M20 26h8M20 32h8" />
    </>
  ),
  ventre: (
    <>
      <path d="M15 6c-1 10-7 13-7 23a16 16 0 0 0 32 0c0-10-6-13-7-23" />
      <circle cx="24" cy="31" r="1.6" fill="currentColor" stroke="none" />
    </>
  ),
  dent: (
    <path d="M16 7c-6 0-9 5-9 10 0 7 4 8 5 15 1 6 2 9 4 9s3-8 5-8 4 8 6 8 3-3 4-9c1-7 5-8 5-15 0-5-3-10-9-10-3 0-4 2-6 2s-2-2-5-2z" />
  ),
  // la maison
  maison: (
    <>
      <path d="M6 22 24 6l18 16" />
      <path d="M10 20v22h28V20" />
      <path d="M20 42V30h8v12" />
    </>
  ),
  porte: (
    <>
      <path d="M12 42V8h24v34" />
      <path d="M8 42h32" />
      <circle cx="30" cy="26" r="1.6" fill="currentColor" stroke="none" />
    </>
  ),
  fenetre: (
    <>
      <rect x="8" y="8" width="32" height="32" rx="2" />
      <path d="M24 8v32M8 24h32" />
    </>
  ),
  cuisine: (
    <>
      <path d="M10 22h28" />
      <path d="M12 22v11a5 5 0 0 0 5 5h14a5 5 0 0 0 5-5V22" />
      <path d="M6 25h5M37 25h5" />
      <path d="M15 17h18" />
      <path d="M24 12v5" />
    </>
  ),
  lit: (
    <>
      <path d="M6 40V22h36v18" />
      <path d="M6 32h36" />
      <path d="M10 22v-6a2 2 0 0 1 2-2h24a2 2 0 0 1 2 2v6" />
      <path d="M12 32v-6h10v6" />
    </>
  ),
  cle: (
    <>
      <circle cx="14" cy="24" r="8" />
      <path d="M22 24h20M35 24v6M41 24v4" />
    </>
  ),
  lumiere: (
    <>
      <path d="M24 6a11 11 0 0 1 7 19.5c-2 1.5-3 3-3 5.5h-8c0-2.5-1-4-3-5.5A11 11 0 0 1 24 6z" />
      <path d="M20 36h8M21 41h6" />
    </>
  ),
}

// ————— L'index —————
// `quiz` : admis comme question « voir ». Les dessins ne le sont pas.

const VISUELS = {
  ...Object.fromEntries(
    Object.entries(COULEURS).map(([id, couleur]) => [id, { quiz: true, dessin: () => <Aplat couleur={couleur} /> }])
  ),
  grand: { quiz: true, dessin: () => <Tailles grand /> },
  petit: { quiz: true, dessin: () => <Tailles grand={false} /> },
  ...Object.fromEntries(Object.entries(NOMBRES).map(([id, n]) => [id, { quiz: true, dessin: () => <Khatams n={n} /> }])),
  ...Object.fromEntries(
    JOURS.map((id, i) => [id, { quiz: true, classe: 'visuel-semaine', dessin: () => <Semaine jour={i} /> }])
  ),
  ...Object.fromEntries(Object.entries(PICTOS).map(([id, dessin]) => [id, { quiz: false, dessin: () => dessin }])),
}

export const IDS_VISUELS = Object.keys(VISUELS)
export const IDS_VISUELS_DE_QUIZ = IDS_VISUELS.filter((id) => VISUELS[id].quiz)

// Y a-t-il un visuel pour ce concept ? (carte-mot, Zellige)
export const aUnVisuel = (id) => Boolean(VISUELS[id])

// Ce visuel peut-il servir de question ? (exercice « voir »)
export const visuelDeQuiz = (id) => Boolean(VISUELS[id]?.quiz)

// Le visuel d'un concept. `etiquette` : le sens, pour les lecteurs d'écran —
// sans étiquette le dessin est décoratif (un texte l'accompagne déjà).
export function VisuelConcept({ id, taille, etiquette, className, ...reste }) {
  const visuel = VISUELS[id]
  if (!visuel) return null
  const classes = [visuel.classe, className].filter(Boolean).join(' ') || undefined
  return (
    <Cadre taille={taille} etiquette={etiquette} className={classes} {...reste}>
      {visuel.dessin()}
    </Cadre>
  )
}
