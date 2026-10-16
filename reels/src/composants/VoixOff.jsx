import { Sequence, staticFile } from 'remotion'
import { Audio } from '@remotion/media'
import { AUCUNE, REPLIQUES, cheminVoix, volumeMusique } from '../voix.js'
import { sec } from '../theme.js'

// La bande-son d'une pub : la musique d'origine (baissée sous la voix) + la voix off, réplique par réplique.
export const BandeSon = ({ pub, musique, voix = AUCUNE, durees = {} }) => (
  <>
    <Audio src={staticFile(musique)} volume={volumeMusique(pub, voix, durees)} />
    {voix === AUCUNE
      ? null
      : REPLIQUES[pub].map((r) => (
          <Sequence key={r.id} from={sec(r.debut)} layout="none" name={`Voix · ${r.id}`}>
            <Audio src={cheminVoix(voix, pub, r.id)} />
          </Sequence>
        ))}
  </>
)
