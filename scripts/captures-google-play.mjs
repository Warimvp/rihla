// Produit les captures BRUTES de la fiche Google Play, en français et en arabe, dans la VRAIE WebView
// d'Android : ce que le téléphone affiche — barres système, polices, arabe de droite à gauche.
//
//   pnpm android:debug                       (l'APK de débogage : sa WebView accepte DevTools)
//   émulateur DÉDIÉ démarré (rihla_pixel)    ANDROID_SERIAL=emulator-5562 si besoin de le nommer
//   node scripts/captures-google-play.mjs    → captures/google-play/brut/<langue>/N-nom.png (1080 × 2400)
//   node scripts/presentation-google-play.mjs  (ensuite : cadre, légende, 1080 × 2160, sans alpha)
//
// Les écrans viennent d'un VOYAGE DE DÉMONSTRATION semé dans le localStorage avec les fonctions de
// l'application elle-même (enregistrerEtape, figerAvancements, ajouterAuCarnet) : aucune donnée réelle,
// et une progression cohérente (série de 6 jours, Grenade terminée et visa décroché, Lisbonne entamée).
//
// On PILOTE la WebView par le protocole DevTools (ouvert dans les builds de débogage) avec un client
// minimal : Playwright refuse (`connectOverCDP` : la WebView n'a pas de contextes de navigateur).
//
// Ne JAMAIS forcer `adb shell wm size` : la WebView 133 de l'AVD dessine alors des cartes coupées ou
// dupliquées (mesuré sur Ostad, 11/10/2026). On capture au natif, et c'est presentation-google-play.mjs
// qui compose le format exigé par Google Play (côté long ≤ 2 × côté court).
import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { LANGUES } from '../src/data/langues.js'
import { ajouterAuCarnet } from '../src/lib/carnet.js'
import { attribuerXpDuJour, enregistrerEtape, figerAvancements, jourLocal, progresInitial } from '../src/lib/progression.js'

const RACINE = resolve(import.meta.dirname, '..')
const SORTIE = join(RACINE, 'captures/google-play/brut')
const ID = 'ma.rihla.app'
const PORT_CDP = 9333
const NATIF = { largeur: 1080, hauteur: 2400 }

const ADB = join(process.env.ANDROID_HOME ?? join(process.env.HOME, 'Library/Android/sdk'), 'platform-tools/adb')
// TOUJOURS un appareil nommé : d'autres sessions ont leurs émulateurs, `adb` nu est ambigu (et dangereux).
const SERIE = ['-s', process.env.ANDROID_SERIAL ?? 'emulator-5562']
const adb = (...args) => execFileSync(ADB, [...SERIE, ...args], { encoding: 'utf8' }).trim()
const adbBinaire = (...args) => execFileSync(ADB, [...SERIE, ...args], { maxBuffer: 64 << 20 })
const dormir = (s) => execFileSync('/bin/sleep', [String(s)])

// ————— Le voyage de démonstration —————
const jour = (avant) => {
  const d = new Date()
  d.setDate(d.getDate() - avant)
  return jourLocal(d)
}

function voyage() {
  const [grenade, lisbonne] = LANGUES
  let p = progresInitial()
  const jouer = (langue, i, quand, score = 8) => {
    const bilan = enregistrerEtape(p, langue.id, langue.lecons[i].id, score, 8, quand)
    p = attribuerXpDuJour(p, bilan.progres, quand)
  }
  // Grenade en entier : 4 étapes par jour pendant 6 jours (une série de 6 jours, finie hier).
  for (let i = 0; i < grenade.lecons.length; i++) jouer(grenade, i, jour(6 - Math.floor(i / 4)), i % 5 === 4 ? 7 : 8)
  // Lisbonne entamée : 5 étapes, la sixième est « À suivre ».
  for (let i = 0; i < 5; i++) jouer(lisbonne, i, jour(1))
  p = figerAvancements(p, LANGUES, jour(1))
  // Quelques mots au carnet, à réviser.
  p = ajouterAuCarnet(p, grenade.id, grenade.lecons[0].mots, jour(3))
  p = ajouterAuCarnet(p, lisbonne.id, lisbonne.lecons[0].mots, jour(3))
  return { progres: p, destination: lisbonne.id }
}

