import { useState } from 'react'
import { photoDe } from '../data/photos.js'
import { Paysage } from './Paysages.jsx'

// L'image d'une destination : sa PHOTO quand l'app en a une, posée sur le
// paysage dessiné. Le paysage ne part jamais — c'est lui qu'on voit le temps
// que la photo arrive (elle apparaît en fondu), et lui qui reste si le
// fichier manque ou ne se charge pas : pas de cadre vide, pas de saut de mise
// en page (la hauteur vient du paysage, la photo s'y inscrit).
//
// Décorative par défaut, comme le paysage : la ville est toujours nommée à
// côté. Le crédit de la photo s'affiche là où elle est montrée en grand
// (`CreditPhoto`) et dans les Réglages — voir src/data/photos.js.
export function ImageVille({ langue, format = 'grand', photo = photoDe(langue?.id), className }) {
  const [etat, setEtat] = useState('attente')
  return (
    <span className={`image-ville${className ? ` ${className}` : ''}`}>
      <Paysage langue={langue} format={format} />
      {photo && etat !== 'erreur' ? (
        <img
          className={`image-ville__photo${etat === 'prete' ? ' image-ville__photo--prete' : ''}`}
          src={photo.url}
          alt=""
          decoding="async"
          draggable={false}
          style={{ objectPosition: photo.cadrage }}
          onLoad={() => setEtat('prete')}
          onError={() => setEtat('erreur')}
        />
      ) : null}
    </span>
  )
}

// Tous les crédits, ville par ville (Réglages). Rien à montrer sans photo :
// la carte n'existe pas tant qu'aucun fichier n'est livré.
export function CreditsPhotos({ t, locale, photos }) {
  if (!photos.length) return null
  return (
    <details className="carte credits-photos">
      <summary>
        <span style={{ fontSize: 14.5, fontWeight: 600 }}>{t.photos.titre}</span>
      </summary>
      <p className="texte-2" style={{ fontSize: 12.5, lineHeight: 1.6 }}>{t.photos.sousTitre}</p>
      <ul>
        {photos.map(({ langue, photo }) => (
          <li key={langue.id}>
            <span style={{ fontWeight: 600 }}>{locale === 'ar' ? langue.villeAr : langue.ville}</span>
            {' — '}
            {locale === 'ar' ? photo.ar : photo.fr}
            <CreditPhoto t={t} photo={photo} />
          </li>
        ))}
      </ul>
    </details>
  )
}

// « Photo : Diego Delso, CC BY-SA 4.0 » — l'auteur mène à la source, la
// licence à son texte. `rel="license"` la déclare aux machines.
export function CreditPhoto({ t, langue, photo = photoDe(langue?.id), className, style }) {
  if (!photo) return null
  const licence = photo.licence === 'Domaine public' ? t.photos.domainePublic : photo.licence
  return (
    <p className={`credit-photo${className ? ` ${className}` : ''}`} style={style}>
      {t.photos.photo}{' '}
      <a href={photo.source} target="_blank" rel="noopener noreferrer">
        <bdi>{photo.auteur}</bdi>
      </a>
      {', '}
      <a href={photo.licenceUrl} target="_blank" rel="license noopener noreferrer">
        <bdi>{licence}</bdi>
      </a>
      {` ${t.photos.recadree}`}
    </p>
  )
}
