import { Composition } from 'remotion'
import { attendrePolices } from './polices.js'
import { Pub1, DUREE_PUB1 } from './pubs/Pub1.jsx'
import { Pub4, DUREE_PUB4 } from './pubs/Pub4.jsx'
import { FPS, HAUTEUR, LARGEUR } from './theme.js'

attendrePolices()

export const Racine = () => (
  <>
    <Composition id="Pub1-Darija" component={Pub1} width={LARGEUR} height={HAUTEUR} fps={FPS} durationInFrames={DUREE_PUB1} />
    <Composition id="Pub4-Darija" component={Pub4} width={LARGEUR} height={HAUTEUR} fps={FPS} durationInFrames={DUREE_PUB4} />
  </>
)
