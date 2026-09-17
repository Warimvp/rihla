import { sensPour } from '../i18n.js'
import { LANGUES } from '../data/langues.js'
import { DEPART, motsVoyageurs, totalVoyageurs } from '../data/voyageurs.js'
import { Ecoute } from './Ecoute.jsx'
import { FlecheAvant } from './Icones.jsx'
import { MotCible, Romanisation } from './MotCible.jsx'

const ARABE = LANGUES.find((l) => l.id === DEPART)

// Les mots voyageurs : des mots partis de l'arabe et arrivés jusqu'à cette
// destination, parfois après un long détour par l'Europe. Rien à réussir,
// rien à gagner : un pont — « ce mot, tu le connais déjà ». Chaque étymologie
// porte sa preuve (Wiktionary) dans src/data/voyageurs.js ; sans preuve, pas
// de mot.
export function SectionVoyageurs({ t, source, langue }) {
  if (langue.id === DEPART) {
    return (
      <>
        <h2>{t.voyageurs.titre}</h2>
        <div className="carte" style={{ padding: '14px 16px' }}>
          <p className="voyageurs-depart" style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--encre-2)' }}>
            {t.voyageurs.depart(totalVoyageurs())}
          </p>
        </div>
      </>
    )
  }

  const mots = motsVoyageurs(langue.id)
  if (mots.length === 0) return null

  return (
    <>
      {/* Le titre est long : le sous-titre passe dessous plutôt que de le casser. */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', columnGap: 10, rowGap: 2 }}>
        <h2>{t.voyageurs.titre}</h2>
        <span className="texte-2 texte-petit">{t.voyageurs.sousTitre}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {mots.map((mot) => {
          const sens = sensPour(mot, source, langue.id)
          // En arabe, « الزيت — الزيت » ne dirait rien : le sens n'est écrit
          // que s'il n'est pas déjà le mot d'origine.
          const sensUtile = sens !== mot.arabe ? sens : null
          const chemin = mot.chemin?.length ? t.voyageurs.par(mot.chemin.map((id) => t.voyageurs.langues[id])) : null
          return (
            <div key={mot.t} className="carte voyageur">
              {/* L'origine d'abord, puis le mot arrivé : le sens du voyage.
                  La flèche se retourne en RTL (.icone-directionnelle). */}
              <div className="voyageur__route">
                <span className="voyageur__mot">
                  <MotCible balise="div" className="voyageur__origine" texte={mot.arabe} langue={ARABE} />
                  <Romanisation balise="div" texte={mot.arabeR} />
                </span>
                <FlecheAvant taille={18} trait={2} couleur="var(--encre-2)" />
                <span className="voyageur__mot">
                  <MotCible balise="div" className="voyageur__cible" texte={mot.t} langue={langue} />
                  {mot.r ? <Romanisation balise="div" texte={mot.r} /> : null}
                </span>
              </div>
              <div className="voyageur__pied">
                <span className="texte-2" style={{ fontSize: 12.5 }}>
                  {sensUtile}
                  {sensUtile && chemin ? ' · ' : null}
                  {chemin}
                </span>
                <Ecoute t={t} texte={mot.t} langue={langue} />
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
