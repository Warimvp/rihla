// Jetons de l'app (src/styles.css, thème clair) + ceux propres aux pubs, relevés sur les vidéos d'origine.
export const C = {
  sable: '#f7f0e3',
  papier: '#fdf8ee',
  encre: '#2b1e12',
  encre2: '#7a6a55',
  majorelle: '#4e46c8',
  majorelleFonce: '#3a34a0',
  majorellePale: '#e4e2f8',
  surMajorelle: '#f2f0fd',
  terracotta: '#c8552f',
  safran: '#e9a319',
  safranFonce: '#7a5107',
  menthe: '#23795b',
  ligne: '#e5dac4',
  // Propres aux pubs
  nuit: '#1c1612', // fond sombre des scènes « Aujourd'hui » et « Pas de Wi-Fi ? »
  nuitViolette: '#2c2440', // cabine d'avion
}

export const POLICE_TITRE = "'Amiri', 'Geeza Pro', Georgia, serif"
export const POLICE_UI = "'Readex Pro', 'Avenir Next', 'Segoe UI', sans-serif"
export const POLICE_LATIN = "'Young Serif', Georgia, serif"

export const LARGEUR = 1080
export const HAUTEUR = 1920
export const FPS = 30
export const sec = (s) => Math.round(s * FPS)
