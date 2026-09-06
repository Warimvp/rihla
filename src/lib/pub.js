// Publicité : socle neutre, ÉTEINT par défaut.
//
// Règle d'or (voir la stratégie) : la pub ne touche jamais l'apprentissage.
// Aucune pub pendant une leçon, un jeu, une révision ou l'étape du jour.
// Deux emplacements seulement :
//   1. RÉCOMPENSÉE, opt-in : l'utilisateur choisit de regarder pour gagner
//      une nuit de caravansérail — c'est le format le mieux payé et le seul
//      qu'on subit pas.
//   2. INTERSTITIELLE, plafonnée : entre deux étapes, jamais avant, avec un
//      quota strict (voir peutMontrerInterstitiel).
//
// Le fournisseur (AdMob…) se branche à l'exécution : tant qu'aucun n'est
// branché, tout renvoie « indisponible » et l'app se comporte comme avant.

export const ETAPES_ENTRE_INTERSTITIELS = 3
export const MINUTES_ENTRE_INTERSTITIELS = 5
export const NUITS_PAR_PUB = 1

const AUCUN = {
  nom: 'aucun',
  estPret: () => false,
  montrerRecompensee: async () => 'indisponible',
  montrerInterstitiel: async () => 'indisponible',
}

let fournisseur = AUCUN

// Branché depuis main.jsx le jour où un compte AdMob existe :
//   brancherFournisseur(fournisseurAdMob({ recompensee: 'ca-app-pub-…' }))
export function brancherFournisseur(f) {
  fournisseur = f ?? AUCUN
}

export const pubsDisponibles = () => {
  try {
    return fournisseur !== AUCUN && fournisseur.estPret()
  } catch {
    return false
  }
}

// Quota des interstitielles : au moins N étapes ET M minutes depuis la
// dernière. Pur et testable — c'est le garde-fou contre l'app qui devient
// insupportable un jour de mise à jour.
export function peutMontrerInterstitiel(etat, maintenant) {
  if (!etat || typeof etat !== 'object') return true
  const { derniere = 0, etapesDepuis = Infinity } = etat
  if (etapesDepuis < ETAPES_ENTRE_INTERSTITIELS) return false
  return maintenant - derniere >= MINUTES_ENTRE_INTERSTITIELS * 60_000
}

export const compterEtape = (etat) => ({
  derniere: etat?.derniere ?? 0,
  etapesDepuis: (etat?.etapesDepuis ?? 0) + 1,
})

export const marquerInterstitiel = (maintenant) => ({ derniere: maintenant, etapesDepuis: 0 })

// Récompensée : renvoie 'ok' (vue jusqu'au bout), 'annulee' (fermée avant la
// fin : aucune récompense), ou 'indisponible' (hors-ligne, pas de fournisseur…).
export async function regarderPourUneNuit() {
  if (!pubsDisponibles()) return 'indisponible'
  try {
    return await fournisseur.montrerRecompensee()
  } catch {
    return 'indisponible'
  }
}
