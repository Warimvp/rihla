import { Img, staticFile } from 'remotion'
import { C, POLICE_UI } from '../theme.js'

// Un iPhone à île dynamique, dessiné en CSS. L'écran fait 390×844 px — exactement la fenêtre dans laquelle
// l'app a été capturée (scripts/capturer-ecrans.mjs) : les positions du manifeste s'y appliquent telles quelles.
export const L_ECRAN = 390
export const H_ECRAN = 844
const BORD = 13

const BarreEtat = ({ avion }) => (
  <div
    style={{
      position: 'absolute',
      inset: '0 0 auto 0',
      height: 54,
      direction: 'ltr',
      fontFamily: POLICE_UI,
      color: '#1b1511',
    }}
  >
    {/* En interface arabe, iOS inverse la barre : l'heure à droite, les icônes à gauche. */}
    <div style={{ position: 'absolute', right: 46, top: 17, fontSize: 17, fontWeight: 600, letterSpacing: -0.2 }}>9:41</div>
    <div style={{ position: 'absolute', left: 40, top: 18, display: 'flex', gap: 6, alignItems: 'center' }}>
      {avion ? (
        <svg width="18" height="14" viewBox="0 0 24 20" fill="#1b1511"><path d="M22 10.5 14 8 9 1H6.8l2.4 7L4.5 9.6 2.6 7.6 1 8.4l2 3.6-2 3.6 1.6.8 1.9-2 4.7 1.6-2.4 7H9l5-7 8-2.5c.8-.3.8-1.5 0-1.6z" transform="scale(.85) translate(0 -1)" /></svg>
      ) : (
        <>
          <svg width="18" height="12" viewBox="0 0 18 12" fill="#1b1511"><rect x="0" y="8" width="3" height="4" rx="1" /><rect x="5" y="5" width="3" height="7" rx="1" /><rect x="10" y="2.5" width="3" height="9.5" rx="1" /><rect x="15" y="0" width="3" height="12" rx="1" /></svg>
          <svg width="17" height="12" viewBox="0 0 17 12" fill="none" stroke="#1b1511" strokeWidth="2" strokeLinecap="round"><path d="M1.5 4.2a10 10 0 0 1 14 0" /><path d="M4 7a6.4 6.4 0 0 1 9 0" /><circle cx="8.5" cy="10" r="1" fill="#1b1511" stroke="none" /></svg>
        </>
      )}
      <svg width="27" height="13" viewBox="0 0 27 13"><rect x="0.5" y="0.5" width="22" height="12" rx="3.6" fill="none" stroke="#1b1511" opacity="0.4" /><rect x="2" y="2" width="19" height="9" rx="2.4" fill="#1b1511" /><rect x="24" y="4.2" width="2.2" height="4.6" rx="1" fill="#1b1511" opacity="0.45" /></svg>
    </div>
  </div>
)

export const Telephone = ({ children, avion = false, echelle = 1, style }) => {
  const L = L_ECRAN + BORD * 2
  const H = H_ECRAN + BORD * 2
  return (
    <div
      style={{
        position: 'absolute',
        width: L,
        height: H,
        scale: String(echelle),
        transformOrigin: '50% 0',
        ...style,
      }}
    >
      {/* le châssis */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 66,
          background: 'linear-gradient(145deg, #3b3632 0%, #14110f 28%, #1d1916 70%, #3a3531 100%)',
          boxShadow: '0 0 0 1.5px #4a443f inset, 0 40px 60px rgba(20,14,8,0.35), 0 12px 24px rgba(20,14,8,0.28)',
        }}
      />
      {/* l'écran */}
      <div
        style={{
          position: 'absolute',
          left: BORD,
          top: BORD,
          width: L_ECRAN,
          height: H_ECRAN,
          borderRadius: 52,
          overflow: 'hidden',
          background: C.sable,
        }}
      >
        {children}
        <BarreEtat avion={avion} />
        <div style={{ position: 'absolute', left: '50%', top: 11, width: 122, height: 35, marginLeft: -61, borderRadius: 20, background: '#0b0908' }} />
        <div style={{ position: 'absolute', left: '50%', bottom: 8, width: 136, height: 5, marginLeft: -68, borderRadius: 3, background: '#1b1511', opacity: 0.85 }} />
      </div>
    </div>
  )
}

// Le doigt : un rond clair qui se pose puis s'efface. `t` = images écoulées depuis le toucher.
export const Toucher = ({ x, y, t, rayon = 30 }) => {
  if (t < 0 || t > 16) return null
  const entree = Math.min(1, t / 4)
  const sortie = t < 8 ? 1 : 1 - (t - 8) / 8
  return (
    <div
      style={{
        position: 'absolute',
        left: x - rayon,
        top: y - rayon,
        width: rayon * 2,
        height: rayon * 2,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.55)',
        border: '2px solid rgba(255,255,255,0.9)',
        boxShadow: '0 2px 10px rgba(30,20,60,0.35)',
        opacity: sortie * (0.35 + 0.65 * entree),
        scale: String(1.25 - 0.3 * entree),
      }}
    />
  )
}

// Une capture de l'app plaquée sur tout l'écran (ou une partie : `boite` en px d'écran).
export const Capture = ({ src, opacite = 1, boite, style }) => (
  <Img
    src={staticFile(`ecrans/${src}`)}
    style={{
      position: 'absolute',
      ...(boite
        ? { left: boite.x, top: boite.y, width: boite.w, height: boite.h }
        : { left: 0, top: 0, width: L_ECRAN, height: H_ECRAN }),
      opacity: opacite,
      ...style,
    }}
  />
)
