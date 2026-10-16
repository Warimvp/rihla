// Ouvre l'app (vite dev, port 5183) dans un iPhone virtuel, interface arabe, mouvement réduit.
import { chromium } from 'playwright-core'
import { ajouterAuCarnet } from '../../src/lib/carnet.js'
import { LANGUES } from '../../src/data/langues.js'
import { progresInitial, jourLocal } from '../../src/lib/progression.js'

export const URL_APP = process.env.RIHLA_URL ?? 'http://127.0.0.1:5183/'
export const CHROMIUM = process.env.RIHLA_CHROMIUM ?? '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell'

// Voyage de la pub : une série de 1 jour, deux étapes japonaises validées (« À table » reste à suivre),
// 16 mots au carnet — ce que montre l'accueil des vidéos d'origine.
const ilYA = (n) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return jourLocal(d)
}

export const progresDePub = () => {
  const jour = jourLocal()
  let p = { ...progresInitial(), xp: 160, serie: { compte: 1, dernierJour: jour }, objectifJour: 20 }
  const ja = LANGUES.find((l) => l.id === 'ja')
  for (const lecon of ja.lecons.slice(0, 2)) {
    p.etapes[`ja:${lecon.id}`] = { score: 8, total: 8, valide: true, jour }
    // Entrés il y a 4 jours : dus aujourd'hui (« 16 mots à réviser »), comme sur l'accueil de la vidéo d'origine.
    p = ajouterAuCarnet(p, 'ja', lecon.mots, ilYA(4), {})
  }
  p.parcours = { ja: 2 / ja.lecons.length }
  return p
}

export async function lancer() {
  return chromium.launch({ executablePath: CHROMIUM, args: ['--no-sandbox', '--force-color-profile=srgb'] })
}

// `valeurs` : clés localStorage à poser AVANT le premier rendu.
// Zone de sécurité d'un iPhone à île dynamique : l'app la lit par env(safe-area-inset-*), exactement comme sur le vrai téléphone.
export const SECURITE = { top: 54, bottom: 34, left: 0, right: 0 }

export async function ouvrir(navigateur, { valeurs = {}, largeur = 390, hauteur = 844, echelle = 3, graine = 1 } = {}) {
  const contexte = await navigateur.newContext({
    viewport: { width: largeur, height: hauteur },
    deviceScaleFactor: echelle,
    isMobile: true,
    hasTouch: true,
    locale: 'ar',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  })
  await contexte.addInitScript(({ v, graine }) => {
    for (const [k, val] of Object.entries(v)) localStorage.setItem(k, typeof val === 'string' ? val : JSON.stringify(val))
    // Tirage reproductible : mêmes questions, mêmes options, à chaque capture.
    let a = graine >>> 0
    Math.random = () => {
      a = (a + 0x6d2b79f5) >>> 0
      let t = a
      t = Math.imul(t ^ (t >>> 15), t | 1)
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
    // Des voix pour toutes les destinations : sans elles l'app masque l'écoute (et l'exercice « écouter »).
    const voix = ['ja-JP', 'en-GB', 'es-ES', 'it-IT', 'tr-TR', 'ar-SA', 'hi-IN', 'fr-FR', 'de-DE', 'ru-RU', 'fa-IR', 'sw-KE', 'zh-CN', 'ko-KR', 'pt-PT'].map(
      (lang) => ({ lang, name: `Voix ${lang}`, default: false, localService: true, voiceURI: lang })
    )
    // Un énoncé factice (sans l'API native, qui refuserait ces fausses voix) : on retient seulement ce qui est dit.
    window.SpeechSynthesisUtterance = class {
      constructor(texte) {
        this.text = texte
      }
    }
    const synth = window.speechSynthesis
    if (synth) {
      synth.getVoices = () => voix
      synth.speak = (u) => {
        window.__dit = u?.text
        setTimeout(() => u && typeof u.onend === 'function' && u.onend({}), 30)
      }
      synth.cancel = () => {}
    }
  }, { v: valeurs, graine })
  const page = await contexte.newPage()
  const cdp = await contexte.newCDPSession(page)
  await cdp.send('Emulation.setSafeAreaInsetsOverride', { insets: SECURITE }).catch((e) => console.warn('zone de sécurité indisponible :', e.message))
  page.on('pageerror', (e) => console.error('[page]', e.message))
  await page.goto(URL_APP, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  return { contexte, page }
}
