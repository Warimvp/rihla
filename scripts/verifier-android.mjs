// Barrière de publication Android : refuse ce qui ne doit pas partir sur Google Play.
//
//   node scripts/verifier-android.mjs synchro    après `cap sync android` (pnpm android:sync)
//   node scripts/verifier-android.mjs livrable   après `bundleRelease assembleRelease` (pnpm android:release)
//
// Deux principes, ceux du dépôt :
//   · on juge le RÉSULTAT (fichiers copiés, manifeste FUSIONNÉ de l'APK, signature), pas l'intention
//     (un fichier de configuration qu'on croit lu) ;
//   · chaque refus a été provoqué une fois (docs/google-play.md § 6) : un contrôle qui ne peut pas
//     échouer ne prouve rien.
import { createHash } from 'node:crypto'
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, relative, resolve } from 'node:path'

const RACINE = resolve(import.meta.dirname, '..')
const ANDROID = join(RACINE, 'android')
const MAIN = join(ANDROID, 'app/src/main')
const PUBLIC = join(MAIN, 'assets/public')
const DIST = join(RACINE, 'dist')
const APK = join(ANDROID, 'app/build/outputs/apk/release/app-release.apk')
const AAB = join(ANDROID, 'app/build/outputs/bundle/release/app-release.aab')
const ID = 'ma.rihla.app'
/** Exigence Google Play : API 36 pour toute application nouvelle ou mise à jour depuis le 31/08/2026. */
const API_MINIMALE = 36

/**
 * Les autorisations que l'application a le droit de déclarer, dans le manifeste FUSIONNÉ. Ajouter une
 * ligne exige de la JUSTIFIER ici, dans le manifeste source et dans docs/google-play.md § 4.
 * ABSENTES et interdites : INTERNET (l'application est 100 % hors ligne : la fiche dit « aucune donnée
 * collectée ») et SCHEDULE_EXACT_ALARM (réservée par Google Play aux applications d'alarme et de calendrier).
 */
const AUTORISATIONS = new Map([
  ['android.permission.POST_NOTIFICATIONS', 'le rappel quotidien (opt-in, demandée à l’activation)'],
  ['android.permission.RECEIVE_BOOT_COMPLETED', 'reprogrammer le rappel après un redémarrage'],
  ['android.permission.WAKE_LOCK', 'réveiller le téléphone le temps d’afficher le rappel'],
  // Ajoutée par androidx.core (≥ 1.9) à toute application : permission de SIGNATURE propre à
  // l'application, invisible de l'utilisateur. Rien n'est demandé à personne.
  [`${ID}.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`, 'androidx.core, signature, interne'],
])
const INTERDITES = ['android.permission.INTERNET', 'android.permission.SCHEDULE_EXACT_ALARM', 'android.permission.USE_EXACT_ALARM']

const etape = process.argv[2] ?? ''
const fautes = []
const lire = (f) => readFileSync(f, 'utf8')
const sansCommentaires = (xml) => xml.replace(/<!--[\s\S]*?-->/g, '')
const refuse = (m) => fautes.push(m)

function arbre(dossier) {
  if (!existsSync(dossier)) return []
  return readdirSync(dossier, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? arbre(join(dossier, e.name)) : [join(dossier, e.name)],
  )
}
const empreinte = (f) => createHash('sha256').update(readFileSync(f)).digest('hex')

/** Dimensions et type de couleur d'un PNG, lus dans son en-tête IHDR (octets 16-25). */
function entetePng(f) {
  const b = readFileSync(f)
  if (b.length < 26 || b.readUInt32BE(0) !== 0x89504e47) return null
  return { largeur: b.readUInt32BE(16), hauteur: b.readUInt32BE(20), couleur: b[25] }
}

/** Version du fichier android/version.properties (la source UNIQUE de build.gradle). */
function versionAndroid() {
  const f = join(ANDROID, 'version.properties')
  if (!existsSync(f)) return refuse('android/version.properties introuvable.')
  const t = lire(f)
  const nom = /^versionName=(.+)$/m.exec(t)?.[1]?.trim()
  const code = Number(/^versionCode=(\d+)$/m.exec(t)?.[1])
  if (!/^\d+\.\d+(\.\d+)?$/.test(nom ?? '')) refuse(`android/version.properties : versionName « ${nom} » illisible (attendu 1.2 ou 1.2.3).`)
  if (!Number.isInteger(code) || code < 1) refuse(`android/version.properties : versionCode « ${code} » illisible (entier ≥ 1).`)
  const pbx = join(RACINE, 'ios/App/App.xcodeproj/project.pbxproj')
  if (existsSync(pbx)) {
    const ios = [...new Set([...lire(pbx).matchAll(/MARKETING_VERSION = ([^;]+);/g)].map((m) => m[1].trim()))]
    if (ios.length === 1 && ios[0] !== nom) {
      refuse(`versionName Android « ${nom} » ≠ MARKETING_VERSION iOS « ${ios[0]} » : la version affichée est la même sur les deux (pnpm version:app).`)
    }
  }
  return { nom, code }
}

