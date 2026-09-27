// Le retour du système (bouton retour d'Android, du navigateur).
//
// App pose une entrée dans l'historique pour chaque écran ouvert et la reprend
// au retour. Avant de fermer, il DEMANDE : l'écran ouvert peut retenir le
// voyageur (une étape entamée, une partie en cours) en annulant l'événement.

export const EVENEMENT_RETOUR = 'rihla:retour'

// La profondeur que porte une entrée de l'historique : 0 pour toute entrée
// qui n'est pas la nôtre (la page d'arrivée, un lien #barid=…).
export const profondeurDe = (etat) => (Number.isInteger(etat?.rihla) && etat.rihla > 0 ? etat.rihla : 0)

/**
 * Retient le retour du système tant que `actif` est vrai : `surDemande` est
 * appelée à la place de la fermeture. Rend la fonction de désabonnement.
 */
export function retenirRetour(surDemande, cible = window) {
  const ecouter = (e) => {
    e.preventDefault()
    surDemande()
  }
  cible.addEventListener(EVENEMENT_RETOUR, ecouter)
  return () => cible.removeEventListener(EVENEMENT_RETOUR, ecouter)
}
