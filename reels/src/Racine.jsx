import { Composition } from 'remotion'
import { attendrePolices } from './polices.js'
import { Pub1, DUREE_PUB1 } from './pubs/Pub1.jsx'
import { Pub4, DUREE_PUB4 } from './pubs/Pub4.jsx'
import { AUCUNE, mesurerDurees } from './voix.js'
import { FPS, HAUTEUR, LARGEUR } from './theme.js'

attendrePolices()

// `--props='{"voix":"jamal"}'` pose la voix off de public/voix/jamal/ ; sans rien, c'est la vidéo musique seule.
const parDefaut = { voix: AUCUNE, durees: {} }
const mesures = (pub) => async ({ props }) => ({
  props: { ...props, durees: props.voix === AUCUNE ? {} : await mesurerDurees(pub, props.voix) },
})

export const Racine = () => (
  <>
    <Composition id="Pub1-Darija" component={Pub1} width={LARGEUR} height={HAUTEUR} fps={FPS} durationInFrames={DUREE_PUB1} defaultProps={parDefaut} calculateMetadata={mesures('pub1')} />
    <Composition id="Pub4-Darija" component={Pub4} width={LARGEUR} height={HAUTEUR} fps={FPS} durationInFrames={DUREE_PUB4} defaultProps={parDefaut} calculateMetadata={mesures('pub4')} />
  </>
)