// ————— DevTools —————
async function ouvrirPage(port) {
  const liste = await (await fetch(`http://127.0.0.1:${port}/json`)).json()
  const cible = liste.find((p) => p.type === 'page')
  if (!cible) throw new Error(`aucune page dans la WebView : ${JSON.stringify(liste)}`)
  const ws = new WebSocket(cible.webSocketDebuggerUrl)
  await new Promise((ok, ko) => {
    ws.onopen = ok
    ws.onerror = () => ko(new Error('connexion DevTools refusée'))
  })
  let n = 0
  const attente = new Map()
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data)
    if (m.id !== undefined && attente.has(m.id)) {
      const { ok, ko } = attente.get(m.id)
      attente.delete(m.id)
      if (m.error) ko(new Error(m.error.message))
      else ok(m.result)
    }
  }
  const envoyer = (method, params = {}) =>
    new Promise((ok, ko) => {
      const id = ++n
      attente.set(id, { ok, ko })
      ws.send(JSON.stringify({ id, method, params }))
    })
  const evaluer = async (expression) => {
    try {
      const r = await envoyer('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
      return r.result?.value
    } catch {
      return undefined // la page se recharge
    }
  }
  return { evaluer, fermer: () => ws.close() }
}

async function attendre(page, expression, quoi, delai = 25000) {
  const fin = Date.now() + delai
  while (Date.now() < fin) {
    if ((await page.evaluer(expression)) === true) return
    dormir(0.5)
  }
  throw new Error(`délai dépassé : ${quoi}`)
}

/** Relance l'application, ouvre DevTools, rend la page. */
async function lancer() {
  adb('shell', 'am', 'force-stop', ID)
  adb('shell', 'am', 'start', '-n', `${ID}/.MainActivity`)
  let pid = ''
  for (let i = 0; i < 30 && !pid; i++) {
    dormir(1)
    pid = adb('shell', 'pidof', ID)
  }
  if (!pid) throw new Error("l'application ne démarre pas")
  let prise = ''
  for (let i = 0; i < 30 && !prise; i++) {
    dormir(1)
    prise = (adb('shell', 'cat', '/proc/net/unix').match(/webview_devtools_remote_\d+/) ?? [''])[0]
  }
  if (!prise) throw new Error('socket DevTools introuvable : est-ce bien le build de débogage ?')
  try {
    execFileSync(ADB, [...SERIE, 'forward', '--remove', `tcp:${PORT_CDP}`], { stdio: 'ignore' })
  } catch {
    /* pas de redirection à retirer */
  }
  execFileSync(ADB, [...SERIE, 'forward', `tcp:${PORT_CDP}`, `localabstract:${prise}`])
  // Le socket existe avant que la WebView ne réponde : on réessaie (ECONNRESET tant qu'elle n'est pas prête).
  let derniere
  for (let i = 0; i < 30; i++) {
    try {
      return await ouvrirPage(PORT_CDP)
    } catch (e) {
      derniere = e
      dormir(1)
    }
  }
  throw new Error(`DevTools ne répond pas : ${derniere?.message ?? derniere}`)
}

/** Recharge la page EN PLACE (même processus, même cible DevTools) et laisse le temps de repartir. */
async function recharger(page) {
  await page.evaluer('location.reload()')
  dormir(4)
}

const cliquer = (selecteur, ordre = 0) =>
  `(() => { const e = document.querySelectorAll(${JSON.stringify(selecteur)})[${ordre}]; if (!e) return false; e.click(); return true })()`

function capturer(langue, nom) {
  const png = adbBinaire('exec-out', 'screencap', '-p')
  const dossier = join(SORTIE, langue)
  mkdirSync(dossier, { recursive: true })
  writeFileSync(join(dossier, `${nom}.png`), png)
  console.log(`  ✓ ${langue}/${nom}.png (${(png.length / 1024).toFixed(0)} Ko)`)
}

// ————— Les écrans —————
const { progres, destination } = voyage()
const LANGUES_FICHE = (process.env.LANGUES ?? 'fr,ar').split(',')

