import { useEffect, useState } from 'react'
import { peutParler, surVoixPretes } from '../lib/tts.js'
import { Auvent, CaravaneIcone, ChevronAvant, DuelIcone, Onde, TuileZellige } from './Icones.jsx'

// La liste des voix du système arrive APRÈS le premier rendu (`voiceschanged`).
// Ce hook force un re-rendu quand elle est là, pour que `peutParler(langue.tts)`
// soit réévalué. À n'utiliser que là où changer d'avis est sans danger — jamais
// pour reconstruire le quiz d'une leçon en cours.
export function useVoixPretes() {
  const [, setTick] = useState(0)
  useEffect(() => surVoixPretes(() => setTick((n) => n + 1)), [])
}

const JEUX = [
  { id: 'zellige', Icone: TuileZellige },
  { id: 'souk', Icone: Auvent },
  { id: 'caravane', Icone: CaravaneIcone },
  { id: 'oreille', Icone: Onde },
  { id: 'duel', Icone: DuelIcone },
]

// La section « Jeux du voyage » d'une destination : cinq façons de réviser
// le vocabulaire en s'amusant, XP à la clé. L'Oreille exige une voix POUR LA
// LANGUE de la destination — sans elle, le jeu ferait deviner un mot swahili
// prononcé à la française. Sans `langue`, on retombe sur « l'API existe-t-elle ? ».
export function SectionJeux({ t, langue, surJeu }) {
  useVoixPretes()
  const audioOk = peutParler(langue?.tts)
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
              style={{ animationDelay: `${i * 60}ms`, color: desactive ? 'var(--encre-2)' : undefined, cursor: desactive ? 'default' : 'pointer' }}
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
