// L'identité du voyageur pour tout ce qui sort de l'appareil (Barid, Course,
// classements) : un pseudonyme libre, un identifiant tiré au hasard et un
// secret que seul cet appareil connaît — jamais de compte, jamais d'e-mail.
// Le secret sert au serveur à reconnaître le même appareil (personne ne peut
// écraser ton score avec ton nom) ; il ne quitte jamais l'app autrement.
import { nettoyerNom, nomPublic } from './barid.js'

export const CLE_VOYAGEUR = 'rihla.voyageur'
const ANCIENNE_CLE_NOM = 'rihla.barid.nom'

const stockageParDefaut = () => (typeof localStorage === 'undefined' ? null : localStorage)

const hexAleatoire = (octets) => {
  const tableau = new Uint8Array(octets)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(tableau)
  else for (let i = 0; i < octets; i++) tableau[i] = Math.floor(Math.random() * 256)
  return [...tableau].map((o) => o.toString(16).padStart(2, '0')).join('')
}

const lire = (stockage) => {
  try {
    const brut = stockage?.getItem(CLE_VOYAGEUR)
    const lu = brut ? JSON.parse(brut) : null
    if (lu && typeof lu.id === 'string' && typeof lu.secret === 'string') {
      return { id: lu.id, secret: lu.secret, nom: nettoyerNom(lu.nom) }
    }
  } catch {
    /* illisible : on repart de zéro */
  }
  return null
}

const ecrire = (stockage, voyageur) => {
  try {
    stockage?.setItem(CLE_VOYAGEUR, JSON.stringify(voyageur))
  } catch {
    /* sans stockage, l'identité vaut pour la session */
  }
}

let enMemoire = null

// Ce qui sort de ce module est toujours montrable : le nom saisi est gardé tel
// quel (le champ le réaffiche, et une liste qui s'assouplit le rend un jour
// acceptable), mais `identite().nom` — ce qui part au serveur, ce qu'on
// affiche — passe par le filtre des pseudonymes (pseudo.js). Refusé : vide.
const publique = (voyageur) => ({ ...voyageur, nom: nomPublic(voyageur.nom) })

// Toujours la même identité sur cet appareil ; créée à la première demande.
// Le nom choisi pour le Barid avant l'existence de ce module est repris.
export function identite(stockage = stockageParDefaut()) {
  const lue = lire(stockage)
  if (lue) {
    enMemoire = lue
    return publique(lue)
  }
  if (enMemoire) return publique(enMemoire)
  let nom = ''
  try {
    nom = nettoyerNom(stockage?.getItem(ANCIENNE_CLE_NOM) ?? '')
  } catch {
    /* rien à reprendre */
  }
  enMemoire = { id: hexAleatoire(8), secret: hexAleatoire(16), nom }
  ecrire(stockage, enMemoire)
  return publique(enMemoire)
}

export const nomVoyageur = (stockage = stockageParDefaut()) => identite(stockage).nom

// Rend le nom nettoyé, tel que tapé : c'est ce que le champ réaffiche. Le filtre
// ne vit pas ici — il viderait le champ en pleine frappe (« zeb » avant
// « zebra ») — mais dans `identite().nom`, ce qui SORT de l'appareil.
export function reglerNom(nom, stockage = stockageParDefaut()) {
  const propre = nettoyerNom(nom)
  enMemoire = { ...identite(stockage), nom: propre }
  ecrire(stockage, enMemoire)
  return propre
}

// Pour les tests : oublier l'identité gardée en mémoire.
export const oublierIdentite = () => {
  enMemoire = null
}
