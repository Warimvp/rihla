import { histoire, nomLangue, nomVille, titreLecon } from '../data/langues.js'
import { cleEtape } from '../lib/progression.js'
import { Pastille } from './Communs.jsx'
import { ChevronAvant, Coche } from './Icones.jsx'
import { SectionJeux } from './Jeux.jsx'

export function Apprendre({ t, locale, progres, langue, surLecon, surJeu }) {
  return (
    <div className="vue">
      <header style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <Pastille langue={langue} taille={48} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <h1>{nomVille(langue, locale)}</h1>
          <p className="texte-2" style={{ fontSize: 13 }}>
            {nomLangue(langue, locale)} · {t.km(langue.km)}
          </p>
        </div>
      </header>

      <div className="carte" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span className="surtitre">{t.histoireIci}</span>
        <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--encre-2)' }}>{histoire(langue, locale)}</p>
      </div>

      <h2>{t.etapesVoyage}</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {langue.lecons.map((lecon, i) => {
          const etape = progres.etapes[cleEtape(langue.id, lecon.id)]
          const validee = etape?.valide ?? false
          return (
            <button
              key={lecon.id}
              type="button"
              className="carte apparition"
              style={{
                animationDelay: `${i * 60}ms`,
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
              <span
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 999,
                  background: validee ? 'var(--menthe)' : 'var(--majorelle-pale)',
                  color: validee ? 'var(--papier)' : 'var(--majorelle-fonce)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 15,
                  flex: '0 0 auto',
                }}
              >
                {validee ? <Coche taille={18} trait={2.4} /> : i + 1}
              </span>
              <span style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 15.5, fontWeight: 600 }}>{titreLecon(lecon, locale)}</span>
                <span className="texte-2" style={{ fontSize: 12.5 }}>
                  {t.motsCompte(lecon.mots.length)}
                  {etape ? ` · ${t.scoreSur(etape.score, etape.total)}` : ''}
                </span>
              </span>
              <ChevronAvant taille={18} couleur="var(--encre-2)" trait={2} />
            </button>
          )
        })}
      </div>

      <SectionJeux t={t} surJeu={surJeu} />
    </div>
  )
}
