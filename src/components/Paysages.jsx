// Paysages de destination : l'image d'une ville, composée par le code — un
// ciel à une heure du jour, un astre, un relief au loin, quelques toits, le
// sol ou l'eau, et au milieu le monument de la vignette (Vignettes.jsx), en
// grand. Zéro octet d'image, zéro requête : l'app reste entière hors-ligne.
//
// Les règles des vignettes valent ici aussi, et le test les garde :
//   • aucune couleur nationale — la couleur vient de l'HEURE (aube, jour,
//     crépuscule), jamais du pays, et toujours des jetons du thème : pas un
//     hex dans le rendu, donc le mode nuit suit tout seul ;
//   • aucun emblème : l'astre est un disque, jamais un croissant ;
//   • le monument reste celui de la ville, d'avant le 20e siècle.
//
// Tout est dessiné par rapport à la LIGNE DE SOL (y = 0, le haut en négatif),
// puis posé à la hauteur voulue : le même paysage sert en grand (l'en-tête
// d'une destination) et en bandeau (l'accueil, le choix du cap).
import { VignetteVille } from './Vignettes.jsx'

const LARGEUR = 320

const FORMATS = {
  // hauteur du tableau, ligne de sol, taille du monument, centre de l'astre
  grand: { hauteur: 150, sol: 114, monument: 118, astre: { x: 256, y: 42, r: 17 } },
  bandeau: { hauteur: 112, sol: 86, monument: 90, astre: { x: 262, y: 32, r: 13 } },
}

// Le relief au loin.
const RELIEFS = {
  montagnes: 'M0 0V-28L24-50 42-37 68-64 96-33 122-46 150-26 178-39 216-68 246-35 270-49 296-29 320-43V0Z',
  collines: 'M0 0V-20Q42-44 86-23T170-25T252-29T320-19V0Z',
  dunes: 'M0 0V-13Q50-35 104-13Q150-29 200-11Q262-33 320-11V0Z',
  plaine: 'M0 0V-7Q80-13 160-7T320-9V0Z',
  mer: null,
}

// Quelques toits de part et d'autre du monument (le milieu lui est laissé).
const VILLES = {
  // Maisons à pignon et cheminées.
  toits:
    'M6 0V-17l9-9 9 9V0ZM27 0V-25l8-8 8 8V0ZM38-31v-7h4v11ZM46 0V-15h20V0ZM69 0V-21l8-8 8 8V0Z' +
    'M232 0V-19l9-9 9 9V0ZM253 0V-13h18V0ZM274 0V-27l9-9 9 9V0ZM286-34v-8h4v12ZM295 0V-16l9-8 9 8V0Z',
  // Toits plats, une coupole, une tour mince.
  medina:
    'M6 0V-15h17V0ZM26 0V-23h15V0ZM44 0V-13h13V0ZM60 0V-13a9 9 0 0 1 18 0V0ZM82 0V-31l3-5 3 5V0Z' +
    'M230 0V-29l3-5 3 5V0ZM240 0V-14h16V0ZM259 0V-22h14V0ZM276 0V-12a10 10 0 0 1 20 0V0ZM299 0V-17h15V0Z',
  // Toits aux bords relevés.
  pavillons:
    'M10 0V-11h24V0ZM5-11q17-13 34 0ZM44 0V-17h20V0ZM39-17q15-12 30 0ZM72 0V-9h18V0ZM68-9q13-10 26 0Z' +
    'M232 0V-10h20V0ZM227-10q15-12 30 0ZM258 0V-18h22V0ZM253-18q16-13 32 0ZM288 0V-10h22V0ZM284-10q15-11 30 0Z',
  // La steppe : trois yourtes, rien d'autre jusqu'à l'horizon.
  steppe: 'M18 0v-5a13 9 0 0 1 26 0v5ZM58 0v-4a10 7 0 0 1 20 0v4ZM262 0v-5a14 10 0 0 1 28 0v5Z',
  cote: null,
}

// La côte swahilie : des palmiers, en traits.
const PALMIERS = [
  { x: 34, h: 34 },
  { x: 62, h: 24 },
  { x: 272, h: 30 },
  { x: 294, h: 20 },
]

