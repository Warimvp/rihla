// Le rappel quotidien : une notification locale à l'heure choisie, planifiée
// sur l'appareil (aucun serveur, rien qui parte sur le réseau). Natif
// seulement — sur le web, les notifications programmées ne survivent pas à la
// fermeture de l'onglet, alors on préfère ne rien promettre.

export const HEURE_DEFAUT = '19:00'
export const ID_RAPPEL = 1325 // l'année du départ d'Ibn Battuta

export const rappelActif = () => {
  try {
    return localStorage.getItem('rihla.rappel') === 'oui'
  } catch {
    return false
  }
}

export const heureRappel = () => {
  try {
    const brut = localStorage.getItem('rihla.rappel.heure')
    return estHeureValide(brut) ? brut : HEURE_DEFAUT
  } catch {
    return HEURE_DEFAUT
  }
}

export function estHeureValide(valeur) {
  if (typeof valeur !== 'string') return false
  const m = /^(\d{2}):(\d{2})$/.exec(valeur)
  if (!m) return false
  const h = Number(m[1])
  const min = Number(m[2])
  return h >= 0 && h <= 23 && min >= 0 && min <= 59
}

export const decouperHeure = (valeur) => {
  const [h, m] = (estHeureValide(valeur) ? valeur : HEURE_DEFAUT).split(':').map(Number)
  return { hour: h, minute: m }
}

// La notification qu'on planifie : quotidienne, à heure fixe, sans son
// agressif — un carnet de voyage ne crie pas.
export function planNotification(heure, textes) {
  const { hour, minute } = decouperHeure(heure)
  return {
    id: ID_RAPPEL,
    title: textes.titre,
    body: textes.corps,
    schedule: { on: { hour, minute }, allowWhileIdle: true },
  }
}

const natif = async () => {
  const { Capacitor } = await import('@capacitor/core')
  return Capacitor.isNativePlatform()
}

export const rappelDisponible = () => {
  try {
    return Boolean(window.Capacitor?.isNativePlatform?.())
  } catch {
    return false
  }
}

// Active le rappel : demande la permission, annule l'ancien, planifie le neuf.
// Retourne 'ok' | 'refuse' | 'indisponible'.
export async function activerRappel(heure, textes) {
  if (!(await natif())) return 'indisponible'
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications')
    const permission = await LocalNotifications.requestPermissions()
    if (permission.display !== 'granted') return 'refuse'
    await LocalNotifications.cancel({ notifications: [{ id: ID_RAPPEL }] })
    await LocalNotifications.schedule({ notifications: [planNotification(heure, textes)] })
    localStorage.setItem('rihla.rappel', 'oui')
    localStorage.setItem('rihla.rappel.heure', estHeureValide(heure) ? heure : HEURE_DEFAUT)
    return 'ok'
  } catch {
    return 'indisponible'
  }
}

export async function desactiverRappel() {
  try {
    localStorage.setItem('rihla.rappel', 'non')
    if (!(await natif())) return
    const { LocalNotifications } = await import('@capacitor/local-notifications')
    await LocalNotifications.cancel({ notifications: [{ id: ID_RAPPEL }] })
  } catch {
    /* rien à annuler */
  }
}
