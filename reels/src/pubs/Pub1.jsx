import { AbsoluteFill, Sequence } from 'remotion'
import { BandeSon } from '../composants/VoixOff.jsx'
import { entre, prog, entreeSortie } from '../anim.js'
import { C, POLICE_UI, sec } from '../theme.js'
import { PUB1 } from '../textes/darija.js'
import { Tanger } from '../composants/Tanger.jsx'
import { CarteParchemin, CarteSombre } from '../composants/CartesMonde.jsx'
import { FondPapier, Pastille, TitreMots } from '../composants/Texte.jsx'
import { PoseTelephone } from '../composants/Pose.jsx'
import { EcranCartes, EcranQuiz, Etats } from '../composants/EcransApp.jsx'
import { CarteFinale } from '../composants/Fin.jsx'
import { useCurrentFrame } from 'remotion'

// Pub 1 — « Voyage 1325 » (30 s). Mêmes coupes que la vidéo d'origine : la musique tombe aux mêmes endroits.
//  0.0 Tanger · 5.0 fondu vers la carte · 8.0 carte sombre · 12.0 téléphone · 16.17 leçon · 20.0 quiz · 23.03 carte finale
const T = { carteSombre: 8, telephone: 12, lecon: 16.17, quiz: 20, fin: 23.03, total: 30 }

const Kicker = ({ texte }) => {
  const frame = useCurrentFrame()
  return (
    <div
      dir="rtl"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 292,
        textAlign: 'center',
        fontFamily: POLICE_UI,
        fontWeight: 600,
        fontSize: 42,
        color: '#b5502c',
        opacity: prog(frame, 0, 14) * (1 - prog(frame, sec(7.0), sec(7.35))),
      }}
    >
      {texte}
    </div>
  )
}

const ScenePrologue = () => {
  const frame = useCurrentFrame()
  const tangerOpacite = 1 - prog(frame, sec(5.0), sec(6.0), entreeSortie)
  const noirci = prog(frame, sec(7.3), sec(8.0), entreeSortie)
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', inset: 0, opacity: tangerOpacite }}>
        <Tanger />
      </div>
      <Sequence from={sec(5.0)} layout="none">
        <div style={{ position: 'absolute', inset: 0, opacity: prog(frame, sec(5.0), sec(6.0), entreeSortie) }}>
          <CarteParchemin textes={{ mer: PUB1.mer, tanger: PUB1.villes.tanger }} />
        </div>
      </Sequence>
      <div style={{ position: 'absolute', inset: 0, background: C.nuit, opacity: noirci }} />
      <Kicker texte={PUB1.kicker} />
      <div style={{ position: 'absolute', left: 50, right: 50, top: 340 }}>
        <TitreMots lignes={PUB1.titre1} debut={sec(0.5)} pas={8} taille={112} interligne={0.98} sortie={sec(7.0)} />
      </div>
    </AbsoluteFill>
  )
}

const SceneSombre = () => {
  const frame = useCurrentFrame()
  return (
    <AbsoluteFill style={{ background: C.nuit }}>
      <div style={{ position: 'absolute', inset: 0, opacity: prog(frame, 0, 12) }}>
        <CarteSombre textes={PUB1} />
      </div>
      <div style={{ position: 'absolute', left: 50, right: 50, top: 300 }}>
        <TitreMots lignes={PUB1.titre2} debut={sec(0.1)} pas={5} taille={124} interligne={1.04} couleur="#f6efe2" />
      </div>
    </AbsoluteFill>
  )
}

// Destinations qui défilent dans le téléphone : Tokyo, puis la route vers l'est.
const DESTINATIONS = [
  { de: 0, src: 'dest-ja.jpg' },
  { de: sec(0.45), src: 'dest-es.jpg' },
  { de: sec(0.95), src: 'dest-it.jpg' },
  { de: sec(1.45), src: 'dest-tr.jpg' },
  { de: sec(2.45), src: 'dest-ar.jpg' },
  { de: sec(2.95), src: 'dest-hi.jpg' },
]