// Une scène par ville. `sol` : la ligne du sol dans la grille 64 de la
// vignette (là où le monument touche terre, ou l'eau pour un pont, un boutre).
// `eau` : le premier plan est de l'eau — seulement là où la vignette en
// dessine déjà, pour qu'aucun monument ne se retrouve les pieds dans le fleuve.
const SCENES = {
  es: { moment: 'crepuscule', relief: 'montagnes', ville: 'medina', sol: 54 },
  pt: { moment: 'jour', relief: 'collines', ville: 'toits', sol: 54, eau: true },
  fr: { moment: 'aube', relief: 'plaine', ville: 'toits', sol: 52, eau: true },
  it: { moment: 'crepuscule', relief: 'mer', ville: 'toits', sol: 50, eau: true },
  de: { moment: 'jour', relief: 'collines', ville: 'toits', sol: 54 },
  en: { moment: 'aube', relief: 'plaine', ville: 'toits', sol: 54 },
  tr: { moment: 'crepuscule', relief: 'collines', ville: 'medina', sol: 54 },
  ar: { moment: 'jour', relief: 'dunes', ville: 'medina', sol: 52 },
  ru: { moment: 'aube', relief: 'plaine', ville: 'steppe', sol: 52, eau: true },
  fa: { moment: 'crepuscule', relief: 'montagnes', ville: 'medina', sol: 46, eau: true },
  sw: { moment: 'jour', relief: 'mer', ville: 'cote', sol: 54, eau: true },
  hi: { moment: 'aube', relief: 'plaine', ville: 'medina', sol: 54 },
  zh: { moment: 'jour', relief: 'collines', ville: 'pavillons', sol: 54 },
  ko: { moment: 'crepuscule', relief: 'montagnes', ville: 'pavillons', sol: 54 },
  ja: { moment: 'aube', relief: 'collines', ville: 'pavillons', sol: 54 },
}

export const MOMENTS = ['aube', 'jour', 'crepuscule']

export const sceneDe = (langueId) => SCENES[langueId] ?? null

export const aUnPaysage = (langueId) => Boolean(SCENES[langueId])

// Le khatam (deux carrés croisés), l'étoile de l'app.
const Khatam = ({ x, y, r }) => (
  <g>
    <rect x={x - r} y={y - r} width={2 * r} height={2 * r} />
    <rect x={x - r} y={y - r} width={2 * r} height={2 * r} transform={`rotate(45 ${x} ${y})`} />
  </g>
)

const Ciel = ({ moment }) =>
  moment === 'jour' ? (
    <g className="paysage__nuage">
      <path d="M44 36h30a7 7 0 0 0 0-14 11 11 0 0 0-21-3 9 9 0 0 0-9 17z" />
      <path d="M136 24h20a5 5 0 0 0 0-10 8 8 0 0 0-15-2 6 6 0 0 0-5 12z" opacity=".7" />
    </g>
  ) : moment === 'aube' ? (
    <g className="paysage__oiseaux">
      <path d="M52 34q5-6 9 0q4-6 9 0M82 22q4-5 7 0q3-5 7 0M30 22q3-4 6 0q3-4 6 0" />
    </g>
  ) : (
    <g className="paysage__etoiles">
      <Khatam x={40} y={24} r={3} />
      <Khatam x={92} y={14} r={2} />
      <Khatam x={150} y={26} r={2.2} />
      <Khatam x={204} y={12} r={1.8} />
    </g>
  )

const VAGUES = 'M0 0c8-4 16 4 24 0s16 4 24 0 16 4 24 0 16 4 24 0 16 4 24 0 16 4 24 0 16 4 24 0 16 4 24 0 16 4 24 0 16 4 24 0 16 4 24 0 16 4 24 0 16 4 24 0 16 4 24 0'

// La course de l'astre, de l'horizon à l'horizon : 0 = il se lève à un bord,
// 0,5 = il est au plus haut, 1 = il se couche à l'autre. Rend le DÉPLACEMENT
// à appliquer à l'astre dessiné à sa place ordinaire.
export function courseAstre(format, course) {
  const f = FORMATS[format] ?? FORMATS.grand
  const p = Math.max(0, Math.min(1, course))
  const x = 34 + p * (LARGEUR - 68)
  // Sous l'horizon aux deux bouts (le sol le cache), au zénith à mi-course.
  const y = f.sol + f.astre.r - Math.sin(Math.PI * p) * (f.sol + f.astre.r - (f.astre.r + 8))
  return { dx: Math.round((x - f.astre.x) * 10) / 10, dy: Math.round((y - f.astre.y) * 10) / 10 }
}

