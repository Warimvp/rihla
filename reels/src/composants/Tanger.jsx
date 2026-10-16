import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { bruit, entre, sortieDouce } from '../anim.js'
import { sec } from '../theme.js'

// Tanger, 1325 — l'illustration d'ouverture : un voyageur, de dos, face au détroit.
// Tout est dessiné ici (aucune image) : le soleil se lève, les oiseaux passent, la mer bouge à peine.

const ENCRE = '#2b1e12'
const FACE = '#f7f1e2'
const OMBRE = '#e6dbc1'
const FENETRE = '#b9a782'
const VERT = '#1f7a5c'
const SOL = 1315 // ligne de sol (là où les murs et le voyageur touchent le sable)

// Les cubes de la médina, de l'arrière vers l'avant : [x, haut, largeur]. Tous descendent jusqu'au sol.
const CUBES = [
  [715, 932, 125],
  [840, 942, 140],
  [978, 898, 110],
  [425, 985, 125],
  [548, 1042, 100],
  [640, 1052, 80],
  [722, 1000, 108],
  [815, 1022, 100],
  [912, 1050, 90],
  [985, 1040, 100],
  [362, 1075, 78],
  [440, 1120, 110],
  [542, 1075, 100],
  [632, 1168, 75],
  [695, 1140, 96],
  [782, 1146, 100],
  [878, 1136, 96],
  [968, 1146, 112],
  [410, 1190, 130],
  [600, 1190, 100],
  [680, 1210, 90],
  [770, 1170, 92],
  [860, 1190, 96],
  [945, 1180, 135],
]

// Petites fenêtres : [x, y].
const FENETRES = [
  [748, 965], [868, 975], [1058, 1018], [455, 1020], [730, 1062], [955, 1052], [396, 1112], [727, 1188],
  [812, 1190], [907, 1180], [447, 1226], [1060, 1182], [1058, 1060], [615, 1100], [920, 1110],
]

const Minaret = ({ x, y, largeur, hauteur, bandeY, echelle = 1 }) => {
  const cx = x + largeur / 2
  return (
    <g>
      {/* lanterne : trois boules dorées */}
      <line x1={cx} y1={y - 38 * echelle} x2={cx} y2={y} stroke={ENCRE} strokeWidth="3" />
      <circle cx={cx} cy={y - 12 * echelle} r={9 * echelle} fill="#e9a319" stroke={ENCRE} strokeWidth="2.5" />
      <circle cx={cx} cy={y - 28 * echelle} r={7 * echelle} fill="#e9a319" stroke={ENCRE} strokeWidth="2.5" />
      <circle cx={cx} cy={y - 42 * echelle} r={5 * echelle} fill="#e9a319" stroke={ENCRE} strokeWidth="2.5" />
      {/* petit toit vert */}
      <rect x={x + largeur * 0.12} y={y} width={largeur * 0.76} height={14 * echelle} fill={VERT} stroke={ENCRE} strokeWidth="2.5" />
      <rect x={x + largeur * 0.22} y={y + 14 * echelle} width={largeur * 0.56} height={34 * echelle} fill={FACE} stroke={ENCRE} strokeWidth="2.5" />
      {/* fût */}
      <rect x={x} y={y + 48 * echelle} width={largeur} height={hauteur - 48 * echelle} fill={FACE} stroke={ENCRE} strokeWidth="3" />
      <rect x={x + largeur * 0.62} y={y + 48 * echelle} width={largeur * 0.38} height={hauteur - 48 * echelle} fill={OMBRE} />
      <rect x={x} y={y + 48 * echelle} width={largeur} height={hauteur - 48 * echelle} fill="none" stroke={ENCRE} strokeWidth="3" />
      {/* bandeau de zellige vert */}
      <rect x={x + 6} y={bandeY} width={largeur - 12} height={18 * echelle} fill={VERT} stroke={ENCRE} strokeWidth="2" />
      {/* deux fenêtres en arc */}
      {[0.22, 0.58].map((k) => (
        <path
          key={k}
          d={`M${x + largeur * k} ${bandeY + 62 * echelle} v-${28 * echelle} a${largeur * 0.1} ${largeur * 0.1} 0 0 1 ${largeur * 0.2} 0 v${28 * echelle} z`}
          fill="#6b4a32"
          stroke={ENCRE}
          strokeWidth="2"
        />
      ))}
    </g>
  )
}

