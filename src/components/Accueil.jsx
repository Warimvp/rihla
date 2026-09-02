import { LANGUES, nomLangue, nomVille, titreLecon } from '../data/langues.js'
import { joursAvantProchaine, motsDus, tailleCarnet } from '../lib/carnet.js'
import { defiDuJour, etapesValidees, jourLocal, prochaineEtape, visaObtenu } from '../lib/progression.js'
import { AnneauProgres, ChipSerie, Pastille } from './Communs.jsx'
import { CarnetIcone, ChevronAvant, Coche, Etoile8, FlecheAvant } from './Icones.jsx'

export function Accueil({ t, locale, progres, surDestination, surLecon, surDefi, surCarnet }) {
  const suite = prochaineEtape(progres, LANGUES)
  const aCommence = Object.keys(progres.etapes).length > 0
  const defiFait = defiDuJour(progres)
  const jour = jourLocal()
  const nbDus = motsDus(progres, LANGUES, jour).length
  const enCarnet = tailleCarnet(progres)
  const attente = joursAvantProchaine(progres, jour)

  return (
    <div className="vue">
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <h1>{t.salut}</h1>
          <p className="texte-2" style={{ fontSize: 13 }}>{t.pretEtape}</p>
        </div>
        <ChipSerie compte={progres.serie.compte} t={t} />
      </header>

      {suite ? (
        <button
          type="button"
          className="fond-zellige apparition"
          onClick={() => surLecon(suite.langue, suite.lecon)}
          style={{
            border: 'none',
            borderRadius: 'var(--r-carte)',
            padding: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            boxShadow: 'var(--ombre-cta)',
            cursor: 'pointer',
            textAlign: 'start',
            fontFamily: 'var(--police-ui)',
          }}
        >
          <span style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', gap: 7 }}>
            <span style={{ color: 'var(--papier)', fontSize: 15.5, fontWeight: 600 }}>
              {aCommence ? t.reprendre : t.commencer} — {nomVille(suite.langue, locale)}
            </span>
            <span style={{ color: 'var(--sur-majorelle)', fontSize: 12.5 }}>
              {nomLangue(suite.langue, locale)} · {titreLecon(suite.lecon, locale)}
            </span>
            <span className="piste-progres piste-progres--claire">
              <span
                className="piste-progres__barre"
                style={{
                  width: `${(etapesValidees(progres, suite.langue) / suite.langue.lecons.length) * 100}%`,
                  background: 'var(--safran)',
                }}
              ></span>
            </span>
          </span>
          <span
            style={{
              width: 44,
              height: 44,
              borderRadius: 999,
              background: 'var(--sable)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: '0 0 auto',
            }}
          >
            <FlecheAvant taille={20} couleur="var(--majorelle-fonce)" trait={2.2} />
          </span>
        </button>
      ) : null}

      <button
        type="button"
        className="carte apparition"
        onClick={surDefi}
        style={{
          animationDelay: '60ms',
          padding: '13px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 13,
          cursor: 'pointer',
          fontFamily: 'var(--police-ui)',
          textAlign: 'start',
          color: 'var(--encre)',
          background: 'var(--safran-pale)',
          borderColor: 'var(--safran-bord)',
        }}
      >
        <span
          style={{
            width: 42,
            height: 42,
            borderRadius: 14,
            background: 'var(--safran)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: '0 0 auto',
          }}
        >
          <Etoile8 taille={22} couleur="var(--papier)" />
        </span>
        <span style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>{t.defi.titre}</span>
          <span style={{ fontSize: 12.5, color: defiFait ? 'var(--menthe-fonce)' : 'var(--safran-fonce)', fontWeight: defiFait ? 500 : 400 }}>
            {defiFait ? t.defi.faite(defiFait.score, defiFait.total) : t.defi.sub}
          </span>
        </span>
        {defiFait ? (
          <span
            style={{
              width: 26,
              height: 26,
              borderRadius: 999,
              background: 'var(--menthe)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: '0 0 auto',
            }}
          >
            <Coche taille={14} couleur="var(--papier)" trait={2.6} />
          </span>
        ) : (
          <ChevronAvant taille={18} couleur="var(--safran-fonce)" trait={2} />
        )}
      </button>

      <button
        type="button"
        className="carte apparition"
        onClick={surCarnet}
        disabled={nbDus === 0}
        style={{
          animationDelay: '90ms',
          padding: '13px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 13,
          cursor: nbDus > 0 ? 'pointer' : 'default',
          fontFamily: 'var(--police-ui)',
          textAlign: 'start',
          color: 'var(--encre)',
          opacity: nbDus > 0 ? 1 : 0.6,
        }}
      >
        <span
          style={{
            width: 42,
            height: 42,
            borderRadius: 14,
            background: 'var(--menthe-pale)',
            color: 'var(--menthe-fonce)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: '0 0 auto',
          }}
        >
          <CarnetIcone taille={22} trait={1.8} />
        </span>
        <span style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>{t.carnet.titre}</span>
          <span style={{ fontSize: 12.5, color: nbDus > 0 ? 'var(--menthe-fonce)' : 'var(--encre-2)', fontWeight: nbDus > 0 ? 500 : 400 }}>
            {nbDus > 0
              ? `${t.carnet.aReviser(nbDus)} · ${t.carnet.dansCarnet(enCarnet)}`
              : enCarnet > 0
                ? t.carnet.reviensDans(attente)
                : t.carnet.vide}
          </span>
        </span>
        {nbDus > 0 ? <ChevronAvant taille={18} couleur="var(--menthe-fonce)" trait={2} /> : null}
      </button>

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <h2>{t.tonItineraire}</h2>
        <span className="texte-2 texte-petit">{t.nDestinations(LANGUES.length)}</span>
      </div>

      <div className="itineraire" style={{ paddingBottom: 8 }}>
        {LANGUES.map((langue, i) => {
          const validees = etapesValidees(progres, langue)
          const visa = visaObtenu(progres, langue)
          const entamee = validees > 0 && !visa
          const classe = entamee
            ? 'etape-itineraire etape-itineraire--active'
            : visa
              ? 'etape-itineraire'
              : 'etape-itineraire etape-itineraire--future'
          return (
            <button
              key={langue.id}
              type="button"
              className={`${classe} apparition`}
              style={{ animationDelay: `${i * 45}ms` }}
              onClick={() => surDestination(langue)}
            >
              <Pastille langue={langue} estompee={!visa && !entamee} />
              <span style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 15.5, fontWeight: 600, color: visa || entamee ? 'var(--encre)' : 'var(--encre-2)' }}>
                  {nomVille(langue, locale)}
                </span>
                <span
                  style={{
                    fontSize: 12.5,
                    color: visa ? 'var(--menthe)' : 'var(--encre-2)',
                    fontWeight: visa ? 500 : 400,
                  }}
                >
                  {nomLangue(langue, locale)} ·{' '}
                  {visa ? t.visaObtenu : entamee ? t.etapesFaites(validees, langue.lecons.length) : t.aDecouvrir}
                </span>
              </span>
              {visa ? (
                <span
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 999,
                    background: 'var(--menthe)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: '0 0 auto',
                  }}
                >
                  <Coche taille={14} couleur="var(--papier)" trait={2.6} />
                </span>
              ) : entamee ? (
                <AnneauProgres
                  fraction={validees / langue.lecons.length}
                  etiquette={`${validees}/${langue.lecons.length}`}
                />
              ) : (
                <span className="texte-2" style={{ fontSize: 12 }}>{t.km(langue.km)}</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
