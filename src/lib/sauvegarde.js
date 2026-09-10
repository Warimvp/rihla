// Sauvegarde du voyage : l'app est 100 % locale, donc vider le navigateur
// (ou changer de téléphone) effacerait tout. On exporte le progrès en texte
// que l'utilisateur garde où il veut, et qu'il recolle pour restaurer.
import { progresInitial } from './progression.js'

export const MARQUE = 'rihla-sauvegarde'
export const VERSION_SAUVEGARDE = 1

// Compact volontairement : ce texte transite par le presse-papiers, personne
// ne le lit à l'œil, et l'indentation gonflait la sauvegarde de ~78 %.
// Le format ne change pas pour autant : les anciennes sauvegardes indentées
// restent lisibles par importerProgres (JSON.parse ignore la mise en page).
export function exporterProgres(progres, jour) {
  return JSON.stringify({ marque: MARQUE, version: VERSION_SAUVEGARDE, jour, progres })
}

const estObjet = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)

// Tolérant sur ce qui manque (on complète avec l'état initial), strict sur ce
// qui est manifestement faux : on ne remplace jamais un voyage par du bruit.
export function importerProgres(texte) {
  let lu
  try {
    lu = JSON.parse(String(texte ?? '').trim())
  } catch {
    return { ok: false, erreur: 'illisible' }
  }
  if (!estObjet(lu) || lu.marque !== MARQUE) return { ok: false, erreur: 'inconnu' }
  if (lu.version !== VERSION_SAUVEGARDE) return { ok: false, erreur: 'version' }
  const p = lu.progres
  if (!estObjet(p) || typeof p.xp !== 'number' || !Number.isFinite(p.xp) || p.xp < 0) {
    return { ok: false, erreur: 'corrompu' }
  }
  if (!estObjet(p.etapes) || !estObjet(p.serie) || typeof p.serie.compte !== 'number') {
    return { ok: false, erreur: 'corrompu' }
  }
  const base = progresInitial()
  return {
    ok: true,
    progres: {
      ...base,
      ...p,
      version: base.version,
      serie: { ...base.serie, ...p.serie },
      etapes: p.etapes,
      defis: estObjet(p.defis) ? p.defis : {},
      carnet: estObjet(p.carnet) ? p.carnet : {},
      xpJours: estObjet(p.xpJours) ? p.xpJours : {},
      gels: typeof p.gels === 'number' && p.gels >= 0 ? p.gels : 0,
      visas: estObjet(p.visas) ? p.visas : {},
      parcours: estObjet(p.parcours) ? p.parcours : {},
    },
  }
}

// Les 7 derniers jours d'activité (aujourd'hui en dernier), pour le passeport.
export function semaineActivite(progres, jour) {
  const [y, m, d] = jour.split('-').map(Number)
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(Date.UTC(y, m - 1, d - (6 - i)))
    const cle = date.toISOString().slice(0, 10)
    return { jour: cle, xp: progres.xpJours?.[cle] ?? 0, jourSemaine: date.getUTCDay() }
  })
}
