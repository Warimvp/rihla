import { Fragment } from 'react'
import { histoire, langueParId, nomLangue, nomVille, titreLecon } from '../data/langues.js'
import { DEPART, motsVoyageurs } from '../data/voyageurs.js'
import { cleEtape } from '../lib/progression.js'
import { ChoixDestination, Pastille } from './Communs.jsx'
import { ChevronAvant, Coche } from './Icones.jsx'
import { IconeLecon, aUneIcone } from './IconesLecons.jsx'
import { SectionJeux } from './Jeux.jsx'
import { CreditPhoto, ImageVille } from './ImageVille.jsx'
import { SectionVoyageurs } from './Voyageurs.jsx'

// Trois choses qu'il fallait deviner, et qui sont maintenant sous la main :
//   • changer de destination sans repasser par l'accueil (la rangée du haut) ;
//   • savoir par où continuer (l'étape « À suivre ») ;
//   • trouver les jeux, qui vivaient au bout de vingt-quatre étapes (le sommaire).
const mouvementReduit = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export function Apprendre({ t, locale, source, progres, langue, surDestination = () => {}, surLecon, surJeu }) {
  const prochaine = langue.lecons.find((lecon) => !progres.etapes[cleEtape(langue.id, lecon.id)]?.valide)
  const aDesVoyageurs = langue.id === DEPART || motsVoyageurs(langue.id).length > 0
  const allerA = (id) =>
    document.getElementById(id)?.scrollIntoView?.({ behavior: mouvementReduit() ? 'auto' : 'smooth', block: 'start' })
  return (
    <div className="vue">
      <ChoixDestination
        t={t}
        locale={locale}
        valeur={langue.id}
        surChoisir={(id) => id !== langue.id && surDestination(langueParId(id))}
        avecRoute={false}
        etiquette={t.changerDestination}
      />

      {/* La carte postale de la destination : sa photo (ou son paysage), le
          nom, puis le carnet de route. L'image est décorative — la ville est
          nommée juste dessous. `key` : changer de destination repart d'une
          image neuve (fondu de la photo, lever de l'astre). */}
      <header className="carte carte-ville">
        <ImageVille key={langue.id} langue={langue} />
        <div className="carte-ville__titre">
          <Pastille langue={langue} taille={46} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <h1>{nomVille(langue, locale)}</h1>
            <p className="texte-2" style={{ fontSize: 13 }}>
              {nomLangue(langue, locale)} · {t.km(langue.km)}
            </p>
          </div>
        </div>
        <div className="carte-ville__histoire">
          <span className="surtitre">{t.histoireIci}</span>
          <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--encre-2)' }}>{histoire(langue, locale)}</p>
          {/* Le crédit, là où la photo est montrée en grand. */}
          <CreditPhoto t={t} langue={langue} />
        </div>
      </header>

      <nav className="sommaire" aria-label={t.sommaire.titre}>
        <button type="button" className="sommaire__lien" onClick={() => allerA('etapes')}>
          {t.sommaire.etapes}
        </button>
        {aDesVoyageurs ? (
          <button type="button" className="sommaire__lien" onClick={() => allerA('voyageurs')}>
            {t.sommaire.voyageurs}
          </button>
        ) : null}
        <button type="button" className="sommaire__lien" onClick={() => allerA('jeux')}>
          {t.sommaire.jeux}
        </button>
      </nav>

      <h2 id="etapes" className="ancre">{t.etapesVoyage}</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {langue.lecons.map((lecon, i) => {
          const etape = progres.etapes[cleEtape(langue.id, lecon.id)]
          const validee = etape?.valide ?? false
          const aSuivre = prochaine?.id === lecon.id
          const nouveauNiveau = i === 0 || lecon.niveau !== langue.lecons[i - 1].niveau
          return (
            <Fragment key={lecon.id}>
              {nouveauNiveau ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: i === 0 ? 0 : 8 }}>
                  <span className="surtitre">{t[`niveau${lecon.niveau}`] ?? t.niveau1}</span>
                  <span style={{ flex: '1 1 auto', borderTop: '1px dashed var(--ligne-2)' }}></span>
                </div>
              ) : null}
            <button
              type="button"
              className={`carte apparition ${aSuivre ? 'carte-etape--a-suivre' : ''}`}
              aria-current={aSuivre ? 'step' : undefined}
              style={{
                // Plafonnée : à 60 ms par étape, la 24e n'arrivait qu'au bout
                // d'une seconde et demie — le bas de la liste restait vide.
                animationDelay: `${Math.min(i * 60, 360)}ms`,
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                cursor: 'pointer',
                fontFamily: 'var(--police-ui)',
                textAlign: 'start',
                color: 'var(--encre)',
              }}
              onClick={() => surLecon(langue, lecon)}
            >
              {/* Le thème de l'étape en image ; validée, elle passe au vert ET
                  porte une coche — jamais la couleur seule pour dire un état. */}
              <span className={`medaillon-etape ${validee ? 'medaillon-etape--validee' : ''}`}>
                {aUneIcone(lecon.id) ? <IconeLecon id={lecon.id} /> : i + 1}
                {validee ? (
                  <span className="medaillon-etape__coche">
                    <Coche taille={11} trait={3.2} />
                  </span>
                ) : null}
              </span>
              <span style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 15.5, fontWeight: 600 }}>{titreLecon(lecon, locale)}</span>
                <span className="texte-2" style={{ fontSize: 12.5 }}>
                  {/* Une fois jouée, le score dit déjà le nombre de mots. */}
                  {t.etapeNumero(i + 1)} · {etape ? t.scoreSur(etape.score, etape.total) : t.motsCompte(lecon.mots.length)}
                </span>
              </span>
              {/* Par où continuer : la première étape qui reste à valider. */}
              {aSuivre ? <span className="chip chip--a-suivre">{t.aSuivre}</span> : null}
              <ChevronAvant taille={18} couleur={aSuivre ? 'var(--majorelle-fonce)' : 'var(--encre-2)'} trait={2} />
            </button>
            </Fragment>
          )
        })}
      </div>

      <SectionVoyageurs t={t} source={source} langue={langue} />

      <SectionJeux t={t} langue={langue} surJeu={surJeu} />
    </div>
  )
}
