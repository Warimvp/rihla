// Les photos des villes : de vraies photos, embarquées dans l'app (aucune
// requête vers l'extérieur, tout reste hors-ligne), prises sur Wikimedia
// Commons sous licence libre.
//
// Deux règles, et le test les garde :
//   • AUCUNE photo sans crédit. Une photo ne s'affiche que si son fichier ET
//     son crédit existent (src/data/credits-photos.js).
//   • le paysage dessiné (Paysages.jsx) reste derrière chaque photo : c'est
//     lui qu'on voit pendant le chargement, et si le fichier manque.
//
// Les fichiers vivent dans src/assets/photos/<id de langue>.webp (720×338,
// recadrés et compressés par scripts/photos.mjs) : Vite leur donne un nom
// haché, donc le service worker ne les retélécharge jamais deux fois.

import { CREDITS, LICENCES, sourceDe } from './credits-photos.js'

export { CREDITS, LICENCES, sourceDe }

// Les fichiers réellement présents : une photo absente n'est pas une erreur,
// c'est une destination qui garde son paysage dessiné.
const FICHIERS = import.meta.glob('../assets/photos/*.webp', { eager: true, query: '?url', import: 'default' })

const idDe = (chemin) => chemin.split('/').pop().replace(/\.webp$/, '')

// id de langue → URL du fichier livré (nom haché par Vite).
export const PHOTOS = Object.fromEntries(Object.entries(FICHIERS).map(([chemin, url]) => [idDe(chemin), url]))

// La photo d'une destination, avec son crédit — ou null : sans fichier, ou
// sans crédit, il n'y a pas de photo (le paysage dessiné prend la place).
export function construirePhoto(langueId, photos = PHOTOS, credits = CREDITS) {
  const url = photos[langueId]
  const credit = credits[langueId]
  if (!url || !credit || !credit.auteur || !LICENCES[credit.licence]) return null
  return {
    url,
    ...credit,
    cadrage: credit.cadrage ?? '50% 50%',
    source: sourceDe(credit),
    licenceUrl: LICENCES[credit.licence],
  }
}

export const photoDe = (langueId) => construirePhoto(langueId)

export const sujetPhoto = (photo, locale) => (locale === 'ar' ? photo.ar : photo.fr)

// Les photos réellement livrées, dans l'ordre donné (celui de la route).
export const photosLivrees = (langues) => langues.map((langue) => ({ langue, photo: photoDe(langue.id) })).filter((p) => p.photo)
