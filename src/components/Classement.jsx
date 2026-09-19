import { useEffect, useState } from 'react'
import { NB_QUESTIONS_BARID } from '../lib/barid.js'
import { enLigneActif, envoyerScore as envoyerParDefaut, lireClassement as lireParDefaut } from '../lib/enligne.js'
import { jourLocal } from '../lib/progression.js'
import { semaineIso } from '../lib/salle.js'
import { identite } from '../lib/voyageur.js'
import { CoupeIcone, Croix } from './Icones.jsx'
import { ConsentementEnLigne } from './EnLigne.jsx'

const TRANSPORT_PAR_DEFAUT = { lireClassement: lireParDefaut, envoyerScore: envoyerParDefaut }

/**
 * Les classements : l'étape du jour (même tirage pour tous — score, puis
 * temps) et les duels de la semaine (3 pts la victoire, 2 l'égalité, 1 la
 * défaite). Cinquante lignes, ta place même au-delà. Le score du jour part
 * tout seul à la fin de l'étape quand le jeu en ligne est activé ; le bouton
 * ici rattrape une étape jouée hors connexion.
 */
export function Classement({ t, progres, surQuitter, transport = TRANSPORT_PAR_DEFAUT }) {
  const voyageur = identite()
  const jour = jourLocal()
  const [actif, setActif] = useState(() => enLigneActif())
  const [type, setType] = useState('jour')
  const [donnees, setDonnees] = useState(null)
  const [etat, setEtat] = useState('chargement') // chargement | ok | erreur
  const [message, setMessage] = useState(null)
  const cle = type === 'jour' ? jour : semaineIso(jour)
  const defi = progres.defis?.[jour] ?? null

  const charger = async () => {
    setEtat('chargement')
    try {
      setDonnees(await transport.lireClassement(type, cle, voyageur.id))
      setEtat('ok')
    } catch {
      setEtat('erreur')
    }
  }

  useEffect(() => {
    if (actif) charger()
  }, [type, actif])

  const envoyer = async () => {
    if (!defi) return
    try {
      await transport.envoyerScore(voyageur, { type: 'jour', cle: jour, score: defi.score, temps: defi.temps ?? 99999 })
      setMessage(t.classement.envoye)
      charger()
    } catch {
      setMessage(t.classement.echec)
    }
    setTimeout(() => setMessage(null), 3500)
  }

  if (!actif) return <ConsentementEnLigne t={t} surActiver={() => setActif(true)} surRefuser={surQuitter} />

  const ligne = (l, moi) => (
    <div
      key={l.id ?? 'moi'}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 14px',
        borderRadius: 14,
        background: moi ? 'var(--majorelle-pale)' : 'transparent',
        color: moi ? 'var(--majorelle-fonce)' : 'var(--encre)',
        fontWeight: moi ? 600 : 400,
      }}
    >
      <span style={{ width: '3ch', textAlign: 'end', fontVariantNumeric: 'tabular-nums', fontWeight: 700, color: l.rang <= 3 ? 'var(--safran-fonce)' : 'inherit' }}>{l.rang}</span>
      <span style={{ flex: '1 1 auto', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {l.nom || t.classement.anonyme}
        {moi ? <span className="texte-2" style={{ fontSize: 12, marginInlineStart: 6 }}>· {t.classement.toi}</span> : null}
      </span>
      <span style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums', flex: '0 0 auto' }}>
        {type === 'jour' ? t.classement.scoreJour(l.score, NB_QUESTIONS_BARID, l.temps) : t.classement.scoreSemaine(l.score, l.temps)}
      </span>
    </div>
  )

  const dansLaListe = donnees?.lignes.some((l) => l.id === voyageur.id)

  return (
    <div className="vue" style={{ gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          type="button"
          onClick={surQuitter}
          aria-label={t.fermer}
          style={{ width: 44, height: 44, marginInlineStart: -11, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--encre-2)', flex: '0 0 auto' }}
        >
          <Croix taille={22} trait={2.2} />
        </button>
        <span style={{ flex: '1 1 auto', fontSize: 15.5, fontWeight: 600 }}>{t.classement.titre}</span>
        <span style={{ color: 'var(--safran-fonce)', display: 'inline-flex' }}>
          <CoupeIcone taille={24} trait={1.8} />
        </span>
      </div>

      <div className="segmente">
        {['jour', 'semaine'].map((valeur) => (
          <button key={valeur} type="button" className={`segmente__choix ${type === valeur ? 'segmente__choix--actif' : ''}`} onClick={() => setType(valeur)}>
            {t.classement[valeur]}
          </button>
        ))}
      </div>
      <p className="texte-2" style={{ fontSize: 12.5, textAlign: 'center' }}>
        {type === 'jour' ? t.classement.jourSub(cle) : t.classement.semaineSub(cle)}
      </p>

      {type === 'jour' ? (
        <div className="carte" style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {defi ? (
            <>
              <span style={{ fontSize: 13.5 }}>
                {t.defi.faite(defi.score, defi.total)}
                {defi.temps != null ? ` · ${t.barid.chrono(defi.temps)}` : ''}
              </span>
              <button type="button" className="bouton bouton--secondaire bouton--pleine" style={{ minHeight: 40, fontSize: 13.5 }} onClick={envoyer}>
                {t.classement.envoyer}
              </button>
            </>
          ) : (
            <span className="texte-2" style={{ fontSize: 13 }}>{t.classement.faisDefi}</span>
          )}
          <p role="status" className={message ? 'texte-2' : 'lecteur-seul'} style={{ fontSize: 12.5 }}>
            {message ?? ''}
          </p>
        </div>
      ) : null}

      <div className="carte" style={{ padding: '6px 4px', display: 'flex', flexDirection: 'column' }}>
        {etat === 'chargement' ? <p className="texte-2" style={{ padding: 14, textAlign: 'center' }}>{t.classement.chargement}</p> : null}
        {etat === 'erreur' ? (
          <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
            <p className="texte-2" style={{ textAlign: 'center', fontSize: 13 }}>{t.enligne.horsLigne}</p>
            <button type="button" className="bouton bouton--secondaire" style={{ minHeight: 40, fontSize: 13.5, padding: '0 16px' }} onClick={charger}>
              {t.course.reessayer}
            </button>
          </div>
        ) : null}
        {etat === 'ok' && donnees ? (
          donnees.lignes.length ? (
            <>
              {donnees.lignes.map((l) => ligne(l, l.id === voyageur.id))}
              {donnees.moi && !dansLaListe ? (
                <>
                  <div style={{ borderTop: '1px dashed var(--ligne-2)', margin: '4px 14px' }}></div>
                  {ligne({ ...donnees.moi, id: voyageur.id, nom: voyageur.nom }, true)}
                </>
              ) : null}
            </>
          ) : (
            <p className="texte-2" style={{ padding: 14, textAlign: 'center', fontSize: 13 }}>{t.classement.vide}</p>
          )
        ) : null}
      </div>

      {etat === 'ok' && donnees ? (
        <p className="texte-2" style={{ fontSize: 12.5, textAlign: 'center' }}>
          {donnees.moi ? t.classement.monRang(donnees.moi.rang, donnees.total) : t.classement.pasClasse}
        </p>
      ) : null}
    </div>
  )
}