function verifierSource() {
  // 1. Le manifeste SOURCE : sauvegarde coupée, pas de HTTP en clair, autorisations retirées.
  const manifeste = sansCommentaires(lire(join(MAIN, 'AndroidManifest.xml')))
  if (!/android:allowBackup="false"/.test(manifeste)) refuse('AndroidManifest.xml : android:allowBackup="false" attendu (« rien ne quitte votre téléphone »).')
  if (!/android:dataExtractionRules="@xml\/data_extraction_rules"/.test(manifeste)) refuse('AndroidManifest.xml : dataExtractionRules attendu (transfert d’appareil à appareil, Android 12+).')
  if (/usesCleartextTraffic="true"/.test(manifeste)) refuse('AndroidManifest.xml : usesCleartextTraffic="true" interdit.')
  for (const p of ['android.permission.INTERNET', 'android.permission.SCHEDULE_EXACT_ALARM']) {
    const retiree = new RegExp(`<uses-permission[^>]*android:name="${p.replace(/\./g, '\\.')}"[^>]*tools:node="remove"`).test(manifeste)
    if (!retiree) refuse(`AndroidManifest.xml : ${p} doit être RETIRÉE (tools:node="remove") — le greffon ou le modèle la pose sinon.`)
  }
  for (const m of manifeste.matchAll(/<uses-permission[^>]*android:name="([^"]+)"[^>]*\/?>/g)) {
    if (!/tools:node="remove"/.test(m[0]) && !AUTORISATIONS.has(m[1])) refuse(`AndroidManifest.xml : autorisation ${m[1]} non justifiée (scripts/verifier-android.mjs).`)
  }

  // 2. Aucun serveur embarqué : l'application est hors ligne (docs/app-store.md § 13.5, § 12).
  const dossier = existsSync(PUBLIC) ? arbre(PUBLIC) : []
  if (dossier.length === 0) refuse('android/app/src/main/assets/public est vide : lancer pnpm android:sync (cap sync android).')
  for (const f of dossier.filter((x) => /\.(js|html|json|webmanifest|css)$/.test(x))) {
    const t = lire(f)
    if (/workers\.dev|rihla-serveur/.test(t)) refuse(`${relative(RACINE, f)} embarque l'adresse du serveur de duels : le jeu en ligne n'entre pas dans cette build (docs/app-store.md § 12). Retirer VITE_RIHLA_SERVEUR de .env et relancer.`)
  }

  // 3. C'est BIEN ce dist/ qui est parti dans le projet natif.
  if (!existsSync(DIST)) refuse('dist/ introuvable : pnpm build.')
  else {
    const attendus = new Map(arbre(DIST).map((f) => [relative(DIST, f), empreinte(f)]))
    const copies = new Map(dossier.map((f) => [relative(PUBLIC, f), empreinte(f)]))
    for (const [nom, h] of attendus) {
      if (!copies.has(nom)) refuse(`assets/public ne contient pas ${nom} (dist/ plus récent que la synchro ?).`)
      else if (copies.get(nom) !== h) refuse(`assets/public/${nom} diffère de dist/${nom} : relancer pnpm android:sync.`)
    }
    // `cap sync` ajoute lui-même ces deux fichiers (pont Cordova) : ils ne viennent pas de dist/.
    const AJOUTS_DE_CAPACITOR = new Set(['cordova.js', 'cordova_plugins.js'])
    for (const nom of copies.keys()) {
      if (!attendus.has(nom) && !AJOUTS_DE_CAPACITOR.has(nom)) refuse(`assets/public/${nom} n'existe pas dans dist/ : reste d'une ancienne synchro.`)
    }
  }

  // 4. La configuration Capacitor embarquée : aucune adresse de serveur de développement.
  const cfg = join(MAIN, 'assets/capacitor.config.json')
  if (existsSync(cfg)) {
    const c = JSON.parse(lire(cfg))
    if (c.appId !== ID) refuse(`capacitor.config.json : appId « ${c.appId} » ≠ ${ID}.`)
    if (c.server?.url) refuse(`capacitor.config.json : server.url (${c.server.url}) chargerait un site distant au lieu des fichiers embarqués.`)
  } else refuse('assets/capacitor.config.json introuvable : pnpm android:sync.')

  // 5. Versions et images.
  versionAndroid()
  const RES = join(MAIN, 'res')
  const DENS = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 }
  for (const [d, f] of Object.entries(DENS)) {
    // [fichier, côté en px, canal alpha exigé ?] — l'avant-plan adaptatif, l'icône ronde et l'icône de
    // lancement sont TRANSPARENTS autour du dessin ; l'icône héritée carrée est pleine.
    const attendues = [
      [`mipmap-${d}/ic_launcher_foreground.png`, 108 * f, true],
      [`mipmap-${d}/ic_launcher.png`, 48 * f, false],
      [`mipmap-${d}/ic_launcher_round.png`, 48 * f, true],
      [`drawable-${d}/lancement.png`, 288 * f, true],
    ]
    for (const [nom, px, alpha] of attendues) {
      const f2 = join(RES, nom)
      const h = existsSync(f2) ? entetePng(f2) : null
      if (!h) refuse(`res/${nom} manquant ou illisible : pnpm android:icones.`)
      else if (h.largeur !== Math.round(px) || h.hauteur !== Math.round(px)) refuse(`res/${nom} : ${h.largeur}×${h.hauteur}, attendu ${Math.round(px)}×${Math.round(px)}.`)
      else if (alpha && h.couleur !== 6) refuse(`res/${nom} : PNG sans canal alpha (type ${h.couleur}).`)
    }
  }
  const play = entetePng(join(MAIN, 'ic_launcher-playstore.png') )
  if (!play || play.largeur !== 512 || play.hauteur !== 512) refuse('ic_launcher-playstore.png : 512 × 512 attendu (icône de la fiche Google Play).')
  else if (play.couleur !== 6) refuse('ic_launcher-playstore.png : Google écrit « PNG 32 bits (avec alpha) » — canal alpha absent.')
}

