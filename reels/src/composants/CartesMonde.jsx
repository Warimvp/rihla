import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion'
import { Easing } from 'remotion'
import { entre, prog, sortieDouce, entreeSortie } from '../anim.js'
import { C, POLICE_LATIN, POLICE_TITRE, POLICE_UI, sec } from '../theme.js'
import { LIEUX, TERRE_50, cheminGrille, cheminTerre, projeter } from '../geo.js'

// ————— La carte parchemin : le détroit, puis la Méditerranée —————
// Projection fixe (40 px par degré) ; seule la « caméra » se déplace vers l'est.
const PARCHEMIN = projeter({ px: 40, origine: LIEUX.tanger, x0: 140, y0: 1095, clip: [[-300, -300], [2600, 2300]] })
const CHEMIN_PARCHEMIN = cheminTerre(PARCHEMIN, TERRE_50)

const point = (p, [lon, lat]) => p([lon, lat])

// La route d'Ibn Battuta vers l'est, le long de la côte.
const ROUTE_PARCHEMIN = ['tanger', 'oran', 'alger', 'tunis', 'tripoli', 'alexandrie'].map((k) => point(PARCHEMIN, LIEUX[k]))
const dPoly = (pts) => pts.reduce((d, [x, y], i) => `${d}${i ? 'L' : 'M'}${x.toFixed(1)} ${(y - (i && i < pts.length - 1 ? 22 : 0)).toFixed(1)} `, '')

export const IconeApp = ({ taille, rayon = 0.225, ombre = true }) => (
  <Img
    src={staticFile('icon-1024.png')}
    style={{
      width: taille,
      height: taille,
      borderRadius: taille * rayon,
      boxShadow: ombre ? `0 ${taille * 0.08}px ${taille * 0.22}px rgba(20,14,70,0.35)` : 'none',
      display: 'block',
    }}
  />
)

// Le logo de l'app (public/icons/icon.svg) en pastille : l'étoile à huit branches, un cadran, l'aiguille.
export const Boussole = ({ taille }) => (
  <svg width={taille} height={taille} viewBox="0 0 120 120" style={{ display: 'block', filter: 'drop-shadow(0 6px 10px rgba(40,30,100,0.35))' }}>
    <g fill="#4e46c8">
      <rect x="29" y="29" width="62" height="62" rx="9" />
      <rect x="29" y="29" width="62" height="62" rx="9" transform="rotate(45 60 60)" />
    </g>
    <circle cx="60" cy="60" r="21" fill="#f7f0e3" />
    <polygon points="73,47 63.8,63.8 56.2,56.2" fill="#e9a319" />
    <polygon points="47,73 56.2,56.2 63.8,63.8" fill="#2b1e12" />
    <circle cx="60" cy="60" r="3" fill="#f7f0e3" />
  </svg>
)