// Relevé sur la vidéo d'origine (relatif au début de la leçon, 16,17 s) : la carte se retourne, on passe à la suivante.
const CARTES = [
  { debut: 0, retourne: sec(0.3), suivante: sec(0.7) },
  { debut: sec(0.83), retourne: sec(1.15), suivante: sec(2.0) },
  { debut: sec(2.33), retourne: sec(2.65), suivante: sec(3.0) },
  { debut: sec(3.33), retourne: sec(9) },
]

const QUIZ = [
  { q: 0, debut: 0, repond: sec(0.7), suite: sec(1.35) },
  { q: 1, debut: sec(1.45), repond: sec(2.3), suite: sec(2.8) },
]

const SceneTelephone = () => {
  const frame = useCurrentFrame()
  const pastilleA = sec(0.35)
  const pastilleB = sec(T.lecon - T.telephone)
  const pastilleC = sec(T.quiz - T.telephone)
  return (
    <AbsoluteFill>
      <FondPapier />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 330, display: 'flex', justifyContent: 'center' }}>
        <Sequence from={pastilleA} durationInFrames={pastilleB - pastilleA} layout="none">
          <Pastille texte={PUB1.pastilleDestination} fond="#2a2015" couleur={C.papier} />
        </Sequence>
        <Sequence from={pastilleB} durationInFrames={pastilleC - pastilleB} layout="none">
          <Pastille texte={PUB1.pastilleEtapes} fond="#5654d4" couleur="#ffffff" ombre="0 10px 26px rgba(60,52,170,0.4)" />
        </Sequence>
        <Sequence from={pastilleC} layout="none">
          <Pastille texte={PUB1.pastilleExercices} fond={C.terracotta} couleur="#ffffff" ombre="0 10px 26px rgba(168,69,35,0.4)" />
        </Sequence>
      </div>
      <PoseTelephone entree={{ debut: 0, fin: sec(0.55) }} rotation={[5, -13, -2.5]}>
        <Sequence from={0} durationInFrames={sec(T.lecon - T.telephone)} layout="none">
          <AbsoluteFill><Etats etats={DESTINATIONS} /></AbsoluteFill>
        </Sequence>
        <Sequence from={pastilleB} durationInFrames={pastilleC - pastilleB} layout="none">
          <AbsoluteFill><EcranCartes id="ja" cartes={CARTES} /></AbsoluteFill>
        </Sequence>
        <Sequence from={pastilleC} layout="none">
          <AbsoluteFill><EcranQuiz id="ja" plan={QUIZ} /></AbsoluteFill>
        </Sequence>
      </PoseTelephone>
    </AbsoluteFill>
  )
}

export const Pub1 = ({ voix, durees }) => (
  <AbsoluteFill style={{ background: C.nuit }}>
    <BandeSon pub="pub1" musique="audio/pub1.m4a" voix={voix} durees={durees} />
    <Sequence from={0} durationInFrames={sec(T.carteSombre) + 4} layout="none"><ScenePrologue /></Sequence>
    <Sequence from={sec(T.carteSombre)} durationInFrames={sec(T.telephone - T.carteSombre)} layout="none"><SceneSombre /></Sequence>
    <Sequence from={sec(T.telephone)} durationInFrames={sec(T.fin - T.telephone)} layout="none"><SceneTelephone /></Sequence>
    <Sequence from={sec(T.fin)} layout="none">
      <CarteFinale
        lignes={PUB1.final}
        tailleTitre={104}
        y={{ icone: 285, titre: 520, marque: 880, badge: 1058, editeur: 1218, mention: 1330 }}
        t={{ icone: 0, titre: sec(0.5), marque: sec(1.5), badge: sec(2.0), editeur: sec(3.0), mention: sec(3.5) }}
      />
    </Sequence>
  </AbsoluteFill>
)

export const DUREE_PUB1 = sec(T.total)