// Une barre d'état propre : 10:00, batterie pleine, réseau plein, aucune notification.
adb('shell', 'settings', 'put', 'global', 'sysui_demo_allowed', '1')
const demo = (commande, ...extras) => adb('shell', 'am', 'broadcast', '-a', 'com.android.systemui.demo', '-e', 'command', commande, ...extras)
demo('enter')
demo('clock', '-e', 'hhmm', '1000')
demo('battery', '-e', 'level', '100', '-e', 'plugged', 'false')
demo('network', '-e', 'wifi', 'show', '-e', 'level', '4', '-e', 'fully', 'true')
demo('network', '-e', 'mobile', 'show', '-e', 'datatype', 'hide', '-e', 'level', '4', '-e', 'fully', 'true')
demo('notifications', '-e', 'visible', 'false')

try {
  for (const langue of LANGUES_FICHE) {
    console.log(`\n${langue === 'ar' ? 'العربية' : 'Français'}`)
    let page = await lancer()
    await attendre(page, `document.readyState === 'complete'`, 'page chargée')
    // Le voyage et les préférences, puis rechargement pour que l'application les lise.
    await page.evaluer(`(() => {
      localStorage.clear()
      localStorage.setItem('rihla.progres.v1', ${JSON.stringify(JSON.stringify(progres))})
      localStorage.setItem('rihla.cap', 'route')
      localStorage.setItem('rihla.destination', ${JSON.stringify(destination)})
      localStorage.setItem('rihla.bienvenue', 'vu')
      localStorage.setItem('rihla.langue', ${JSON.stringify(langue)})
      localStorage.setItem('rihla.theme', 'clair')
      localStorage.setItem('rihla.nouveautes', 'vu')
      return true
    })()`)
    // On RECHARGE la page, on ne relance pas l'application : le localStorage de la WebView n'est écrit sur
    // disque qu'avec retard, un `force-stop` tout de suite après tue le voyage semé (constaté : l'écran
    // d'une première installation, en français même dans la passe arabe).
    await recharger(page)
    await attendre(page, `!!document.querySelector('.barre-onglets')`, "barre d'onglets (l'écran du cap s'affiche ? le voyage n'est pas lu)")
    const ecran = (s = 4) => dormir(s)

    // 1. Accueil
    ecran(5)
    capturer(langue, '1-accueil')

    // 2. Apprendre : la route de Lisbonne, ses étapes validées et celle « À suivre »
    await page.evaluer(cliquer('.barre-onglets .onglet', 1))
    ecran()
    await page.evaluer(`(() => { const v = document.querySelector('.vue'); if (v) v.scrollTop = ${langue === 'ar' ? 700 : 700}; return true })()`)
    ecran(2)
    capturer(langue, '2-apprendre')

    // 3. Une carte-mot, retournée (le verso a le fond en zellige)
    await page.evaluer(`(() => { const b = document.querySelector('button:has(.chip--a-suivre)'); if (!b) return false; b.click(); return true })()`)
    ecran(5)
    await page.evaluer(cliquer('.bouton--primaire.bouton--pleine'))
    ecran(5)
    capturer(langue, '3-carte-mot')

    // 4. Le quiz
    await page.evaluer(cliquer('.bouton--fantome.bouton--pleine'))
    ecran(5)
    capturer(langue, '4-quiz')

    // 5. Le passeport (page rechargée : pas de confirmation « quitter l'étape »)
    await recharger(page)
    await attendre(page, `!!document.querySelector('.barre-onglets')`, "barre d'onglets")
    await page.evaluer(cliquer('.barre-onglets .onglet', 2))
    ecran(5)
    capturer(langue, '5-passeport')
    page.fermer()
  }
} finally {
  demo('exit')
  execFileSync(ADB, [...SERIE, 'forward', '--remove', `tcp:${PORT_CDP}`], { stdio: 'ignore' })
  adb('shell', 'am', 'force-stop', ID)
}
console.log(`\nCaptures natives (${NATIF.largeur} × ${NATIF.hauteur}) dans ${SORTIE}`)
