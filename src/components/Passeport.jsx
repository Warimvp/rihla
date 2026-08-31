import { LANGUES, nomLangue, nomVille } from '../data/langues.js'
import { etapesValidees, kmParcourus, nbVisas, visaObtenu } from '../lib/progression.js'
import { MarqueRihla } from './Logo.jsx'
import { TamponVisa } from './TamponVisa.jsx'

export function Passeport({ t, locale, progres }) {
  const visas = nbVisas(progres, LANGUES)
  const km = kmParcourus(progres, LANGUES)

  return (
    <div className="vue" style={{ padding: 0, gap: 0 }}>
      <div
        className="fond-zellige"
        style={{
          padding: 'calc(56px + env(safe-area-inset-top)) 20px 48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <h1 style={{ color: 'var(--sable)', fontSize: 26 }}>{t.onglets.passeport}</h1>
          <span dir="rtl" style={{ fontFamily: "'Amiri', 'Geeza Pro', serif", fontSize: 16, color: 'var(--majorelle-pale)', alignSelf: 'start' }}>
            جواز الرحلة
          </span>
        </div>
        <MarqueRihla taille={46} surMajorelle />
      </div>

      <div className="carte rangee-stats" style={{ margin: '-30px 16px 0', padding: '14px 8px' }}>
        <div>
          <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--majorelle-fonce)' }}>
            {progres.xp.toLocaleString(t.numLocale)}
          </span>
          <span className="texte-2" style={{ fontSize: 11.5 }}>{t.xp}</span>
        </div>
        <div>
          <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--terracotta-fonce)' }}>
            {km.toLocaleString(t.numLocale)}
          </span>
          <span className="texte-2" style={{ fontSize: 11.5 }}>{t.kmParcourus}</span>
        </div>
        <div>
          <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--menthe-fonce)' }}>{progres.serie.compte}</span>
          <span className="texte-2" style={{ fontSize: 11.5 }}>{t.joursVoyage}</span>
        </div>
      </div>

      <div style={{ padding: '20px 20px 0', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <h2>{t.tesVisas}</h2>
        <span className="texte-2 texte-petit">{t.visasSur(visas, LANGUES.length)}</span>
      </div>

      <div
        style={{
          padding: '14px 20px 0',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: 12,
        }}
      >
        {LANGUES.map((langue, i) => {
          const obtenu = visaObtenu(progres, langue)
          const validees = etapesValidees(progres, langue)
          return obtenu ? (
            <div key={langue.id} className="tampon-case">
              <TamponVisa langue={langue} index={i} locale={locale} />
            </div>
          ) : (
            <div key={langue.id} className="tampon-case tampon-case--vide">
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--encre-2)' }}>{nomVille(langue, locale)}</span>
              <span style={{ fontSize: 10.5, color: 'var(--encre-3)' }}>
                {nomLangue(langue, locale)}
                {validees > 0 ? ` · ${validees}/${langue.lecons.length}` : ''}
              </span>
            </div>
          )
        })}
      </div>

      <div
        style={{
          margin: '16px 20px 20px',
          background: 'var(--safran-pale)',
          borderRadius: 'var(--r-bouton)',
          padding: '12px 16px',
          color: 'var(--safran-fonce)',
          fontSize: 12.5,
          lineHeight: 1.5,
        }}
      >
        {t.astuceVisa}
      </div>
    </div>
  )
}
