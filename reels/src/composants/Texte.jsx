import { useCurrentFrame } from 'remotion'
import { Easing, interpolate } from 'remotion'
import { sortieDouce } from '../anim.js'
import { C, POLICE_TITRE, POLICE_UI } from '../theme.js'

const prog = (frame, d, f) => interpolate(frame, [d, f], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: sortieDouce })

// Un titre qui arrive mot à mot (flou → net, de bas en haut). `lignes` : tableaux de mots, un mot pouvant
// être { t, accent: true }. En arabe on n'éclate jamais un mot en lettres : les lettres se lient.
export const TitreMots = ({ lignes, debut = 0, pas = 6, taille = 104, couleur = C.encre, accent = C.safran, interligne = 1.1, poids = 700, sortie }) => {
  const frame = useCurrentFrame()
  let n = 0
  const fondu = sortie ? 1 - prog(frame, sortie, sortie + 10) : 1
  return (
    <div dir="rtl" style={{ textAlign: 'center', fontFamily: POLICE_TITRE, fontWeight: poids, fontSize: taille, lineHeight: interligne, color: couleur, opacity: fondu }}>
      {lignes.map((ligne, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'center', gap: taille * 0.22 }}>
          {ligne.map((mot, j) => {
            const t = typeof mot === 'string' ? mot : mot.t
            const accentue = typeof mot !== 'string' && mot.accent
            const d = debut + n++ * pas
            const p = prog(frame, d, d + 16)
            return (
              <span
                key={j}
                style={{
                  display: 'inline-block',
                  color: accentue ? accent : couleur,
                  opacity: p,
                  translate: `0 ${(1 - p) * 26}px`,
                  filter: `blur(${(1 - p) * 10}px)`,
                }}
              >
                {t}
              </span>
            )
          })}
        </div>
      ))}
    </div>
  )
}

export const Pastille = ({ texte, fond, couleur, bord, icone, debut = 0, sortie, taille = 42, ombre = '0 10px 26px rgba(30,20,10,0.22)' }) => {
  const frame = useCurrentFrame()
  const p = prog(frame, debut, debut + 12)
  const q = sortie ? prog(frame, sortie, sortie + 8) : 0
  const o = p * (1 - q)
  return (
    <div
      dir="rtl"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 16,
        padding: `${taille * 0.36}px ${taille * 0.78}px`,
        borderRadius: 999,
        background: fond,
        color: couleur,
        border: bord ? `2px solid ${bord}` : 'none',
        fontFamily: POLICE_UI,
        fontWeight: 600,
        fontSize: taille,
        lineHeight: 1.1,
        whiteSpace: 'nowrap',
        boxShadow: ombre,
        opacity: o,
        scale: String(0.86 + 0.14 * p),
        translate: `0 ${(1 - p) * 14}px`,
      }}
    >
      {icone}
      {texte}
    </div>
  )
}

// Le papier de l'app : sable + étoiles à huit branches très pâles (même motif que src/styles.css).
const MOTIF = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56'%3E%3Cg fill='none' stroke='%232B1E12' stroke-opacity='0.055'%3E%3Crect x='19' y='19' width='18' height='18'/%3E%3Crect x='19' y='19' width='18' height='18' transform='rotate(45 28 28)'/%3E%3C/g%3E%3C/svg%3E\")"
export const FondPapier = ({ children, style }) => (
  <div style={{ position: 'absolute', inset: 0, background: `${MOTIF}, linear-gradient(#f5ecdf, #f9efe2)`, backgroundSize: '84px 84px, 100% 100%', ...style }}>{children}</div>
)