export const CarteParchemin = ({ textes }) => {
  const frame = useCurrentFrame()
  // La caméra part du détroit et glisse vers le Levant.
  const cam = entre(frame, [0, sec(2.8)], [240, -580], Easing.bezier(0.45, 0, 0.35, 1))
  const trace = prog(frame, sec(0.2), sec(2.8), entreeSortie)
  const [tx, ty] = point(PARCHEMIN, LIEUX.tanger)
  const [mx, my] = point(PARCHEMIN, [17, 34.2])

  return (
    <AbsoluteFill style={{ background: '#d8be8a' }}>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{ display: 'block' }}>
        <defs>
          <filter id="pg-papier" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" seed="9" />
            <feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.32  0 0 0 0 0.15  0 0 0 0.6 0" />
          </filter>
          <radialGradient id="pg-vignette" cx="0.5" cy="0.5" r="0.75">
            <stop offset="0.55" stopColor="#c89f5d" stopOpacity="0" />
            <stop offset="1" stopColor="#b98a47" stopOpacity="0.32" />
          </radialGradient>
          <filter id="pg-flou"><feGaussianBlur stdDeviation="9" /></filter>
        </defs>
        <rect width="1080" height="1920" fill="#ece3cf" />
        <g transform={`translate(${cam} 0)`}>
          {/* la mer est claire ; un liseré plus sombre longe chaque côte (côté eau), la terre est le papier */}
          <path d={CHEMIN_PARCHEMIN} fill="none" stroke="#cdbf9b" strokeWidth="40" strokeLinejoin="round" opacity="0.85" filter="url(#pg-flou)" />
          <path d={CHEMIN_PARCHEMIN} fill="none" stroke="#bfae85" strokeWidth="22" strokeLinejoin="round" opacity="0.7" />
          <path d={CHEMIN_PARCHEMIN} fill="#dcc18b" stroke="#6f5b3d" strokeWidth="2.6" strokeLinejoin="round" />

          {/* nom de la mer */}
          <text
            x={mx}
            y={my}
            textAnchor="middle"
            fontFamily={POLICE_TITRE}
            fontSize="30"
            fill="#a68a5d"
            letterSpacing="6"
            opacity="0.9"
            style={{ direction: 'rtl' }}
          >
            {textes.mer}
          </text>

          {/* la route, en pointillés, qui se dessine */}
          <path
            d={dPoly(ROUTE_PARCHEMIN)}
            fill="none"
            stroke="#b5382a"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="16 12"
            mask="url(#pg-masque)"
          />
          <mask id="pg-masque">
            <path d={dPoly(ROUTE_PARCHEMIN)} fill="none" stroke="#fff" strokeWidth="20" pathLength="1" strokeDasharray={`${trace} 1.001`} />
          </mask>

          {/* Tanger */}
          <circle cx={tx} cy={ty} r="9" fill="#b5382a" stroke="#fdf8ee" strokeWidth="3.5" />
          <text x={tx + 18} y={ty - 20} fontFamily={POLICE_UI} fontWeight="600" fontSize="26" fill="#5b4326" style={{ direction: 'rtl' }}>
            {textes.tanger}
          </text>
        </g>
        <rect width="1080" height="1920" filter="url(#pg-papier)" opacity="0.35" />
        <rect width="1080" height="1920" fill="url(#pg-vignette)" />
      </svg>
      <div style={{ position: 'absolute', left: 105, top: 1455 }}>
        <Boussole taille={120} />
      </div>
    </AbsoluteFill>
  )
}

// ————— La carte sombre : toute la route d'un coup —————
// 6,7 px par degré : de Tanger (x≈70) à Tokyo (x≈1050). La caméra part serrée sur la Méditerranée puis recule.
const PX_SOMBRE = 6.73
const SOMBRE = projeter({ px: PX_SOMBRE, origine: LIEUX.tanger, x0: 70, y0: 1135, clip: [[-1500, -400], [3000, 3200]] })
const TERRE_SOMBRE = cheminTerre(SOMBRE, TERRE_50)
const GRILLE_SOMBRE = cheminGrille(SOMBRE, 10)

// Les villes de la route, dans l'ordre des km ; `etiquette` : [clé du nom, dx, dy, ancre].
const ROUTE_SOMBRE = [
  { id: 'grenade', t: 0.0, nom: 'grenade', natif: null, dx: 8, dy: -48, ancre: 'middle' },
  { id: 'lisbonne', t: 0.06 },
  { id: 'paris', t: 0.12 },
  { id: 'venise', t: 0.18 },
  { id: 'vienne', t: 0.22 },
  { id: 'londres', t: 0.26 },
  { id: 'istanbul', t: 0.32, nom: 'istanbul', natif: 'İstanbul', dx: -16, dy: -34, ancre: 'end' },
  { id: 'caire', t: 0.4, nom: 'caire', natif: null, dx: 18, dy: 30, ancre: 'start' },
  { id: 'sarai', t: 0.48, nom: 'sarai', natif: 'Сарай', dx: 14, dy: -22, ancre: 'start' },
  { id: 'ispahan', t: 0.55, nom: 'ispahan', natif: null, dx: 14, dy: 34, ancre: 'start' },
  { id: 'mombasa', t: 0.62, nom: 'mombasa', natif: 'Mombasa', dx: 14, dy: 30, ancre: 'start' },
  { id: 'delhi', t: 0.7, nom: 'delhi', natif: 'दिल्ली', dx: 14, dy: 32, ancre: 'start' },
  { id: 'pekin', t: 0.8 },
  { id: 'seoul', t: 0.86 },
  { id: 'tokyo', t: 0.92, nom: 'tokyo', natif: '東京', dx: -14, dy: 36, ancre: 'end' },
]

