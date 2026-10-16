import { getAudioDurationInSeconds } from '@remotion/media-utils'
import { staticFile } from 'remotion'
import repliques from './textes/voix.json'
import { FPS } from './theme.js'

// Voix off : un fichier par réplique, public/voix/<voix>/<pub>-<id>.mp3. `voix` = le nom du dossier (jamal, mouna,
// humaine…) ; « aucune » = la vidéo d'avant, musique seule. Les fichiers viennent d'où l'on veut (README) :
// la composition ne fait que les poser à l'instant voulu et baisser la musique dessous.
export const AUCUNE = 'aucune'
export const REPLIQUES = repliques

// La musique descend à ce niveau sous la voix (1 = inchangée). Assez bas pour que la voix passe devant,
// assez haut pour que la musique reste celle de la pub.
const MUSIQUE_SOUS_VOIX = 0.3
const ENTREE = 0.3 // la musique commence à baisser un peu AVANT la voix…
const SORTIE = 0.5 // …et ne remonte qu'un peu APRÈS

const borne = (x) => Math.min(1, Math.max(0, x))

export const cheminVoix = (voix, pub, id) => staticFile(`voix/${voix}/${pub}-${id}.mp3`)

// Durée réelle de chaque réplique (secondes), mesurée au rendu : la musique ne reste baissée que le temps de parler.
export const mesurerDurees = async (pub, voix) => {
  const durees = {}
  for (const r of REPLIQUES[pub]) {
    durees[r.id] = await getAudioDurationInSeconds(cheminVoix(voix, pub, r.id))
    if (r.debut + durees[r.id] > r.limite) {
      console.warn(`[voix] ${pub}-${r.id} : ${durees[r.id].toFixed(2)} s à partir de ${r.debut} s déborde la limite (${r.limite} s)`)
    }
  }
  return durees
}

// Volume de la musique à l'image `f` : 1 hors voix, MUSIQUE_SOUS_VOIX pendant une réplique, avec des rampes.
export const volumeMusique = (pub, voix, durees = {}) => (f) => {
  if (voix === AUCUNE) return 1
  const t = f / FPS
  let creux = 0
  for (const r of REPLIQUES[pub]) {
    const fin = r.debut + (durees[r.id] ?? r.limite - r.debut)
    const descente = borne((t - (r.debut - ENTREE)) / ENTREE)
    const remontee = borne((fin + SORTIE - t) / SORTIE)
    creux = Math.max(creux, Math.min(descente, remontee))
  }
  return 1 - (1 - MUSIQUE_SOUS_VOIX) * creux
}
