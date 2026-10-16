import { useCurrentFrame } from 'remotion'
import { Easing, interpolate } from 'remotion'
import { Telephone } from './Telephone.jsx'

// Pose 3D du téléphone dans la scène : position (centre haut), échelle, inclinaison, et une très légère flottaison.
// `entree` = { debut, fin } : le téléphone arrive de côté en tournant (images locales).
export const PoseTelephone = ({ x = 540, y = 640, echelle = 1.45, rotation = [4, -9, 1.2], entree, avion, flottement = 5, children }) => {
  const frame = useCurrentFrame()
  const e = entree
    ? interpolate(frame, [entree.debut, entree.fin], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1) })
    : 1
  const flotte = Math.sin(frame / 26) * flottement
  const [rx, ry, rz] = rotation
  return (
    <div style={{ position: 'absolute', inset: 0, perspective: 2100, perspectiveOrigin: '50% 45%' }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transformStyle: 'preserve-3d',
          transformOrigin: `${x}px ${y + 600}px`,
          transform: `translate(${(1 - e) * -430}px, ${(1 - e) * 520 + flotte}px) rotateX(${rx}deg) rotateY(${ry * e}deg) rotateZ(${rz - (1 - e) * 16}deg)`,
          opacity: Math.min(1, e * 4),
        }}
      >
        <Telephone avion={avion} echelle={echelle * (0.72 + 0.28 * e)} style={{ left: x - 208, top: y }}>
          {children}
        </Telephone>
      </div>
    </div>
  )
}
