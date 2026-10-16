import { useCurrentFrame } from 'remotion'
import { interpolate } from 'remotion'
import { sortieDouce } from '../anim.js'
import { C, POLICE_LATIN, POLICE_UI } from '../theme.js'
import { COMMUN } from '../textes/darija.js'
import { IconeApp } from './CartesMonde.jsx'
import { TitreMots } from './Texte.jsx'

const prog = (frame, d, f = d + 14) => interpolate(frame, [d, f], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: sortieDouce })
const apparait = (p, dy = 18) => ({ opacity: p, translate: `0 ${(1 - p) * dy}px` })

// Les étoiles à huit branches de l'app, à peine visibles sur le bleu (comme sur les vidéos d'origine).
const MOTIF_CLAIR = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56'%3E%3Cg fill='none' stroke='%23FFFFFF' stroke-opacity='0.06'%3E%3Crect x='19' y='19' width='18' height='18'/%3E%3Crect x='19' y='19' width='18' height='18' transform='rotate(45 28 28)'/%3E%3C/g%3E%3C/svg%3E\")"

// Le badge « disponible sur l'App Store » (même forme que celui des vidéos d'origine, texte en darija).
export const BadgeAppStore = () => (
  <div
    dir="rtl"
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 22,
      padding: '0 46px',
      height: 104,
      borderRadius: 52,
      background: C.papier,
      color: C.encre,
      fontFamily: POLICE_UI,
      boxShadow: '0 12px 28px rgba(15,10,60,0.35)',
    }}
  >
    <svg width="36" height="40" viewBox="0 0 24 26" fill="none" stroke={C.encre} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v13M6 10l6 6 6-6M3 23h18" />
    </svg>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.05 }}>
      <span style={{ fontSize: 24, fontWeight: 500, color: '#5d4f3f' }}>{COMMUN.badgePetit}</span>
      <span dir="ltr" style={{ fontSize: 42, fontWeight: 700, letterSpacing: -0.4 }}>{COMMUN.badgeGrand}</span>
    </div>
  </div>
)

// « Une app Legantis · DIGITAL SERVICE » : marque de l'éditeur, redessinée d'après les vidéos d'origine.
export const Legantis = () => (
  <div dir="rtl" style={{ display: 'flex', alignItems: 'center', gap: 20, fontFamily: POLICE_UI, color: '#dedcf8' }}>
    <span style={{ fontSize: 30, fontWeight: 400, opacity: 0.88 }}>{COMMUN.uneApp}</span>
    <div dir="ltr" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <svg width="42" height="42" viewBox="0 0 42 42">
        <rect width="42" height="42" rx="9" fill="#3a3aa6" />
        <path d="M13 9h8v18h9v6H13z" fill="#fbfaff" />
        <rect x="28" y="9" width="5" height="5" fill="#e9a319" />
      </svg>
      <span style={{ fontSize: 40, fontWeight: 700, color: '#f4f2ff', letterSpacing: 0.6, transform: 'scaleX(1.1)', transformOrigin: 'left center' }}>Legantis</span>
      <span style={{ width: 2, height: 34, background: '#9b99e6', opacity: 0.6, marginLeft: 6 }} />
      <span style={{ fontFamily: "'DejaVu Sans Mono', ui-monospace, monospace", fontSize: 19, letterSpacing: 4, color: '#dedcf8' }}>DIGITAL SERVICE</span>
    </div>
  </div>
)

// La carte finale bleue : l'icône, la promesse mot à mot, la marque, le badge, l'éditeur, la mention des photos.
// `y` = positions verticales (px, sur 1920) propres à chaque pub ; `t` = instants d'apparition (images locales).
export const CarteFinale = ({ lignes, y, t, tailleTitre = 96 }) => {
  const frame = useCurrentFrame()
  const pIcone = prog(frame, t.icone, t.icone + 16)
  const pMarque = prog(frame, t.marque, t.marque + 14)
  const pBadge = prog(frame, t.badge, t.badge + 12)
  const pEditeur = prog(frame, t.editeur)
  const pMention = prog(frame, t.mention)
  return (
    <div style={{ position: 'absolute', inset: 0, background: `${MOTIF_CLAIR}, linear-gradient(180deg, #4e4dc9 0%, #5254cf 46%, #3a3a9f 82%, #35369a 100%)`, backgroundSize: '84px 84px, auto' }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: y.icone, display: 'flex', justifyContent: 'center', ...apparait(pIcone, 24), scale: String(0.9 + 0.1 * pIcone) }}>
        <IconeApp taille={196} rayon={0.24} />
      </div>
      <div style={{ position: 'absolute', left: 80, right: 80, top: y.titre }}>
        <TitreMots lignes={lignes} debut={t.titre} pas={7} taille={tailleTitre} couleur="#f6f3ff" interligne={1.12} />
      </div>
      <div
        dir="ltr"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: y.marque,
          textAlign: 'center',
          fontFamily: POLICE_LATIN,
          fontSize: 120,
          color: C.safran,
          lineHeight: 1,
          ...apparait(pMarque, 26),
          filter: `blur(${(1 - pMarque) * 8}px)`,
        }}
      >
        {COMMUN.marque}
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: y.badge, display: 'flex', justifyContent: 'center', ...apparait(pBadge, 20), scale: String(0.92 + 0.08 * pBadge) }}>
        <BadgeAppStore />
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: y.editeur, display: 'flex', justifyContent: 'center', ...apparait(pEditeur, 10) }}>
        <Legantis />
      </div>
      <div
        dir="rtl"
        style={{
          position: 'absolute',
          left: 70,
          right: 70,
          top: y.mention,
          textAlign: 'center',
          fontFamily: POLICE_UI,
          fontSize: 21,
          lineHeight: 1.5,
          color: '#cfcdf6',
          ...apparait(pMention * 0.62, 8),
        }}
      >
        {COMMUN.mentionPhotos}
      </div>
    </div>
  )
}
