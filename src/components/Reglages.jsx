import { useState } from 'react'
import { OBJECTIFS_JOUR, jourLocal } from '../lib/progression.js'
import { exporterProgres, importerProgres } from '../lib/sauvegarde.js'
import { BoiteIcone, CarnetIcone, PartagerIcone } from './Icones.jsx'
import { reglerSons, sonsActifs } from '../lib/sons.js'
import { HEURE_DEFAUT, activerRappel, desactiverRappel, heureRappel, rappelActif, rappelDisponible } from '../lib/rappel.js'
import { MarqueRihla } from './Logo.jsx'

export function Reglages({
  t,
  locale,
  surLocale,
  theme,
  surTheme,
  sourceChoix,
  surSource,
  objectifJour,
  surObjectif,
  libelleCap,
  surChangerCap,
  surGuide,
  progres,
  surRestaurer,
  surEffacer,
}) {
  const [sons, setSons] = useState(() => sonsActifs())
  const [rappel, setRappel] = useState(() => rappelActif())
  const [heure, setHeure] = useState(() => heureRappel())
  const natifDispo = rappelDisponible()
  const [message, setMessage] = useState(null)
  const [zoneRestaure, setZoneRestaure] = useState(null)

  const annoncer = (texte) => {
    setMessage(texte)
    setTimeout(() => setMessage(null), 3500)
  }

  const copierSauvegarde = async () => {
    const texte = exporterProgres(progres, jourLocal())
    try {
      await navigator.clipboard.writeText(texte)
      annoncer(t.sauvegarde.copie)
    } catch {
      setZoneRestaure(null)
      annoncer(t.sauvegarde.echecCopie)
      setMessage(t.sauvegarde.echecCopie)
    }
  }

  const validerRestauration = () => {
    const resultat = importerProgres(zoneRestaure ?? '')
    if (!resultat.ok) {
      annoncer(t.sauvegarde.erreurs[resultat.erreur] ?? t.sauvegarde.erreurs.corrompu)
      return
    }
    if (!window.confirm(t.sauvegarde.confirmer)) return
    surRestaurer(resultat.progres)
    setZoneRestaure(null)
    annoncer(t.sauvegarde.succes)
  }

  const basculerRappel = async (valeur) => {
    if (!valeur) {
      await desactiverRappel()
      setRappel(false)
      return
    }
    const etat = await activerRappel(heure, { titre: t.rappel.notifTitre, corps: t.rappel.notifCorps })
    if (etat === 'ok') {
      setRappel(true)
      annoncer(t.rappel.pose(heure))
    } else {
      setRappel(false)
      annoncer(etat === 'refuse' ? t.rappel.refuse : t.rappel.indisponible)
    }
  }

  const changerHeure = async (valeur) => {
    setHeure(valeur || HEURE_DEFAUT)
    if (!rappel) return
    const etat = await activerRappel(valeur, { titre: t.rappel.notifTitre, corps: t.rappel.notifCorps })
    if (etat === 'ok') annoncer(t.rappel.pose(valeur))
  }

  const partager = async () => {
    const url = 'https://warimvp.github.io/rihla/'
    const donnees = { title: 'Rihla', text: t.partager.texte, url }
    try {
      if (navigator.share) {
        await navigator.share(donnees)
        return
      }
      await navigator.clipboard.writeText(`${t.partager.texte} ${url}`)
      annoncer(t.partager.copie)
    } catch {
      /* partage annulé par l'utilisateur : rien à signaler */
    }
  }
  return (
    <div className="vue">
      <h1>{t.onglets.reglages}</h1>

      <div className="carte" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 13 }}>
        <span style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 14.5, fontWeight: 600 }}>{t.cap.reglage}</span>
          <span className="texte-2" style={{ fontSize: 12.5 }}>{libelleCap}</span>
        </span>
        <button
          type="button"
          className="bouton bouton--secondaire"
          style={{ minHeight: 40, padding: '0 14px', fontSize: 13, flex: '0 0 auto' }}
          onClick={surChangerCap}
        >
          {t.cap.changer}
        </button>
      </div>

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 14.5, fontWeight: 600 }}>{t.sourceReglage.titre}</span>
          <span className="texte-2" style={{ fontSize: 12.5 }}>{t.sourceReglage.sousTitre}</span>
        </div>
        <div className="segmente">
          {['auto', 'fr', 'ar'].map((choix) => (
            <button
              key={choix}
              type="button"
              className={`segmente__choix ${sourceChoix === choix ? 'segmente__choix--actif' : ''}`}
              onClick={() => surSource(choix)}
            >
              {t.sourceReglage[choix]}
            </button>
          ))}
        </div>
      </div>

      <div className="carte" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 14.5, fontWeight: 600 }}>{t.objectif.titre}</span>
          <span className="texte-2" style={{ fontSize: 12.5 }}>{t.objectif.sousTitre}</span>
        </div>
        <div className="segmente">
          {OBJECTIFS_JOUR.map((objectif) => (
            <button
              key={objectif}
              type="button"
              className={`segmente__choix ${objectifJour === objectif ? 'segmente__choix--actif' : ''}`}
              onClick={() => surObjectif(objectif)}
            >
              {objectif} XP
            </button>
          ))}
        </div>
      </div>

      <div className="carte" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <span style={{ fontSize: 14.5, fontWeight: 600 }}>{t.sons.titre}</span>
        <div className="segmente">
          {[true, false].map((valeur) => (
            <button
              key={String(valeur)}
              type="button"
              className={`segmente__choix ${sons === valeur ? 'segmente__choix--actif' : ''}`}
              onClick={() => {
                reglerSons(valeur)
                setSons(valeur)
              }}
            >
              {valeur ? t.sons.oui : t.sons.non}
            </button>
          ))}
        </div>
      </div>

      <div className="carte" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 14.5, fontWeight: 600 }}>{t.rappel.titre}</span>
          <span className="texte-2" style={{ fontSize: 12.5 }}>
            {natifDispo ? t.rappel.sousTitre : t.rappel.indisponible}
          </span>
        </div>
        <div className="segmente">
          {[true, false].map((valeur) => (
            <button
              key={String(valeur)}
              type="button"
              className={`segmente__choix ${rappel === valeur ? 'segmente__choix--actif' : ''}`}
              disabled={!natifDispo}
              style={{ opacity: natifDispo ? 1 : 0.5 }}
              onClick={() => basculerRappel(valeur)}
            >
              {valeur ? t.rappel.actif : t.rappel.inactif}
            </button>
          ))}
        </div>
        {rappel && natifDispo ? (
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <span className="texte-2" style={{ fontSize: 13 }}>{t.rappel.heure}</span>
            <input
              type="time"
              value={heure}
              onChange={(e) => changerHeure(e.target.value)}
              style={{
                minHeight: 44,
                borderRadius: 12,
                border: '1.5px solid var(--ligne)',
                background: 'var(--sable)',
                color: 'var(--encre)',
                padding: '0 12px',
                fontSize: 15,
                fontFamily: 'var(--police-ui)',
              }}
            />
          </label>
        ) : null}
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

      <button
        type="button"
        className="carte"
        onClick={surGuide}
        style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 13, cursor: 'pointer', fontFamily: 'var(--police-ui)', textAlign: 'start', color: 'var(--encre)' }}
      >
        <span style={{ width: 42, height: 42, borderRadius: 14, background: 'var(--majorelle-pale)', color: 'var(--majorelle-fonce)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
          <CarnetIcone taille={22} trait={1.8} />
        </span>
        <span style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 14.5, fontWeight: 600 }}>{t.guide.ouvrir}</span>
          <span className="texte-2" style={{ fontSize: 12.5 }}>{t.guide.sousTitre}</span>
        </span>
      </button>

      <div className="carte" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
          <span style={{ width: 42, height: 42, borderRadius: 14, background: 'var(--menthe-pale)', color: 'var(--menthe-fonce)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
            <BoiteIcone taille={22} trait={1.8} />
          </span>
          <span style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 14.5, fontWeight: 600 }}>{t.sauvegarde.titre}</span>
            <span className="texte-2" style={{ fontSize: 12.5 }}>{t.sauvegarde.sousTitre}</span>
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button type="button" className="bouton bouton--secondaire bouton--pleine" style={{ minHeight: 44, fontSize: 14 }} onClick={copierSauvegarde}>
            {t.sauvegarde.copier}
          </button>
          {zoneRestaure === null ? (
            <button type="button" className="bouton bouton--fantome bouton--pleine" style={{ minHeight: 44, fontSize: 14 }} onClick={() => setZoneRestaure('')}>
              {t.sauvegarde.restaurer}
            </button>
          ) : (
            <>
              <textarea
                value={zoneRestaure}
                onChange={(e) => setZoneRestaure(e.target.value)}
                placeholder={t.sauvegarde.coller}
                rows={4}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  borderRadius: 14,
                  border: '1.5px solid var(--ligne)',
                  background: 'var(--sable)',
                  color: 'var(--encre)',
                  padding: 12,
                  fontSize: 12.5,
                  fontFamily: 'ui-monospace, monospace',
                  resize: 'vertical',
                }}
              />
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="bouton bouton--primaire" style={{ flex: '1 1 auto', minHeight: 44, fontSize: 14 }} onClick={validerRestauration}>
                  {t.sauvegarde.valider}
                </button>
                <button type="button" className="bouton bouton--fantome" style={{ flex: '0 0 auto', minHeight: 44, fontSize: 14 }} onClick={() => setZoneRestaure(null)}>
                  {t.sauvegarde.annuler}
                </button>
              </div>
            </>
          )}
          {message ? (
            <p className="texte-2" style={{ fontSize: 12.5, margin: 0 }} role="status">{message}</p>
          ) : null}
        </div>
      </div>

      <div className="carte" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 13 }}>
        <span style={{ width: 42, height: 42, borderRadius: 14, background: 'var(--safran-pale)', color: 'var(--safran-fonce)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
          <PartagerIcone taille={22} trait={1.8} />
        </span>
        <span style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 14.5, fontWeight: 600 }}>{t.partager.titre}</span>
          <span className="texte-2" style={{ fontSize: 12.5 }}>{t.partager.sousTitre}</span>
        </span>
        <button type="button" className="bouton bouton--secondaire" style={{ minHeight: 40, padding: '0 14px', fontSize: 13, flex: '0 0 auto' }} onClick={partager}>
          {t.partager.bouton}
        </button>
      </div>

      <div className="carte" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 14.5, fontWeight: 600 }}>{t.ameliorer.titre}</span>
          <span className="texte-2" style={{ fontSize: 12.5 }}>{t.ameliorer.sousTitre}</span>
        </div>
        <a
          className="bouton bouton--secondaire bouton--pleine"
          style={{ minHeight: 44, fontSize: 14, textDecoration: 'none' }}
          href="https://github.com/Warimvp/rihla/issues/new"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t.ameliorer.bouton}
        </a>
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
