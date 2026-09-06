import { Croix, Etoile8 } from './Icones.jsx'
import { MarqueRihla } from './Logo.jsx'

// Le guide du voyageur : ce que l'app ne pouvait pas expliquer jusqu'ici.
// Ouvert depuis les Réglages, lisible d'une traite.
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
        {t.guide.sections.map((section, i) => (
          <div key={section.t} className="carte apparition" style={{ animationDelay: `${Math.min(i * 40, 320)}ms`, padding: '14px 16px', display: 'flex', gap: 12 }}>
            <span
              style={{
                width: 30,
                height: 30,
                borderRadius: 999,
                background: 'var(--majorelle-pale)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: '0 0 auto',
              }}
            >
              <Etoile8 taille={14} couleur="var(--majorelle-fonce)" />
            </span>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 15, fontWeight: 600 }}>{section.t}</span>
              <span className="texte-2" style={{ fontSize: 13, lineHeight: 1.6 }}>{section.d}</span>
            </span>
          </div>
        ))}
      </div>

      <button type="button" className="bouton bouton--primaire bouton--pleine" onClick={surFermer}>
        {t.continuer}
      </button>
    </div>
  )
}
