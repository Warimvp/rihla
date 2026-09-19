import { reglerEnLigne } from '../lib/enligne.js'
import { Croix, OndeIcone } from './Icones.jsx'

// Le consentement au jeu en ligne : une seule fois, avant le premier appel
// au serveur. On dit exactement ce qui part (pseudonyme, scores, temps) et
// ce qui ne partira jamais (compte, e-mail, numéro). Coupable dans Réglages.
export function ConsentementEnLigne({ t, surActiver, surRefuser }) {
  return (
    <div className="vue" style={{ gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          type="button"
          onClick={surRefuser}
          aria-label={t.fermer}
          style={{ width: 44, height: 44, marginInlineStart: -11, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--encre-2)', flex: '0 0 auto' }}
        >
          <Croix taille={22} trait={2.2} />
        </button>
        <span style={{ flex: '1 1 auto', fontSize: 15.5, fontWeight: 600 }}>{t.enligne.titre}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center', marginTop: 12 }}>
        <span style={{ color: 'var(--majorelle-fonce)' }}>
          <OndeIcone taille={56} trait={1.4} />
        </span>
        <h1 style={{ fontSize: 26 }}>{t.enligne.consentTitre}</h1>
        <p className="texte-2" style={{ fontSize: 13.5, maxWidth: '36ch', lineHeight: 1.65 }}>{t.enligne.consentTexte}</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
        <button
          type="button"
          className="bouton bouton--primaire bouton--pleine"
          onClick={() => {
            reglerEnLigne(true)
            surActiver()
          }}
        >
          {t.enligne.activer}
        </button>
        <button type="button" className="bouton bouton--fantome bouton--pleine" onClick={surRefuser}>
          {t.enligne.plusTard}
        </button>
      </div>
    </div>
  )
}