/** Un outil des `build-tools` du SDK (le plus récent qui l'a) : aapt2 (manifeste fusionné), apksigner. */
function outilSdk(nom) {
  const sdk = [process.env.ANDROID_HOME, process.env.ANDROID_SDK_ROOT, join(homedir(), 'Library/Android/sdk')].find((c) => c && existsSync(join(c, 'build-tools')))
  if (!sdk) return null
  const versions = readdirSync(join(sdk, 'build-tools')).sort((a, b) => a.localeCompare(b, 'en', { numeric: true })).reverse()
  const v = versions.find((x) => existsSync(join(sdk, 'build-tools', x, nom)))
  return v ? join(sdk, 'build-tools', v, nom) : null
}
const aapt2 = () => outilSdk('aapt2')
const apksigner = () => outilSdk('apksigner')

/** Le Java 21 de scripts/gradle-android.mjs (JAVA_HOME, sinon ~/.local/jdk-21*) : racine du JDK, ou null. */
function java21() {
  const candidats = []
  if (process.env.JAVA_HOME) candidats.push(process.env.JAVA_HOME)
  const local = join(homedir(), '.local')
  if (existsSync(local)) {
    for (const nom of readdirSync(local).filter((n) => n.startsWith('jdk-21')).sort().reverse()) {
      candidats.push(join(local, nom, 'Contents', 'Home'), join(local, nom))
    }
  }
  return candidats.find((c) => existsSync(join(c, 'bin/jarsigner'))) ?? null
}

