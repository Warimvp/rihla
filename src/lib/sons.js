// Retours sonores et haptiques, synthétisés en WebAudio — aucun fichier
// audio, donc rien à télécharger et tout marche hors-ligne. Toujours
// déclenchés par un geste utilisateur (les clics de réponse), ce qui
// satisfait les règles d'autoplay. Coupables dans les Réglages.

let contexte = null

const audio = () => {
  const Ctor = window.AudioContext ?? window.webkitAudioContext
  if (!Ctor) return null
  contexte ??= new Ctor()
  if (contexte.state === 'suspended') contexte.resume()
  return contexte
}

export const sonsActifs = () => {
  try {
    return (localStorage.getItem('rihla.sons') ?? 'oui') === 'oui'
  } catch {
    return true
  }
}

export const reglerSons = (actifs) => {
  try {
    localStorage.setItem('rihla.sons', actifs ? 'oui' : 'non')
  } catch {
    /* stockage indisponible : tant pis */
  }
}

function note(ctx, { f, t, d, type = 'triangle', vol = 0.11 }) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  const debut = ctx.currentTime + t
  osc.type = type
  osc.frequency.setValueAtTime(f, debut)
  gain.gain.setValueAtTime(0.0001, debut)
  gain.gain.linearRampToValueAtTime(vol, debut + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, debut + d)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(debut)
  osc.stop(debut + d + 0.02)
}

const MOTIFS = {
  bonne: [
    { f: 660, t: 0, d: 0.1 },
    { f: 880, t: 0.09, d: 0.16 },
  ],
  mauvaise: [{ f: 210, t: 0, d: 0.2, type: 'sawtooth', vol: 0.07 }],
  fanfare: [
    { f: 523, t: 0, d: 0.12 },
    { f: 659, t: 0.11, d: 0.12 },
    { f: 784, t: 0.22, d: 0.12 },
    { f: 1047, t: 0.33, d: 0.3 },
  ],
}

export function jouer(nom) {
  if (!sonsActifs()) return
  try {
    const ctx = audio()
    if (!ctx) return
    for (const n of MOTIFS[nom] ?? []) note(ctx, n)
  } catch {
    /* l'audio ne doit jamais casser le jeu */
  }
}

export function vibrer(motif) {
  if (!sonsActifs()) return
  try {
    navigator.vibrate?.(motif)
  } catch {
    /* idem */
  }
}

// Le retour standard d'une réponse, partagé par leçons, jeux et révisions.
export function retourReponse(bonne) {
  jouer(bonne ? 'bonne' : 'mauvaise')
  vibrer(bonne ? 20 : 65)
}

export function fanfare() {
  jouer('fanfare')
  vibrer([30, 40, 30])
}
