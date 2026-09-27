import { LANGUES, nomLangue, nomVille } from '../data/langues.js'
import { Pastille } from './Communs.jsx'
import { Boussole, ChevronAvant, Croix } from './Icones.jsx'
import { MarqueRihla } from './Logo.jsx'
import { ImageVille } from './ImageVille.jsx'

// Le choix du cap : suivre la route d'Ibn Battuta, ou épingler UNE langue
// que « Reprendre » et l'onglet Apprendre suivront. Sert d'accueil au tout
// premier lancement (non annulable), puis de sélecteur depuis les Réglages.
export function Cap({ t, locale, capActuel, annulable = false, surLocale, surChoisir, surFermer }) {
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

      {/* Le tout premier écran : qui lit l'arabe ne doit pas avoir à traverser
          l'app en français pour trouver, au fond des Réglages, comment en
          changer. Chaque langue est écrite dans sa propre écriture. */}
      {surLocale ? (
        <div className="segmente segmente--langue" role="group" aria-label={t.langueInterface}>
          <button type="button" lang="fr" className={`segmente__choix ${locale === 'fr' ? 'segmente__choix--actif' : ''}`} aria-pressed={locale === 'fr'} onClick={() => surLocale('fr')}>
            {t.francais}
          </button>
          <button type="button" lang="ar" className={`segmente__choix ${locale === 'ar' ? 'segmente__choix--actif' : ''}`} aria-pressed={locale === 'ar'} onClick={() => surLocale('ar')}>
            {t.arabe}
          </button>
        </div>
      ) : null}

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center', marginTop: annulable || surLocale ? 0 : 18 }}>
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
            className="carte carte-cap apparition"
            onClick={() => surChoisir(langue.id)}
            style={{
              animationDelay: `${Math.min(i * 40, 300)}ms`,
              ...(capActuel === langue.id ? bordActif : null),
            }}
          >
            {/* Décoratif : la ville et la langue sont écrites dessous. */}
            <ImageVille langue={langue} format="bandeau" />
            <span className="carte-cap__pied">
              <Pastille langue={langue} taille={34} />
              <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span style={{ fontSize: 14.5, fontWeight: 600 }}>{nomVille(langue, locale)}</span>
                <span className="texte-2" style={{ fontSize: 12 }}>{nomLangue(langue, locale)}</span>
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