/**
 * Le paysage d'une destination. Décoratif par défaut ; avec `titre` (le nom
 * de la ville), c'est une image nommée pour les lecteurs d'écran.
 *
 * `moment` remplace l'heure de la scène, `course` (0 → 1) fait voyager
 * l'astre d'un horizon à l'autre : c'est l'horloge du Souk.
 */
export function Paysage({ langue, langueId = langue?.id, format = 'grand', titre, className, style, moment, course }) {
  const sceneDeBase = SCENES[langueId]
  if (!sceneDeBase) return null
  const scene = moment && MOMENTS.includes(moment) ? { ...sceneDeBase, moment } : sceneDeBase
  const f = FORMATS[format] ?? FORMATS.grand
  const echelle = f.monument / 64
  const bas = f.hauteur - f.sol
  const deplacement = course === undefined ? null : courseAstre(format, course)
  return (
    <svg
      viewBox={`0 0 ${LARGEUR} ${f.hauteur}`}
      preserveAspectRatio="xMidYMax slice"
      role={titre ? 'img' : undefined}
      aria-label={titre}
      aria-hidden={titre ? undefined : true}
      className={`paysage paysage--${scene.moment}${className ? ` ${className}` : ''}`}
      style={style}
    >
      <rect className="paysage__ciel" width={LARGEUR} height={f.hauteur} />
      {deplacement ? (
        <g className="paysage__course" style={{ transform: `translate(${deplacement.dx}px, ${deplacement.dy}px)` }}>
          <circle className="paysage__astre" cx={f.astre.x} cy={f.astre.y} r={f.astre.r} />
        </g>
      ) : (
        <circle className="paysage__astre" cx={f.astre.x} cy={f.astre.y} r={f.astre.r} />
      )}
      <Ciel moment={scene.moment} />
      <g transform={`translate(0 ${f.sol})`}>
        {RELIEFS[scene.relief] ? (
          <path className={`paysage__relief paysage__relief--${scene.relief}`} d={RELIEFS[scene.relief]} />
        ) : null}
        {VILLES[scene.ville] ? <path className="paysage__ville" d={VILLES[scene.ville]} /> : null}
        {scene.ville === 'cote' ? (
          <g className="paysage__palmes">
            {PALMIERS.map(({ x, h }) => (
              <path
                key={x}
                d={`M${x} 0q5-${h / 2} 0-${h}m0 0q-9-7-16 1m16-1q-3-10-13-11m13 11q9-7 16 1m-16-1q3-10 13-11`}
              />
            ))}
          </g>
        ) : null}
        <rect className={scene.eau ? 'paysage__eau' : 'paysage__sol'} width={LARGEUR} height={bas} />
        {scene.eau ? (
          <g className="paysage__vagues">
            <path d={VAGUES} transform={`translate(-6 ${bas * 0.45})`} />
            <path d={VAGUES} transform={`translate(-18 ${bas * 0.8})`} opacity=".6" />
          </g>
        ) : (
          <path className="paysage__chemin" d={`M0 ${bas * 0.55}H${LARGEUR}`} />
        )}
      </g>
      {/* Le monument, deux fois : d'abord un contour épais à la couleur du
          ciel, qui le détache du relief ; puis le trait, à l'encre. Le
          contour vit dans un <svg> imbriqué qui le COUPE à la ligne de sol
          (un svg imbriqué rogne ce qui dépasse, sans clipPath ni id à rendre
          unique) : il ne bave pas sur le sol. L'eau de la vignette est
          effacée par la feuille de style — le paysage a la sienne. */}
      <svg width={LARGEUR} height={f.sol - 1}>
        <VignetteVille
          langueId={langueId}
          x={(LARGEUR - f.monument) / 2}
          y={f.sol - scene.sol * echelle}
          taille={f.monument}
          trait={5.2}
          className="paysage__halo"
        />
      </svg>
      <VignetteVille
        langueId={langueId}
        x={(LARGEUR - f.monument) / 2}
        y={f.sol - scene.sol * echelle}
        taille={f.monument}
        trait={1.7}
        className="paysage__monument"
      />
    </svg>
  )
}
