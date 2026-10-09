// Informer d'une mise à jour — sans jamais appeler le réseau.
//
// Rihla promet à Apple et dans sa page de confidentialité qu'elle ne fait
// aucune requête : elle ne peut donc pas « chercher » une nouvelle version.
// Ce que l'app peut faire, c'est (1) dire ce qui est nouveau, UNE fois, à qui
// vient de la mettre à jour, et (2) ouvrir sa fiche App Store sur demande — un
// lien, comme celui de GitHub : c'est l'App Store qui parle, pas l'app.

// MAJEUR.MINEUR de la version publiée (celle de MARKETING_VERSION dans le
// projet iOS : `miseajour.test.js` les garde accordées). Une version
// corrective (1.1.1) ne change rien ici : pas de nouvelle fenêtre ; une
// version mineure (1.2) oblige à réécrire `t.nouveautes` (FR + AR) et à
// monter ce numéro.
export const VERSION_APP = '1.1'

export const CLE_NOUVEAUTES = 'rihla.nouveautes'

export const LIEN_APP_STORE = 'https://apps.apple.com/app/id6809222617'

// L'app iOS, pas n'importe quelle coque native : le lien est celui de l'App
// Store d'Apple. Capacitor pose son objet global dans la WebView (même
// raisonnement que `estNatif` : aucune dépendance du web envers le natif).
export const estIos = () => {
  try {
    return globalThis.Capacitor?.getPlatform?.() === 'ios'
  } catch {
    return false
  }
}

// `vue` : la version dont on a déjà montré les nouveautés (null = jamais).
// `existant` : l'app a déjà servi avant ce lancement (un cap choisi, des
// étapes validées) — c'est ce qui sépare celui qui met à jour de celui qui
// installe : à une première installation, tout est nouveau, donc rien ne
// l'est. On range alors la version en silence (`marquer`).
export function decision({ vue, existant, version = VERSION_APP }) {
  if (vue === version) return { montrer: false, marquer: false }
  if (vue === null && !existant) return { montrer: false, marquer: true }
  return { montrer: true, marquer: false }
}
