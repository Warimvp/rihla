import { LANGUES, nomLangue, nomVille } from '../data/langues.js'
import { Pastille } from './Communs.jsx'
import { Boussole, ChevronAvant, Croix } from './Icones.jsx'
import { MarqueRihla } from './Logo.jsx'

// Le choix du cap : suivre la route d'Ibn Battuta, ou épingler UNE langue
// que « Reprendre » et l'onglet Apprendre suivront. Sert d'accueil au tout
// premier lancement (non annulable), puis de sélecteur depuis les Réglages.
export function Cap({ t, locale, capActuel, annulable = false, surChoisir, surFermer }) {
  const bordActif = { borderColor: 'var(--majorelle)', borderWidth: 1.5 }
  return (
    <div className="vue" style={{ gap: 18 }}>
      {annulable ? (
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
      ) : null}

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center', marginTop: annulable ? 0 : 18 }}>
        <MarqueRihla taille={56} />
        <h1 style={{ fontSize: 26 }}>{t.cap.titre}</h1>
        <p className="texte-2" style={{ fontSize: 13.5, maxWidth: '34ch', lineHeight: 1.6 }}>{t.cap.sousTitre}</p>
      </div>

      <button
        type="button"
        className="carte apparition"
        onClick={() => surChoisir('route')}
        style={{
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 13,
          cursor: 'pointer',
          fontFamily: 'var(--police-ui)',
          textAlign: 'start',
          color: 'var(--encre)',
          ...(capActuel === 'route' ? bordActif : null),
        }}
      >
        <span
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            background: 'var(--majorelle-pale)',
            color: 'var(--majorelle-fonce)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: '0 0 auto',
          }}
        >
          <Boussole taille={24} trait={1.7} />
        </span>
        <span style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 15.5, fontWeight: 600 }}>{t.cap.route}</span>
          <span className="texte-2" style={{ fontSize: 12.5 }}>{t.cap.routeDesc}</span>
        </span>
        <ChevronAvant taille={18} couleur="var(--encre-2)" trait={2} />
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span className="surtitre">{t.cap.ou}</span>
        <span style={{ flex: '1 1 auto', borderTop: '1px dashed var(--ligne-2)' }}></span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
        {LANGUES.map((langue, i) => (
          <button
            key={langue.id}
            type="button"
            className="carte apparition"
            onClick={() => surChoisir(langue.id)}
            style={{
              animationDelay: `${Math.min(i * 40, 300)}ms`,
              padding: '14px 10px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              fontFamily: 'var(--police-ui)',
              color: 'var(--encre)',
              ...(capActuel === langue.id ? bordActif : null),
            }}
          >
            <Pastille langue={langue} taille={40} />
            <span style={{ fontSize: 14.5, fontWeight: 600 }}>{nomVille(langue, locale)}</span>
            <span className="texte-2" style={{ fontSize: 12 }}>{nomLangue(langue, locale)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
