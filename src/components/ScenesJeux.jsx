// Les décors des jeux du voyage : chacun a son image, et l'image dit où on en
// est — le soleil du Souk se couche avec le chrono, la caravane avance d'un
// mot à l'autre vers la ville, le zellige se défait sur l'image de la
// destination. Tout est dessiné par le code, en jetons du thème (le mode nuit
// suit), et tout est DÉCORATIF : l'information est toujours écrite à côté
// (le temps en secondes, « Mot 3 sur 8 », « 2/6 paires »).
import { Paysage } from './Paysages.jsx'
import { VignetteVille } from './Vignettes.jsx'

// ————— Le Souk : le jour passe —————
// Le chrono est un soleil : il se lève à l'ouverture du souk, culmine à
// mi-partie et se couche quand le souk ferme. L'heure de la scène suit.
export const momentDuSouk = (reste, duree) => {
  const ecoule = 1 - reste / duree
  return ecoule < 0.2 ? 'aube' : ecoule < 0.78 ? 'jour' : 'crepuscule'
}

export function CielDuSouk({ langue, reste, duree }) {
  return (
    <div className="scene-jeu">
      <Paysage langue={langue} format="bandeau" moment={momentDuSouk(reste, duree)} course={1 - reste / duree} />
    </div>
  )
}

// ————— La Caravane : trois dromadaires vers la ville —————

const DROMADAIRE =
  'M6 21C6 16 10 15 13 14C15 8 17 5 20 5C23 5 25 9 27 14C29 15 30 15 31 13L34.5 5.5C35 4 36 3.5 37.5 3.5L42 4.5C43.5 5 43.5 7.5 42 8L38.5 8.5L36 17C35.5 20 34 22 32.5 23V34H30V25H28.5V34H26V25C22 26.5 18 26.5 15.5 25V34H13V25.5H11.5V34H9V24C7 23 6 22 6 21Z'

// Le dromadaire seul (le médaillon du jeu) : même silhouette, en currentColor.
export function Dromadaire({ taille = 28 }) {
  return (
    <svg width={taille} height={(taille * 36) / 48} viewBox="0 0 48 36" fill="currentColor" aria-hidden="true">
      <path d={DROMADAIRE} />
    </svg>
  )
}

const LARGEUR = 320
const HAUTEUR = 96
const SOL = 74
const DEPART = 6
const ARRIVEE = 176

// La position de la caravane : 0 au départ, 1 aux portes de la ville.
export const avanceeCaravane = (etape, total) => Math.max(0, Math.min(1, total > 0 ? etape / total : 0))

export function PisteCaravane({ langue, etape, total }) {
  const avancee = avanceeCaravane(etape, total)
  const x = DEPART + avancee * (ARRIVEE - DEPART)
  return (
    <div className="scene-jeu">
      <svg
        viewBox={`0 0 ${LARGEUR} ${HAUTEUR}`}
        className={`paysage paysage--${avancee >= 1 ? 'crepuscule' : 'aube'} scene-caravane`}
        aria-hidden="true"
      >
        <rect className="paysage__ciel" width={LARGEUR} height={HAUTEUR} />
        <circle className="paysage__astre" cx="58" cy="26" r="13" />
        <g transform={`translate(0 ${SOL})`}>
          <path className="paysage__relief paysage__relief--dunes" d="M0 0V-16Q46-40 98-16Q150-34 204-13Q262-36 320-14V0Z" />
          <path className="paysage__ville" d="M0 0V-6Q60-20 126-7T250-9Q290-16 320-6V0Z" opacity=".55" />
          <rect className="paysage__sol" width={LARGEUR} height={HAUTEUR - SOL} />
          <path className="paysage__chemin" d={`M0 ${(HAUTEUR - SOL) * 0.5}H${LARGEUR}`} />
        </g>
        {/* La ville au bout de la piste : son monument, celui de la vignette. */}
        <svg width={LARGEUR} height={SOL - 1}>
          <VignetteVille langueId={langue.id} x={252} y={SOL - 54 * 0.95} taille={60.8} trait={5} className="paysage__halo" />
        </svg>
        <VignetteVille langueId={langue.id} x={252} y={SOL - 54 * 0.95} taille={60.8} trait={1.9} className="paysage__monument" />
        {/* La caravane : elle avance par translation, d'un mot réussi à l'autre. */}
        <g className="caravane" style={{ transform: `translateX(${Math.round(x)}px)` }}>
          <path className="caravane__longe" d={`M14 ${SOL - 17}H66`} />
          <path className="caravane__bete" d={DROMADAIRE} transform={`translate(0 ${SOL - 34 * 0.62}) scale(.62)`} />
          <path className="caravane__bete" d={DROMADAIRE} transform={`translate(27 ${SOL - 34 * 0.62}) scale(.62)`} />
          <path className="caravane__bete caravane__bete--tete" d={DROMADAIRE} transform={`translate(54 ${SOL - 34 * 0.74}) scale(.74)`} />
        </g>
      </svg>
    </div>
  )
}

// ————— L'Oreille : le son fait des ronds —————
// `actives` éteint les ronds sans démonter ce qu'ils entourent : le bouton
// d'écoute se prononce à son arrivée, le remonter le ferait parler deux fois.
export function OndesOreille({ actives = true, children }) {
  return (
    <span className="ondes">
      {actives ? <span className="ondes__rond" aria-hidden="true"></span> : null}
      {actives ? <span className="ondes__rond ondes__rond--2" aria-hidden="true"></span> : null}
      {actives ? <span className="ondes__rond ondes__rond--3" aria-hidden="true"></span> : null}
      {children}
    </span>
  )
}

// ————— Le Zellige : le dos des tuiles —————
// Quatre teintes qui tournent en diagonale : posées côte à côte, les tuiles
// font une mosaïque. Au centre le khatam, aux coins des quarts de rosace qui
// se rejoignent d'une tuile à l'autre.
export const TEINTES_ZELLIGE = 4

export const teinteZellige = (index, colonnes = 3) => (Math.floor(index / colonnes) + (index % colonnes)) % TEINTES_ZELLIGE

export function DosZellige({ teinte = 0 }) {
  return (
    <svg className={`dos-zellige dos-zellige--${teinte}`} viewBox="0 0 60 60" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect className="dos-zellige__fond" width="60" height="60" />
      <g className="dos-zellige__trait">
        <rect x="19" y="19" width="22" height="22" />
        <rect x="19" y="19" width="22" height="22" transform="rotate(45 30 30)" />
        <path d="M0 14L14 0M46 0l14 14M60 46L46 60M14 60L0 46" />
        <path d="M30 0v8.5M30 51.5V60M0 30h8.5M51.5 30H60" />
      </g>
      <g className="dos-zellige__plein">
        <rect x="26" y="26" width="8" height="8" />
        <rect x="26" y="26" width="8" height="8" transform="rotate(45 30 30)" />
      </g>
    </svg>
  )
}
