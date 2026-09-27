import { peutParler } from '../lib/tts.js'
import { useVoixPretes } from './Ecoute.jsx'
import { enLigneDisponible } from '../lib/enligne.js'
import { Auvent, ChevronAvant, CourseIcone, DuelIcone, LettreIcone, Onde } from './Icones.jsx'
import { DosZellige, Dromadaire } from './ScenesJeux.jsx'

// Le médaillon annonce le décor du jeu : la tuile du Zellige, le dromadaire
// de la Caravane, l'auvent du Souk.
const TuileMedaillon = () => <DosZellige teinte={0} />
const DromadaireMedaillon = () => <Dromadaire taille={30} />

const JEUX = [
  { id: 'zellige', Icone: TuileMedaillon },
  { id: 'souk', Icone: Auvent },
  { id: 'caravane', Icone: DromadaireMedaillon },
  { id: 'oreille', Icone: Onde },
  { id: 'duel', Icone: DuelIcone },
  // Le Barid et la Course ne sont pas des jeux comme les autres (ils sortent
  // de l'app : un lien, un serveur) : App les ouvre sur leur propre écran,
  // préréglés sur cette destination. La Course n'existe qu'avec un serveur.
  { id: 'barid', Icone: LettreIcone },
  { id: 'course', Icone: CourseIcone, enLigne: true },
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
      <div id="jeux" className="ancre" style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <h2>{t.jeux.titre}</h2>
        <span className="texte-2 texte-petit">{t.jeux.sousTitre}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {JEUX.filter((jeu) => !jeu.enLigne || enLigneDisponible()).map(({ id, Icone }, i) => {
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
              <span className={`carte-jeu__medaillon carte-jeu__medaillon--${id}`}>
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
