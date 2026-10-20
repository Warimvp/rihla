// Les barres système d'ANDROID (heure et batterie en haut, geste « accueil » en bas) : leurs icônes doivent
// contraster avec le thème de la PAGE — claires sur le thème sombre, sombres sur le clair.
//
// Le natif ne peut pas le deviner seul : Capacitor choisit le style une fois, au démarrage, d'après le mode
// de nuit du SYSTÈME, et ne le réévalue pas quand le voyageur bascule en cours de route ; il ignore surtout
// le choix explicite des Réglages (« Clair » / « Sombre » imposés quel que soit le système). Sans ceci, un
// thème sombre choisi dans l'application sur un téléphone en mode clair laisse une heure noire sur fond noir.
// C'est donc l'application, qui connaît son thème effectif, qui le dit à Capacitor (greffon SystemBars du noyau).
//
// iOS : sans objet (le style de sa barre d'état suit la page tout seul) — on ne touche qu'Android.

/** Le style des barres pour un thème : 'DARK' = contenu CLAIR sur fond sombre (convention de Capacitor). */
export const styleBarres = (theme, systemeSombre) => (theme === 'sombre' || (theme === 'auto' && systemeSombre) ? 'DARK' : 'LIGHT')

const surAndroid = () => {
  try {
    return window.Capacitor?.getPlatform?.() === 'android'
  } catch {
    return false
  }
}

async function poser(style) {
  try {
    const { SystemBars } = await import('@capacitor/core')
    await SystemBars.setStyle({ style })
  } catch {
    /* des icônes un peu moins contrastées valent mieux qu'une page qui plante */
  }
}

/**
 * Aligne les barres système sur le thème (`'clair' | 'auto' | 'sombre'`) ; en « auto », suit aussi le système
 * en direct. Retourne la fonction qui arrête ce suivi (à rendre à `useEffect`), ou `undefined`.
 */
export function suivreBarres(theme) {
  if (!surAndroid()) return undefined
  const systeme = window.matchMedia?.('(prefers-color-scheme: dark)')
  const appliquer = () => poser(styleBarres(theme, Boolean(systeme?.matches)))
  appliquer()
  if (theme !== 'auto' || !systeme) return undefined
  systeme.addEventListener('change', appliquer)
  return () => systeme.removeEventListener('change', appliquer)
}
