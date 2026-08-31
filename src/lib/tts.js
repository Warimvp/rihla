// Prononciation gratuite et hors-ligne : la synthèse vocale du système
// (Web Speech API). Les voix varient selon l'appareil — on dégrade en silence.

export const peutParler = () =>
  typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window

export function parler(texte, codeLangue) {
  if (!peutParler()) return false
  const phrase = new SpeechSynthesisUtterance(texte.replace(/[…?¿？]/g, ' '))
  phrase.lang = codeLangue
  phrase.rate = 0.85
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(phrase)
  return true
}
