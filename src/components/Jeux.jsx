import { peutParler } from '../lib/tts.js'
import { Auvent, CaravaneIcone, ChevronAvant, DuelIcone, Onde, TuileZellige } from './Icones.jsx'

const JEUX = [
  { id: 'zellige', Icone: TuileZellige },
  { id: 'souk', Icone: Auvent },
  { id: 'caravane', Icone: CaravaneIcone },
  { id: 'oreille', Icone: Onde },
  { id: 'duel', Icone: DuelIcone },
]

// La section « Jeux du voyage » d'une destination : cinq façons de réviser
// le vocabulaire en s'amusant, XP à la clé. L'Oreille exige la synthèse vocale.
export function SectionJeux({ t, surJeu }) {
  const audioOk = peutParler()
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <h2>{t.jeux.titre}</h2>
        <span className="texte-2 texte-petit">{t.jeux.sousTitre}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {JEUX.map(({ id, Icone }, i) => {
          const desactive = id === 'oreille' && !audioOk
          return (
            <button
              key={id}
              type="button"
              className="carte carte-jeu apparition"
              style={{ animationDelay: `${i * 60}ms`, opacity: desactive ? 0.55 : 1, cursor: desactive ? 'default' : 'pointer' }}
              disabled={desactive}
              onClick={() => surJeu(id)}
            >
              <span className="carte-jeu__medaillon">
                <Icone taille={24} trait={1.7} />
              </span>
              <span style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 15.5, fontWeight: 600 }}>{t.jeux[id]}</span>
                <span className="texte-2" style={{ fontSize: 12.5 }}>
                  {desactive ? t.sonIndispo : t.jeux[`${id}Desc`]}
                </span>
              </span>
              <ChevronAvant taille={18} couleur="var(--encre-2)" trait={2} />
            </button>
          )
        })}
      </div>
    </>
  )
}
