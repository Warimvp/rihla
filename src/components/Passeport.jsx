import { LANGUES, nomLangue, nomVille } from '../data/langues.js'
import { MAX_GELS, PRIX_GEL, etapesValidees, kmParcourus, nbVisas, visaObtenu } from '../lib/progression.js'
import { jourLocal } from '../lib/progression.js'
import { semaineActivite } from '../lib/sauvegarde.js'
import { pubsDisponibles, regarderPourUneNuit } from '../lib/pub.js'
import { TenteIcone } from './Icones.jsx'
import { MarqueRihla } from './Logo.jsx'
import { TamponVisa } from './TamponVisa.jsx'

export function Passeport({ t, locale, progres, surAcheterGel, surNuitOfferte }) {
  const visas = nbVisas(progres, LANGUES)
  const km = kmParcourus(progres, LANGUES)
  const gels = progres.gels ?? 0
  const semaine = semaineActivite(progres, jourLocal())
  const maxSemaine = Math.max(progres.objectifJour ?? 20, ...semaine.map((j) => j.xp))
  const totalSemaine = semaine.reduce((somme, j) => somme + j.xp, 0)
  const achatPossible = gels < MAX_GELS && progres.xp >= PRIX_GEL
  // La pub récompensée : opt-in, jamais dans l'apprentissage. Invisible tant
  // qu'aucun fournisseur n'est branché (voir src/lib/pub.js).
  const pubPossible = gels < MAX_GELS && pubsDisponibles()

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
          <span dir="rtl" style={{ fontFamily: "'Amiri', 'Geeza Pro', serif", fontSize: 16, color: 'var(--sur-majorelle)', alignSelf: 'start' }}>
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

      <div className="carte" style={{ margin: '14px 16px 0', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>{t.semaine.titre}</span>
          <span className="texte-2" style={{ fontSize: 12.5 }}>
            {totalSemaine > 0 ? t.plusXp(totalSemaine) : null}
          </span>
        </div>
        {totalSemaine > 0 ? (
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8, height: 78 }}>
            {semaine.map((j, i) => {
              const objectif = progres.objectifJour ?? 20
              const atteint = j.xp >= objectif
              const hauteur = j.xp > 0 ? Math.max(6, Math.round((j.xp / maxSemaine) * 58)) : 3
              return (
                <div key={j.jour} style={{ flex: '1 1 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <span
                    title={`${j.jour} · ${j.xp} XP`}
                    style={{
                      width: '100%',
                      maxWidth: 26,
                      height: hauteur,
                      borderRadius: 6,
                      background: j.xp === 0 ? 'var(--piste)' : atteint ? 'var(--menthe)' : 'var(--safran)',
                    }}
                  ></span>
                  <span
                    className="texte-2"
                    style={{ fontSize: 11, fontWeight: i === semaine.length - 1 ? 700 : 400, color: i === semaine.length - 1 ? 'var(--encre)' : undefined }}
                  >
                    {t.semaine.jours[j.jourSemaine]}
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="texte-2" style={{ fontSize: 12.5, margin: 0 }}>{t.semaine.rien}</p>
        )}
      </div>

      <div className="carte" style={{ margin: '14px 16px 0', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
          <span
            style={{
              width: 42,
              height: 42,
              borderRadius: 14,
              background: 'var(--safran-pale)',
              color: 'var(--safran-fonce)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: '0 0 auto',
            }}
          >
            <TenteIcone taille={24} trait={1.7} />
          </span>
          <span style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 15, fontWeight: 600 }}>{t.gel.titre}</span>
            <span className="texte-2" style={{ fontSize: 12.5 }}>{t.gel.desc}</span>
          </span>
          {gels > 0 ? (
            <span className="chip chip--safran" style={{ minHeight: 26, flex: '0 0 auto' }}>{t.gel.stock(gels)}</span>
          ) : null}
        </div>
        <button
          type="button"
          className="bouton bouton--secondaire bouton--pleine"
          style={{ minHeight: 44, fontSize: 14 }}
          disabled={!achatPossible}
          onClick={surAcheterGel}
        >
          {gels >= MAX_GELS ? t.gel.plein : t.gel.acheter}
        </button>
        {pubPossible ? (
          <button
            type="button"
            className="bouton bouton--fantome bouton--pleine"
            style={{ minHeight: 44, fontSize: 14 }}
            onClick={async () => {
              const etat = await regarderPourUneNuit()
              surNuitOfferte(etat)
            }}
          >
            {t.gel.regarder}
          </button>
        ) : null}
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
