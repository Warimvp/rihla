import { useMemo, useState } from 'react'
import { sensPour } from '../i18n.js'
import { nomLangue } from '../data/langues.js'
import { melanger } from '../lib/quiz.js'
import { fanfare, retourReponse } from '../lib/sons.js'
import { parler } from '../lib/tts.js'
import { BoutonQuitter } from './Quitter.jsx'
import { FinDeJeu } from './FinDeJeu.jsx'
import { ImageVille } from './ImageVille.jsx'
import { MotCible, Sens } from './MotCible.jsx'
import { DosZellige, teinteZellige } from './ScenesJeux.jsx'
import { VisuelConcept, aUnVisuel } from '../lib/visuels.jsx'

const tousLesMots = (langue) => langue.lecons.flatMap((l) => l.mots)
const NB_PAIRES = 6
// Une paire trouvée reste lisible un instant (on la relit), puis ses deux
// tuiles s'envolent ; la dernière envolée, on laisse l'image entière à
// regarder avant la carte postale de fin.
export const DELAI_PAIRE = 380
export const DELAI_ENVOL = 1100
export const DELAI_FIN = 2300

// Memory en mosaïque : 12 tuiles zellige, associer chaque mot à son sens.
// Derrière le plateau, l'image de la destination : chaque paire trouvée en
// découvre un morceau — le zellige se défait, la ville apparaît.
export function JeuZellige({ t, locale, source, langue, surXp, surQuitter }) {
  const [partie, setPartie] = useState(0)
  const paires = useMemo(() => melanger(tousLesMots(langue)).slice(0, NB_PAIRES), [langue, partie])
  const tuiles = useMemo(
    () =>
      melanger([
        ...paires.map((mot) => ({ motId: mot.id, face: 't', texte: mot.t, tts: true })),
        // La face « sens » montre l'image du concept quand il en a une : la
        // paire devient image ↔ mot, sans traduction. Le texte reste l'étiquette.
        ...paires.map((mot) => ({
          motId: mot.id,
          face: 'sens',
          mot,
          texte: sensPour(mot, source, langue.id),
          visuel: aUnVisuel(mot.id) ? mot.id : null,
          tts: false,
        })),
      ]).map((tuile, idx) => ({ ...tuile, idx })),
    [paires, source, langue]
  )
  const [ouvertes, setOuvertes] = useState([])
  const [gagnees, setGagnees] = useState(() => new Set())
  const [envolees, setEnvolees] = useState(() => new Set())
  const [coups, setCoups] = useState(0)
  const [fin, setFin] = useState(null)

  const rejouer = () => {
    setPartie(partie + 1)
    setOuvertes([])
    setGagnees(new Set())
    setEnvolees(new Set())
    setCoups(0)
    setFin(null)
  }

  const cliquer = (tuile) => {
    if (fin || gagnees.has(tuile.motId)) return
    if (ouvertes.length === 2 || ouvertes.some((o) => o.idx === tuile.idx)) return
    if (tuile.tts) parler(tuile.texte, langue.tts)
    const nouvelles = [...ouvertes, tuile]
    setOuvertes(nouvelles)
    if (nouvelles.length < 2) return
    const [a, b] = nouvelles
    const nbCoups = coups + 1
    setCoups(nbCoups)
    if (a.motId === b.motId && a.face !== b.face) {
      retourReponse(true)
      const complet = gagnees.size + 1 === paires.length
      setTimeout(() => {
        setGagnees((avant) => new Set([...avant, a.motId]))
        setOuvertes([])
        if (complet) fanfare()
      }, DELAI_PAIRE)
      setTimeout(() => setEnvolees((avant) => new Set([...avant, a.motId])), DELAI_ENVOL)
      if (complet) {
        setTimeout(() => {
          const xp = 30 + (nbCoups <= 10 ? 20 : nbCoups <= 14 ? 10 : 0)
          surXp(xp)
          setFin({ xp })
        }, DELAI_FIN)
      }
    } else {
      setTimeout(() => setOuvertes([]), 820)
    }
  }

  if (fin) {
    return (
      <FinDeJeu
        t={t}
        locale={locale}
        langue={langue}
        titre={t.jeux.bienJoue}
        detail={`${t.jeux.pairesTrouvees(paires.length, paires.length)} · ${t.jeux.coups(coups)}`}
        xp={fin.xp}
        couleur="var(--safran)"
        surQuitter={surQuitter}
        surRejouer={rejouer}
      />
    )
  }

  return (
    <div className="vue vue--pleine" style={{ gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <BoutonQuitter t={t} etiquette={t.fermer} aPerdre={coups > 0} jeu surQuitter={surQuitter} />
        <span style={{ flex: '1 1 auto', fontSize: 15.5, fontWeight: 600 }}>{t.jeux.zellige}</span>
        <span className="texte-2" style={{ fontSize: 13, fontWeight: 600 }}>
          {t.jeux.pairesTrouvees(gagnees.size, paires.length)}
        </span>
      </div>

      <span className="surtitre">
        {nomLangue(langue, locale)} · {t.jeux.zelligeDesc}
      </span>

      <div className="zellige-plateau">
        {/* Décorative : ce que le plateau découvre, c'est la ville du titre. */}
        <div className="zellige-plateau__image" aria-hidden="true">
          <ImageVille langue={langue} />
        </div>
        <div className="zellige-plateau__grille">
        {tuiles.map((tuile) => {
          const visible = gagnees.has(tuile.motId) || ouvertes.some((o) => o.idx === tuile.idx)
          const gagnee = gagnees.has(tuile.motId)
          const envolee = envolees.has(tuile.motId)
          return (
            <div key={tuile.idx} className={`zellige-case ${envolee ? 'zellige-case--ouverte' : ''}`}>
            <button
              type="button"
              className={`tuile ${visible ? 'tuile--vue' : ''} ${gagnee ? 'tuile--gagnee' : ''} ${envolee ? 'tuile--envolee' : ''}`}
              onClick={() => cliquer(tuile)}
              aria-label={visible ? tuile.texte : t.jeux.zellige}
              // Envolée, la tuile n'est plus là pour personne : ni au doigt,
              // ni au clavier, ni au lecteur d'écran.
              aria-hidden={envolee || undefined}
              tabIndex={envolee ? -1 : undefined}
            >
              <span className="tuile__interieur" style={{ display: 'block' }}>
                <span className="tuile__face tuile__face--cachee">
                  <DosZellige teinte={teinteZellige(tuile.idx)} />
                </span>
                <span className="tuile__face tuile__face--mot">
                  {tuile.face === 't' ? (
                    <MotCible texte={tuile.texte} langue={langue} />
                  ) : tuile.visuel ? (
                    <VisuelConcept id={tuile.visuel} taille={44} style={{ color: 'var(--majorelle)' }} />
                  ) : (
                    <Sens mot={tuile.mot} source={source} langue={langue} />
                  )}
                </span>
              </span>
            </button>
            </div>
          )
        })}
        </div>
      </div>

      <div style={{ flex: '1 1 auto' }}></div>
      <p className="texte-2" style={{ fontSize: 12.5, textAlign: 'center' }}>{t.jeux.coups(coups)}</p>
    </div>
  )
}
