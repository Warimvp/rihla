// Progression locale de la rihla : XP, série de jours, étapes validées, visas.
// Tout est pur et le stockage est injectable pour les tests.

const CLE = 'rihla.progres.v1'

export const progresInitial = () => ({
  version: 1,
  xp: 0,
  serie: { compte: 0, dernierJour: null },
  etapes: {},
  defis: {},
})

const stockageParDefaut = () => (typeof localStorage === 'undefined' ? null : localStorage)

export function chargerProgres(stockage = stockageParDefaut()) {
  if (!stockage) return progresInitial()
  try {
    const brut = stockage.getItem(CLE)
    if (!brut) return progresInitial()
    const lu = JSON.parse(brut)
    if (!lu || lu.version !== 1 || typeof lu.etapes !== 'object') return progresInitial()
    return { ...progresInitial(), ...lu, serie: { ...progresInitial().serie, ...lu.serie } }
  } catch {
    return progresInitial()
  }
}

export function sauverProgres(progres, stockage = stockageParDefaut()) {
  if (!stockage) return
  try {
    stockage.setItem(CLE, JSON.stringify(progres))
  } catch {
    // Stockage plein ou indisponible : l'app continue, la partie n'est juste pas retenue.
  }
}

export const cleEtape = (langueId, leconId) => `${langueId}:${leconId}`

// 'YYYY-MM-DD' local.
export function jourLocal(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function veilleDe(jour) {
  const [y, m, d] = jour.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  date.setUTCDate(date.getUTCDate() - 1)
  return date.toISOString().slice(0, 10)
}

// La série ne bouge qu'une fois par jour : même jour → inchangée,
// lendemain → +1, trou dans le calendrier → repart à 1.
export function majSerie(serie, jour) {
  if (serie.dernierJour === jour) return serie
  if (serie.dernierJour === veilleDe(jour)) return { compte: serie.compte + 1, dernierJour: jour }
  return { compte: 1, dernierJour: jour }
}

export const SEUIL_VALIDATION = 0.75

// Enregistre le résultat d'une étape. Retourne le nouveau progrès et le bilan.
export function enregistrerEtape(progres, langueId, leconId, score, total, jour = jourLocal()) {
  const cle = cleEtape(langueId, leconId)
  const valide = score >= Math.ceil(total * SEUIL_VALIDATION)
  const xpGagne = score * 10 + (score === total ? 20 : 0)
  const existante = progres.etapes[cle]
  const etape = {
    score: Math.max(score, existante?.score ?? 0),
    total,
    valide: valide || (existante?.valide ?? false),
    jour,
  }
  const nouveau = {
    ...progres,
    xp: progres.xp + xpGagne,
    serie: valide ? majSerie(progres.serie, jour) : progres.serie,
    etapes: { ...progres.etapes, [cle]: etape },
  }
  return { progres: nouveau, xpGagne, valide }
}

// XP gagnés hors étapes (jeux du voyage). Jamais négatif.
export function ajouterXp(progres, montant) {
  return { ...progres, xp: progres.xp + Math.max(0, Math.round(montant)) }
}

// L'étape du jour : première réussite du jour → XP + la série avance
// (quel que soit le score : c'est un rituel quotidien, pas un examen).
// La refaire le même jour ne rapporte plus rien mais garde le meilleur score.
export function enregistrerDefi(progres, score, total, jour = jourLocal()) {
  const deja = progres.defis?.[jour]
  const xpGagne = deja ? 0 : score * 4 + (score === total ? 10 : 0)
  const serieAvant = progres.serie.compte
  const serie = deja ? progres.serie : majSerie(progres.serie, jour)
  const nouveau = {
    ...progres,
    xp: progres.xp + xpGagne,
    serie,
    defis: { ...(progres.defis ?? {}), [jour]: { score: Math.max(score, deja?.score ?? 0), total } },
  }
  return { progres: nouveau, xpGagne, dejaFaite: Boolean(deja), serieAvancee: serie.compte > serieAvant }
}

export const defiDuJour = (progres, jour = jourLocal()) => progres.defis?.[jour] ?? null

export const etapeValidee = (progres, langueId, leconId) =>
  progres.etapes[cleEtape(langueId, leconId)]?.valide ?? false

export const etapesValidees = (progres, langue) =>
  langue.lecons.filter((lecon) => etapeValidee(progres, langue.id, lecon.id)).length

export const visaObtenu = (progres, langue) => etapesValidees(progres, langue) === langue.lecons.length

export const nbVisas = (progres, langues) => langues.filter((l) => visaObtenu(progres, l)).length

// Km « parcourus » : chaque destination compte au prorata de ses étapes validées.
export function kmParcourus(progres, langues) {
  const total = langues.reduce(
    (somme, langue) => somme + (langue.km * etapesValidees(progres, langue)) / langue.lecons.length,
    0
  )
  return Math.round(total)
}

// Prochaine étape à jouer : d'abord une destination entamée, sinon la première
// non terminée sur la route.
export function prochaineEtape(progres, langues) {
  const entamee = langues.find((l) => {
    const n = etapesValidees(progres, l)
    return n > 0 && n < l.lecons.length
  })
  const cible = entamee ?? langues.find((l) => !visaObtenu(progres, l))
  if (!cible) return null
  const lecon = cible.lecons.find((le) => !etapeValidee(progres, cible.id, le.id))
  return lecon ? { langue: cible, lecon } : null
}
