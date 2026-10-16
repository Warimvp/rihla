import { Easing, interpolate } from 'remotion'

export const sortieDouce = Easing.bezier(0.16, 1, 0.3, 1)
export const entreeSortie = Easing.bezier(0.45, 0, 0.55, 1)
export const rebond = Easing.bezier(0.34, 1.56, 0.64, 1)

const borne = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }

// Progression 0 → 1 entre deux images, avec une courbe.
export const prog = (frame, debut, fin, easing = sortieDouce) =>
  interpolate(frame, [debut, fin], [0, 1], { ...borne, easing })

// Même chose entre deux valeurs.
export const entre = (frame, [d, f], [a, b], easing = sortieDouce) =>
  interpolate(frame, [d, f], [a, b], { ...borne, easing })

// Fondu en entrée puis en sortie.
export const fenetre = (frame, entree, sortie, dureeFondu = 8) =>
  Math.min(prog(frame, entree, entree + dureeFondu, Easing.linear), 1 - prog(frame, sortie - dureeFondu, sortie, Easing.linear))

// Bruit déterministe (jamais Math.random : le rendu doit être identique à chaque image).
export const bruit = (n) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}
