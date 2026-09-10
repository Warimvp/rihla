// Prononciation gratuite et hors-ligne : la synthèse vocale du système
// (Web Speech API). Les voix varient énormément selon l'appareil — un Android
// d'entrée de gamme n'embarque souvent ni le swahili, ni le persan.
//
// Règle : mieux vaut se taire que mentir. Poser `phrase.lang = 'sw-KE'` sans
// voix swahili fait lire le mot par la voix par défaut du téléphone (souvent
// française) — l'app enseignerait alors une prononciation fausse, puis
// demanderait à l'apprenant de la reconnaître. On cherche donc une vraie voix
// pour la langue, et sans elle on renonce à parler.

const apiDisponible = () =>
  typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window

const normaliser = (code) => String(code ?? '').trim().toLowerCase().replace(/_/g, '-')

// La plus « installée » d'un lot équivalent : celle marquée par défaut, sinon
// une voix locale (elle fonctionne hors-ligne, comme le reste de l'app).
const meilleure = (liste) =>
  liste.find((v) => v.default) ?? liste.find((v) => v.localService) ?? liste[0]

/**
 * La meilleure voix disponible pour un code BCP-47 (`langue.tts`), ou `null`.
 *
 * Pure et testable : on lui passe la liste de voix, elle ne lit rien du monde.
 * Correspondance exacte d'abord (`sw-KE` → `sw-KE`), puis par préfixe de langue
 * (`sw-KE` → `sw-TZ` convient : c'est du swahili). **Jamais** de repli sur une
 * autre langue : sans voix de la bonne langue, la réponse est `null`.
 */
export function voixPour(voix, code) {
  const cible = normaliser(code)
  if (!Array.isArray(voix) || voix.length === 0 || !cible) return null
  const prefixe = cible.split('-')[0]
  const utilisables = voix.filter((v) => v && normaliser(v.lang))
  const exactes = utilisables.filter((v) => normaliser(v.lang) === cible)
  if (exactes.length > 0) return meilleure(exactes)
  const memeLangue = utilisables.filter((v) => normaliser(v.lang).split('-')[0] === prefixe)
  return memeLangue.length > 0 ? meilleure(memeLangue) : null
}

/**
 * La liste des voix du système, ou `[]`.
 *
 * `getVoices()` est asynchrone en pratique : sur la plupart des navigateurs
 * elle rend un tableau VIDE au premier appel et ne se remplit qu'au moment de
 * l'événement `voiceschanged`. Un tableau vide ne veut donc pas dire « aucune
 * voix » — seulement « on ne sait pas encore ».
 */
const listeVoix = () => {
  if (!apiDisponible()) return []
  try {
    return window.speechSynthesis.getVoices() ?? []
  } catch {
    return []
  }
}

const abonnes = new Set()

/**
 * Prévient quand la liste des voix arrive (elle est vide au démarrage).
 * Rend une fonction de désabonnement. Sans API vocale, ne fait rien.
 */
export function surVoixPretes(rappel) {
  if (!apiDisponible() || typeof window.speechSynthesis.addEventListener !== 'function') return () => {}
  abonnes.add(rappel)
  return () => abonnes.delete(rappel)
}

// Amorce : le simple fait d'appeler getVoices() déclenche le chargement sur
// Chrome/Android ; l'événement nous dit quand la liste est vraiment là.
if (apiDisponible() && typeof window.speechSynthesis.addEventListener === 'function') {
  listeVoix()
  window.speechSynthesis.addEventListener('voiceschanged', () => {
    for (const rappel of abonnes) rappel()
  })
}

/**
 * Peut-on prononcer CETTE langue sur cet appareil ?
 *
 * Sans code de langue : la question redevient « l'API existe-t-elle ? ».
 * Tant que la liste des voix est inconnue (vide), on reste permissif : couper
 * l'audio partout au démarrage serait pire que de tenter une prononciation.
 */
export function peutParler(codeLangue) {
  if (!apiDisponible()) return false
  if (!codeLangue) return true
  const voix = listeVoix()
  if (voix.length === 0) return true
  return voixPour(voix, codeLangue) !== null
}

export function parler(texte, codeLangue) {
  if (!apiDisponible()) return false
  const voix = listeVoix()
  const choisie = voixPour(voix, codeLangue)
  // Liste connue et aucune voix pour cette langue : on se tait.
  if (!choisie && voix.length > 0 && codeLangue) return false
  const phrase = new SpeechSynthesisUtterance(texte.replace(/[…?¿？]/g, ' '))
  phrase.lang = choisie?.lang || codeLangue
  if (choisie) phrase.voice = choisie
  phrase.rate = 0.85
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(phrase)
  return true
}
