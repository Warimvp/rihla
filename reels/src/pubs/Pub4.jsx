import { AbsoluteFill, Easing, Sequence, interpolate, useCurrentFrame } from 'remotion'
import { BandeSon } from '../composants/VoixOff.jsx'
import { prog, entreeSortie } from '../anim.js'
import { C, POLICE_UI, sec } from '../theme.js'
import { PUB4 } from '../textes/darija.js'
import { Cabine } from '../composants/Hublot.jsx'
import { Pastille, TitreMots } from '../composants/Texte.jsx'
import { PoseTelephone } from '../composants/Pose.jsx'
import { EcranCartes, EcranQuiz, Etats } from '../composants/EcransApp.jsx'
import { CarteFinale } from '../composants/Fin.jsx'

// Pub 4 — « Apprends partout » (15 s). Mêmes coupes que la vidéo d'origine :
//  0.0 « Pas de Wi-Fi ? » · 2.33 destination · 4.0 la cabine · 6.0 quiz · 10.03 carte finale
const T = { destination: 2.33, cabine: 4.0, quiz: 6.0, fin: 10.03, total: 15 }

const MOTIF = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56'%3E%3Cg fill='none' stroke='%23F2E9D8' stroke-opacity='0.04'%3E%3Crect x='19' y='19' width='18' height='18'/%3E%3Crect x='19' y='19' width='18' height='18' transform='rotate(45 28 28)'/%3E%3C/g%3E%3C/svg%3E\")"

const IconeAvion = ({ taille = 40, couleur = C.encre }) => (
  <svg width={taille} height={taille} viewBox="0 0 24 24" fill={couleur}>
    <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" />
  </svg>
)

// L'interrupteur « Mode avion » : il bascule vers 0,6 s, l'icône s'allume en safran.
const ModeAvion = ({ texte }) => {
  const frame = useCurrentFrame()
  const p = interpolate(frame, [sec(0.55), sec(0.85)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.4, 0, 0.2, 1) })
  const entree = prog(frame, sec(0.1), sec(0.5))
  return (
    <div
      dir="rtl"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 26,
        padding: '18px 26px',
        borderRadius: 40,
        background: 'rgba(255,255,255,0.045)',
        border: '2px solid rgba(255,255,255,0.12)',
        fontFamily: POLICE_UI,
        fontWeight: 500,
        fontSize: 44,
        color: '#f6efe2',
        opacity: entree,
      }}
    >
      <div style={{ width: 70, height: 70, borderRadius: 20, background: p > 0.5 ? C.safran : '#4a423b', display: 'grid', placeItems: 'center' }}>
        <IconeAvion couleur={p > 0.5 ? C.encre : '#cfc6b8'} />
      </div>
      <span style={{ paddingInline: 14 }}>{texte}</span>
      <div style={{ width: 104, height: 62, borderRadius: 31, background: p > 0.5 ? C.menthe : '#5b534b', position: 'relative', direction: 'ltr' }}>
        <div style={{ position: 'absolute', top: 5, left: 5 + 42 * p, width: 52, height: 52, borderRadius: 26, background: '#fff', boxShadow: '0 3px 8px rgba(0,0,0,0.3)' }} />
      </div>
    </div>
  )
}

const SceneReseau = () => {
  const frame = useCurrentFrame()
  const sortie = 1 - prog(frame, sec(3.7), sec(4.1), entreeSortie)
  return (
    <AbsoluteFill style={{ background: `${MOTIF}, #1b1411`, backgroundSize: '84px 84px, auto' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: sortie }}>
        <div style={{ position: 'absolute', left: 60, right: 60, top: 250 }}>
          <TitreMots lignes={PUB4.titre} debut={sec(0.1)} pas={6} taille={132} interligne={1.0} couleur="#f6efe2" />
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 650, display: 'flex', justifyContent: 'center' }}>
          <ModeAvion texte={PUB4.modeAvion} />
        </div>
        <PoseTelephone x={540} y={860} echelle={1.57} rotation={[3, -5, -0.4]} avion={frame >= sec(0.7)} flottement={4}>
          <Etats etats={[{ de: 0, src: 'accueil.jpg' }, { de: sec(T.destination), src: 'dest-en.jpg' }]} fondu={8} />
        </PoseTelephone>
      </div>
    </AbsoluteFill>
  )
}