function verifierLivrable() {
  // On ne s'arrête que si les artefacts MANQUENT : une faute de la source ne doit pas cacher celles du
  // manifeste fusionné (le greffon peut poser ce que le manifeste source ne montre pas).
  const manquants = [APK, AAB].filter((f) => !existsSync(f))
  for (const f of manquants) refuse(`${relative(RACINE, f)} introuvable : pnpm android:release.`)
  if (manquants.length) return
  const outil = aapt2()
  if (!outil) return refuse('aapt2 introuvable dans le SDK Android (build-tools).')
  const badging = execFileSync(outil, ['dump', 'badging', APK], { encoding: 'utf8' })
  const permissions = [...badging.matchAll(/^uses-permission(?:-sdk-\d+)?: name='([^']+)'/gm)].map((m) => m[1])
  for (const p of permissions) {
    if (INTERDITES.includes(p)) refuse(`Manifeste FUSIONNÉ : ${p} présente — interdite (voir AUTORISATIONS).`)
    else if (!AUTORISATIONS.has(p)) refuse(`Manifeste FUSIONNÉ : autorisation ${p} non justifiée.`)
  }
  for (const p of AUTORISATIONS.keys()) if (!permissions.includes(p)) refuse(`Manifeste FUSIONNÉ : ${p} attendue et absente (le rappel ne marcherait plus).`)
  const cible = Number(/targetSdkVersion:'(\d+)'/.exec(badging)?.[1])
  if (cible < API_MINIMALE) refuse(`targetSdkVersion ${cible} < ${API_MINIMALE} : Google Play refuse les envois sous l'API ${API_MINIMALE}.`)
  if (!new RegExp(`package: name='${ID.replace(/\./g, '\\.')}'`).test(badging)) refuse(`L'APK n'a pas l'identifiant ${ID}.`)
  if (/application-debuggable/.test(badging)) refuse('APK de publication DÉBOGUABLE.')
  const v = versionAndroid()
  const code = Number(/versionCode='(\d+)'/.exec(badging)?.[1])
  const nom = /versionName='([^']+)'/.exec(badging)?.[1]
  if (v?.code && code !== v.code) refuse(`versionCode de l'APK (${code}) ≠ android/version.properties (${v.code}).`)
  if (v?.nom && nom !== v.nom) refuse(`versionName de l'APK (${nom}) ≠ android/version.properties (${v.nom}).`)

  // Aucun code natif : Rihla n'embarque que la WebView du système. Depuis le 01/11/2025, Google Play refuse
  // une mise à jour dont les bibliothèques natives (.so) ne sont pas alignées sur 16 Ko (targetSdk ≥ 35) ;
  // `zipalign -P 16` ne le prouve PAS (il laisse passer une .so alignée à 4 Ko). Un greffon qui en ajoute
  // fait donc échouer ici : vérifier l'alignement ELF (docs/google-play.md § 4), puis l'autoriser.
  const natives = spawnSync('unzip', ['-Z1', APK], { encoding: 'utf8' }).stdout?.split('\n').filter((n) => /\.so$/.test(n)) ?? []
  if (natives.length) refuse(`Bibliothèque(s) native(s) dans l'APK : ${natives.join(', ')} — alignement 16 Ko à vérifier avant d'autoriser (docs/google-play.md § 4).`)

  // Signature : la clé d'importation du propriétaire, jamais celle de débogage.
  const jdk = java21()
  if (!jdk) return refuse('Java 21 introuvable (JAVA_HOME, ~/.local/jdk-21*) : la signature ne peut pas être vérifiée.')
  const env = { ...process.env, JAVA_HOME: jdk }

  // Le BUNDLE (.aab) est ce qu'on envoie à Google Play : signature JAR, vérifiée par jarsigner. Le jarsigner
  // de /usr/bin n'est qu'un raccord macOS qui répond « Unable to locate a Java Runtime » : on prend celui du JDK.
  const rel = relative(RACINE, AAB)
  const js = spawnSync(join(jdk, 'bin/jarsigner'), ['-verify', '-verbose', '-certs', AAB], { encoding: 'utf8', env })
  const sortieAab = `${js.stdout}${js.stderr}`
  if (js.error) refuse(`jarsigner inutilisable : ${js.error.message}`)
  else if (/jar is unsigned/.test(sortieAab)) refuse(`${rel} n'est PAS signé.`)
  else if (!/^jar verified\.?\s*$/m.test(sortieAab)) refuse(`${rel} : signature invalide (${sortieAab.split('\n').find((l) => l.trim()) ?? 'aucune réponse de jarsigner'}).`)
  else if (/jar verified, with signer errors/.test(sortieAab)) refuse(`${rel} : signature avec erreurs.`)
  else if (/CN=Android Debug/.test(sortieAab)) refuse(`${rel} est signé avec la clé de DÉBOGAGE.`)

  // L'APK sert à l'essai sur un appareil : signature par schéma d'APK, vérifiée par apksigner (SDK).
  const signeur = apksigner()
  const relApk = relative(RACINE, APK)
  if (!signeur) return refuse('apksigner introuvable dans le SDK Android (build-tools).')
  const as = spawnSync(signeur, ['verify', '--verbose', '--print-certs', APK], { encoding: 'utf8', env })
  const sortieApk = `${as.stdout}${as.stderr}`
  if (as.error || as.status !== 0 || !/^Verifies$/m.test(sortieApk)) refuse(`${relApk} : signature invalide (${sortieApk.split('\n').find((l) => l.trim()) ?? 'aucune réponse d\'apksigner'}).`)
  else if (/certificate DN: .*CN=Android Debug/.test(sortieApk)) refuse(`${relApk} est signé avec la clé de DÉBOGAGE.`)
}

if (etape === 'synchro') verifierSource()
else if (etape === 'livrable') { verifierSource(); verifierLivrable() }
else {
  console.error('Usage : node scripts/verifier-android.mjs synchro|livrable')
  process.exit(2)
}

if (fautes.length) {
  console.error(`\n✗ Barrière Android (${etape}) : ${fautes.length} refus`)
  for (const f of fautes) console.error(`  · ${f}`)
  process.exit(1)
}
console.log(`✓ Barrière Android (${etape}) : rien à refuser.`)
