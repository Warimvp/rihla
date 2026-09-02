import { MarqueRihla } from './Logo.jsx'

export function Reglages({ t, locale, surLocale, theme, surTheme, surEffacer }) {
  return (
    <div className="vue">
      <h1>{t.onglets.reglages}</h1>

      <div className="carte" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <span style={{ fontSize: 14.5, fontWeight: 600 }}>{t.langueInterface}</span>
        <div className="segmente">
          <button
            type="button"
            className={`segmente__choix ${locale === 'fr' ? 'segmente__choix--actif' : ''}`}
            onClick={() => surLocale('fr')}
          >
            {t.francais}
          </button>
          <button
            type="button"
            className={`segmente__choix ${locale === 'ar' ? 'segmente__choix--actif' : ''}`}
            onClick={() => surLocale('ar')}
          >
            {t.arabe}
          </button>
        </div>
      </div>

      <div className="carte" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <span style={{ fontSize: 14.5, fontWeight: 600 }}>{t.apparence.titre}</span>
        <div className="segmente">
          {['clair', 'auto', 'sombre'].map((choix) => (
            <button
              key={choix}
              type="button"
              className={`segmente__choix ${theme === choix ? 'segmente__choix--actif' : ''}`}
              onClick={() => surTheme(choix)}
            >
              {t.apparence[choix]}
            </button>
          ))}
        </div>
      </div>

      <div className="carte" style={{ padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <MarqueRihla taille={44} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontFamily: 'var(--police-titre)', fontSize: 20 }}>Rihla</span>
            <span dir="rtl" style={{ fontFamily: "'Amiri', 'Geeza Pro', serif", fontSize: 14, color: 'var(--terracotta)', alignSelf: 'start' }}>
              رحلة
            </span>
          </div>
        </div>
        <p style={{ fontSize: 13.5, lineHeight: 1.65, color: 'var(--encre-2)' }}>{t.histoireApp}</p>
        <p style={{ fontSize: 13.5, lineHeight: 1.65, fontWeight: 500 }}>{t.gratuit}</p>
        <p className="texte-2" style={{ fontSize: 12.5 }}>
          {t.faitAuMaroc} — v0.1.0
        </p>
      </div>

      <button type="button" className="bouton bouton--secondaire" onClick={surEffacer}>
        {t.effacer}
      </button>
    </div>
  )
}