// Relevé sur la vidéo d'origine, relatif au début de la cabine (4,0 s).
const CARTES = [
  // la première carte arrive déjà retournée : la coupe vers la cabine tombe en plein geste, un retournement à moitié aurait l'air d'un accident
  { debut: 0, retourne: -sec(1), suivante: sec(0.42) },
  { debut: sec(0.55), retourne: sec(0.85), suivante: sec(1.25) },
  { debut: sec(1.4), retourne: sec(9) },
]
const QUIZ = [
  { q: 0, debut: sec(2.0), repond: sec(2.4), suite: sec(2.85) },
  { q: 1, debut: sec(2.95), repond: sec(3.35), suite: sec(3.8) },
  { q: 2, debut: sec(3.9), repond: sec(4.25), suite: sec(4.55) },
  { q: 3, debut: sec(4.65), repond: sec(4.75), pasTuile: 7 },
]

const SceneCabine = () => {
  const frame = useCurrentFrame()
  const apparition = prog(frame, 0, sec(0.4), entreeSortie)
  const quiz = sec(T.quiz - T.cabine)
  const capture = sec(7.0 - T.cabine)
  return (
    <AbsoluteFill style={{ opacity: apparition }}>
      <Cabine />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 316, display: 'flex', justifyContent: 'center' }}>
        <Sequence from={sec(0.2)} durationInFrames={capture - sec(0.2)} layout="none">
          <Pastille texte={PUB4.pastilleSansReseau} fond={C.papier} couleur={C.encre} taille={42} />
        </Sequence>
        <Sequence from={capture} layout="none">
          <Pastille
            texte={PUB4.pastilleCapture}
            fond={C.safran}
            couleur={C.encre}
            taille={42}
            icone={<IconeAvion taille={40} couleur={C.encre} />}
            ombre="0 10px 26px rgba(233,163,25,0.35)"
          />
        </Sequence>
      </div>
      <PoseTelephone x={610} y={600} echelle={1.6} rotation={[4, -8, -6]} avion flottement={5}>
        <Sequence from={0} durationInFrames={quiz} layout="none">
          <AbsoluteFill><EcranCartes id="en" cartes={CARTES} /></AbsoluteFill>
        </Sequence>
        <Sequence from={quiz} layout="none">
          <AbsoluteFill><EcranQuiz id="en" plan={QUIZ.map((p) => ({ ...p, debut: p.debut - quiz, repond: p.repond - quiz, suite: p.suite != null ? p.suite - quiz : undefined }))} /></AbsoluteFill>
        </Sequence>
      </PoseTelephone>
    </AbsoluteFill>
  )
}

export const Pub4 = ({ voix, durees }) => (
  <AbsoluteFill style={{ background: C.nuit }}>
    <BandeSon pub="pub4" musique="audio/pub4.m4a" voix={voix} durees={durees} />
    <Sequence from={0} durationInFrames={sec(T.cabine) + sec(0.4)} layout="none"><SceneReseau /></Sequence>
    <Sequence from={sec(T.cabine)} durationInFrames={sec(T.fin - T.cabine)} layout="none"><SceneCabine /></Sequence>
    <Sequence from={sec(T.fin)} layout="none">
      <CarteFinale
        lignes={PUB4.final}
        tailleTitre={104}
        y={{ icone: 285, titre: 520, marque: 880, badge: 1058, editeur: 1218, mention: 1330 }}
        t={{ icone: 0, titre: sec(0.35), marque: sec(1.45), badge: sec(1.8), editeur: sec(2.1), mention: sec(2.4) }}
      />
    </Sequence>
  </AbsoluteFill>
)

export const DUREE_PUB4 = sec(T.total)