const arc = (a, b, courbure = 0.16) => {
  const mx = (a[0] + b[0]) / 2
  const my = (a[1] + b[1]) / 2
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const long = Math.hypot(dx, dy)
  // le contrôle se lève vers le nord : les arcs partent en éventail, comme sur les cartes de vol
  const cx = mx + (dy / long) * long * courbure * 0.4
  const cy = my - long * courbure
  return `M${a[0].toFixed(1)} ${a[1].toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${b[0].toFixed(1)} ${b[1].toFixed(1)}`
}

export const CarteSombre = ({ textes }) => {
  const frame = useCurrentFrame()
  const [x0, y0] = SOMBRE(LIEUX.tanger)
  // zoom : serré (×2,3) sur la Méditerranée, puis recul jusqu'à la route entière
  const zoom = entre(frame, [sec(0.4), sec(3.9)], [2.3, 1], Easing.bezier(0.5, 0, 0.2, 1))
  const cx = entre(frame, [sec(0.4), sec(3.9)], [380, 540], Easing.bezier(0.5, 0, 0.2, 1))
  const cy = entre(frame, [sec(0.4), sec(3.9)], [1090, 1100], Easing.bezier(0.5, 0, 0.2, 1))
  const debutRoutes = sec(1.0)
  const finRoutes = sec(3.9)

  return (
    <AbsoluteFill style={{ background: C.nuit }}>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{ display: 'block' }}>
        <defs>
          <filter id="cs-lueur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="f" />
            <feMerge><feMergeNode in="f" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <g transform={`translate(${cx} ${cy}) scale(${zoom}) translate(${-cx} ${-cy})`}>
          <path d={GRILLE_SOMBRE} fill="none" stroke="#4e46c8" strokeOpacity="0.26" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          <path d={TERRE_SOMBRE} fill="#251c16" stroke="#7970ee" strokeOpacity="0.95" strokeWidth="1.8" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />

          {ROUTE_SOMBRE.map((v) => {
            const p = prog(frame, debutRoutes + v.t * (finRoutes - debutRoutes), debutRoutes + v.t * (finRoutes - debutRoutes) + sec(0.9), Easing.bezier(0.3, 0, 0.2, 1))
            if (p <= 0) return null
            const dest = SOMBRE(LIEUX[v.id])
            return (
              <g key={v.id}>
                <path
                  d={arc([x0, y0], dest, 0.17)}
                  fill="none"
                  stroke="#f0ad1d"
                  strokeWidth="3"
                  strokeLinecap="round"
                  pathLength="1"
                  strokeDasharray={`${p} 1.01`}
                  filter="url(#cs-lueur)"
                  vectorEffect="non-scaling-stroke"
                  opacity="0.95"
                />
                <circle cx={dest[0]} cy={dest[1]} r={(v.nom ? 4.5 : 3) / Math.sqrt(zoom)} fill="#f0ad1d" opacity={Math.min(1, p * 3)} />
              </g>
            )
          })}
          <circle cx={x0} cy={y0} r={7 / Math.sqrt(zoom)} fill="#fff" />
        </g>

        {/* étiquettes : hors du groupe zoomé pour garder une taille lisible */}
        {[{ id: 'tanger', nom: 'tanger', natif: null, dx: 4, dy: 52, ancre: 'middle', t: 0 }, ...ROUTE_SOMBRE.filter((v) => v.nom)].map((v) => {
          const apparition = v.id === 'tanger' ? 1 : prog(frame, debutRoutes + v.t * (finRoutes - debutRoutes) + sec(0.5), debutRoutes + v.t * (finRoutes - debutRoutes) + sec(0.9), Easing.linear)
          if (apparition <= 0) return null
          const [px, py] = SOMBRE(LIEUX[v.id])
          const X = cx + (px - cx) * zoom
          const Y = cy + (py - cy) * zoom
          if (X < -60 || X > 1140) return null
          return (
            <g key={v.id} opacity={apparition} transform={`translate(${X + v.dx} ${Y + v.dy})`}>
              <text textAnchor={v.ancre} fontFamily={POLICE_TITRE} fontWeight="700" fontSize="34" fill="#fff" style={{ direction: 'rtl' }}>
                {textes.villes[v.nom]}
              </text>
              {v.natif ? (
                <text y="30" textAnchor={v.ancre} fontFamily={POLICE_UI} fontSize="21" fill="#bfb6a3" opacity="0.7">
                  {v.natif}
                </text>
              ) : null}
            </g>
          )
        })}
      </svg>
    </AbsoluteFill>
  )
}
