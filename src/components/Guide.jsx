import { Croix, Etoile8 } from './Icones.jsx'
import { MarqueRihla } from './Logo.jsx'

// Le guide du voyageur : ce que l'app ne pouvait pas expliquer jusqu'ici.
// Ouvert depuis l'accueil (le « ? » de l'en-tête) et depuis les Réglages,
// lisible d'une traite.
export function Guide({ t, surFermer }) {
  return (
    <div className="vue" style={{ gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          type="button"
          onClick={surFermer}
          aria-label={t.fermer}
          style={{
            width: 44,
            height: 44,
            marginInlineStart: -11,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--encre-2)',
            flex: '0 0 auto',
          }}
        >
          <Croix taille={22} trait={2.2} />
        </button>
        <span style={{ flex: '1 1 auto', fontSize: 15.5, fontWeight: 600 }}>{t.guide.titre}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center' }}>
        <MarqueRihla taille={48} />
        <span className="texte-2" style={{ fontSize: 13 }}>{t.guide.sousTitre}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Des titres qu'on parcourt, des réponses qu'on ouvre : douze
            paragraphes d'un bloc ne se lisaient pas. La première section est
            ouverte — elle dit l'essentiel, et montre que les autres s'ouvrent. */}
        {t.guide.sections.map((section, i) => (
          <details key={section.t} className="carte guide-section apparition" style={{ animationDelay: `${Math.min(i * 40, 320)}ms` }} open={i === 0}>
            <summary>
              <span className="guide-section__puce">
                <Etoile8 taille={14} couleur="var(--majorelle-fonce)" />
              </span>
              <span className="guide-section__titre">{section.t}</span>
            </summary>
            <p className="texte-2">{section.d}</p>
          </details>
        ))}
      </div>

      <button type="button" className="bouton bouton--primaire bouton--pleine" onClick={surFermer}>
        {t.continuer}
      </button>
    </div>
  )
}