// Étoile à huit branches (deux carrés), comme le logo de l'app.
export const etoile8 = (cx, cy, r) => {
  const pts = []
  for (let i = 0; i < 16; i++) {
    const a = (Math.PI / 8) * i - Math.PI / 2
    const rr = i % 2 === 0 ? r : r * 0.78
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`)
  }
  return pts.join(' ')
}

const COULEURS_ZELLIGE = ['#4e46c8', '#c8552f', '#1f7a5c', '#e9a319']

export const Tanger = () => {
  const frame = useCurrentFrame()
  // Le soleil monte de l'horizon vers le haut du ciel pendant les premières secondes.
  const soleilY = entre(frame, [0, sec(5)], [925, 782], sortieDouce)
  const soleilX = entre(frame, [0, sec(5)], [415, 427])
  const zoom = entre(frame, [0, sec(7)], [1, 1.035])

  const oiseaux = [
    [300, 740, 0], [420, 722, 1.7], [540, 694, 3.1],
  ]

  return (
    <AbsoluteFill>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{ display: 'block' }}>
        <defs>
          <linearGradient id="tg-ciel" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#d9d2e8" />
            <stop offset="0.2" stopColor="#e4d5e4" />
            <stop offset="0.33" stopColor="#efd7de" />
            <stop offset="0.41" stopColor="#f5d9d0" />
            <stop offset="0.47" stopColor="#f9dcb8" />
            <stop offset="0.5" stopColor="#fbdfb0" />
          </linearGradient>
          <radialGradient id="tg-halo">
            <stop offset="0" stopColor="#ffb940" stopOpacity="0.8" />
            <stop offset="0.3" stopColor="#ffbf4a" stopOpacity="0.3" />
            <stop offset="1" stopColor="#ffc457" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="tg-mer" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#c8c5f2" />
            <stop offset="1" stopColor="#b8b5ec" />
          </linearGradient>
          <linearGradient id="tg-sable" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#e3c99b" />
            <stop offset="0.2" stopColor="#dcbf8f" />
            <stop offset="1" stopColor="#bd925d" />
          </linearGradient>
          <filter id="tg-grain" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" />
            <feColorMatrix values="0 0 0 0 0.25  0 0 0 0 0.18  0 0 0 0 0.1  0 0 0 0.55 0" />
          </filter>
        </defs>

        <g transform={`translate(540 1000) scale(${zoom}) translate(-540 -1000)`}>
          {/* ciel */}
          <rect x="0" y="0" width="1080" height="960" fill="url(#tg-ciel)" />
          <circle cx={soleilX} cy={soleilY} r="270" fill="url(#tg-halo)" />
          {[...Array(26)].map((_, i) => {
            const x = bruit(i) * 1080
            const y0 = 200 + bruit(i + 40) * 700
            const y = y0 - ((frame * (0.15 + bruit(i + 80) * 0.25)) % 260)
            return <circle key={i} cx={x} cy={y < 120 ? y + 260 : y} r={2 + bruit(i + 7) * 2} fill="#f3b94c" opacity={0.35 + bruit(i + 3) * 0.4} />
          })}
          <circle cx={soleilX} cy={soleilY} r="61" fill="#eba319" />

          {/* la côte d'en face, dans la brume */}
          <path d="M0 905 C 90 892 200 858 300 856 C 420 856 520 888 640 892 C 780 896 900 905 1080 905 L1080 950 L0 950 Z" fill="#b9a9d8" />
          <rect x="0" y="905" width="1080" height="42" fill="#d4b9cc" opacity="0.8" />

          {/* oiseaux */}
          {oiseaux.map(([x, y, ph], i) => (
            <path
              key={i}
              d="M0 0 q7 -8 14 0 q7 -8 14 0"
              transform={`translate(${x + Math.sin(frame / 40 + ph) * 14} ${y + Math.cos(frame / 33 + ph) * 6})`}
              fill="none"
              stroke={ENCRE}
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          ))}

          {/* mer */}
          <rect x="0" y="945" width="1080" height={SOL - 945} fill="url(#tg-mer)" />
          {[
            [388, 962, 78], [397, 986, 56], [405, 1010, 40], [410, 1034, 30], [414, 1050, 22],
          ].map(([x, y, w], i) => (
            <rect key={i} x={x} y={y} width={w} height="5" rx="2.5" fill="#f4a935" opacity={0.85 - i * 0.12} />
          ))}
          {[
            [8, 972, 40], [168, 1000, 70], [28, 1208, 70], [88, 1236, 70], [250, 1100, 50], [300, 1270, 56],
          ].map(([x, y, w], i) => (
            <path
              key={i}
              d={`M${x} ${y} q${w / 6} -7 ${w / 3} 0 t${w / 3} 0 t${w / 3} 0`}
              fill="none"
              stroke="#ffffff"
              strokeWidth="3"
              strokeLinecap="round"
              opacity={0.55 + 0.25 * Math.sin(frame / 18 + i)}
              transform={`translate(${Math.sin(frame / 50 + i) * 6} 0)`}
            />
          ))}

          {/* la médina */}
          {CUBES.map(([x, haut, w], i) => (
            <g key={i}>
              <rect x={x} y={haut} width={w} height={SOL - haut} fill={FACE} />
              <rect x={x} y={haut} width={w * 0.3} height={SOL - haut} fill={OMBRE} />
              <line x1={x} y1={haut} x2={x + w} y2={haut} stroke={ENCRE} strokeWidth="2.6" />
            </g>
          ))}
          {FENETRES.map(([x, y], i) => (
            <rect key={i} x={x} y={y} width="11" height="15" rx="2" fill={FENETRE} />
          ))}
          <rect x="425" y="1010" width="18" height="26" rx="9" fill="#a98f6a" stroke={ENCRE} strokeWidth="1.5" />

          {/* minarets */}
          <Minaret x={580} y={878} largeur={50} hauteur={SOL - 878 - 270} bandeY={958} echelle={0.85} />
          <Minaret x={883} y={702} largeur={68} hauteur={940 - 702} bandeY={794} />

          {/* le rempart crénelé */}
          <path
            d={`M540 ${SOL} ${Array.from({ length: 12 }, (_, i) => {
              const x = 540 + i * 46
              return `L${x} 1278 L${x + 23} 1278 L${x + 23} ${SOL - 2} L${x + 46} ${SOL - 2}`
            }).join(' ')} L1100 ${SOL}`}
            fill={FACE}
            stroke={ENCRE}
            strokeWidth="3.4"
            strokeLinejoin="round"
          />

          {/* la plate-forme et le sable */}
          <rect x="0" y={SOL} width="1080" height="610" fill="url(#tg-sable)" />
          <rect x="0" y={SOL} width="540" height="20" fill="#d8bb8a" />
          <line x1="0" y1={SOL} x2="1080" y2={SOL} stroke={ENCRE} strokeWidth="3" />

          {/* le voyageur, de dos, un bâton à la main */}
          <g>
            <rect x="351" y="1130" width="9" height={SOL - 1130} rx="4" fill={ENCRE} />
            <circle cx="355" cy="1136" r="8" fill={ENCRE} />
            <path
              d={`M157 ${SOL} C 150 1220 165 1120 215 1088 C 205 1040 225 1008 262 1008 C 292 1008 300 1038 292 1078 C 340 1110 362 1210 360 ${SOL} Z`}
              fill="#241a12"
            />
            <path d={`M292 1078 C 340 1110 362 1210 360 ${SOL}`} fill="none" stroke="#e9a319" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M232 1085 L258 1158 L288 1085" fill="none" stroke="#3d2e20" strokeWidth="2.5" />
            <path d="M236 1170 V1310 M286 1170 V1310" stroke="#2f2217" strokeWidth="2" />
            <ellipse cx="258" cy="1040" rx="34" ry="30" fill="#241a12" />
            <path d="M226 1048 C 218 1070 222 1090 232 1100" fill="none" stroke="#e9a319" strokeWidth="2.4" opacity="0.85" />
          </g>

          {/* frise de zellige */}
          <rect x="-4" y="1424" width="1088" height="94" fill="#fbf6e9" stroke={ENCRE} strokeWidth="3" />
          {[...Array(14)].map((_, i) => {
            const cx = -2 + i * 92.4
            const couleur = COULEURS_ZELLIGE[i % 4]
            return (
              <g key={i}>
                <polygon points={etoile8(cx, 1471, 40)} fill={couleur} stroke={ENCRE} strokeWidth="2" strokeLinejoin="round" />
                <circle cx={cx} cy="1471" r="11" fill="#fbf6e9" stroke={ENCRE} strokeWidth="1.5" />
              </g>
            )
          })}
        </g>

        {/* grain de papier sur toute l'image */}
        <rect x="0" y="0" width="1080" height="1920" filter="url(#tg-grain)" opacity="0.2" style={{ mixBlendMode: 'multiply' }} />
      </svg>
    </AbsoluteFill>
  )
}
