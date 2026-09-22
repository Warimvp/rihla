// Le pourboire — un lien, et seulement sur le web.
//
// Règle d'Apple (3.1.1) : dans une app de l'App Store, tout paiement numérique
// passe par l'achat intégré ; un lien vers Ko-fi, PayPal ou Stripe y vaut un
// rejet. Le web, lui, n'est pas concerné : il encaisse directement, sans les
// 15 % d'Apple, sans contrat « Paid Applications », sans coordonnées bancaires.
//
// D'où DEUX verrous, et il faut les deux :
//   1. une adresse au build (VITE_RIHLA_POURBOIRE) — jamais dans le `.env` que
//      lit `pnpm ios:sync` ;
//   2. la plateforme : rien sur un appareil natif, même si l'adresse a été
//      embarquée par mégarde. Le second rattrape l'oubli du premier.
// Sans les deux, `lienPourboire()` vaut null et aucune carte n'est rendue.
//
// Rien n'est acheté : le lien ne déverrouille aucun contenu, ne touche ni aux
// XP, ni aux visas, ni à la série. Rihla reste gratuite pour toujours.

const propre = (url) => {
  const texte = String(url ?? '').trim()
  // https seul : un lien de paiement en clair n'a rien à faire ici.
  return /^https:\/\/\S+$/.test(texte) ? texte : ''
}

// `import.meta.env` n'existe que sous Vite — on lit prudemment (cf. enligne.js).
const adresseDuBuild = () => {
  try {
    return propre(import.meta.env?.VITE_RIHLA_POURBOIRE)
  } catch {
    return ''
  }
}

// Comme `rihla.serveur` pour le jeu en ligne : essayer une adresse en dev sans
// rebâtir ni créer de .env (qui partirait dans le build iOS au `ios:sync`
// suivant). Le garde natif ci-dessous vaut quand même : cette clé n'ouvre
// aucune porte dans l'app de l'App Store.
export const CLE_POURBOIRE = 'rihla.pourboire'

const lireLocal = (cle) => {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage.getItem(cle)
  } catch {
    return null
  }
}

const adresseChoisie = () => propre(lireLocal(CLE_POURBOIRE)) || adresseDuBuild()

// Capacitor pose son objet global dans la WebView : pas d'import, donc aucune
// dépendance du web envers le natif.
export const estNatif = () => {
  try {
    return Boolean(globalThis.Capacitor?.isNativePlatform?.())
  } catch {
    return false
  }
}

export function lienPourboire({ adresse = adresseChoisie(), natif = estNatif() } = {}) {
  if (natif) return null
  return propre(adresse) || null
}
