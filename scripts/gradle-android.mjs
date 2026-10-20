// Lance Gradle sur le projet Android de Rihla, avec le bon Java et le bon SDK.
//
//   node scripts/gradle-android.mjs assembleDebug
//   node scripts/gradle-android.mjs bundleRelease assembleRelease   (via `pnpm android:release`)
//
// Pourquoi un script : Capacitor 8 exige Java 21 et le SDK Android 36, et ni le
// profil du shell ni `/usr/libexec/java_home` ne les connaissent sur cette
// machine. On ne touche à AUCUNE configuration globale (profil, ~/.gradle) : on
// cherche ce qui est installé, on le passe à CE processus, et on le dit.
//
// Ordre de recherche :
//   JAVA_HOME    : la variable si elle pointe un Java 21, sinon ~/.local/jdk-21*
//   ANDROID_HOME : la variable, sinon ANDROID_SDK_ROOT, sinon ~/Library/Android/sdk
//
// `--max-workers=4` : la machine fait tourner d'autres builds et un émulateur ;
// la mémoire de la JVM est bornée dans android/gradle.properties.
import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'

const RACINE = resolve(import.meta.dirname, '..')
const taches = process.argv.slice(2)
if (taches.length === 0) {
  console.error('Usage : node scripts/gradle-android.mjs <tâche Gradle>… (ex. assembleDebug)')
  process.exit(2)
}

function versionJava(home) {
  const java = join(home, 'bin', 'java')
  if (!existsSync(java)) return null
  const r = spawnSync(java, ['-version'], { encoding: 'utf8' })
  const m = /version "(\d+)/.exec(`${r.stderr}${r.stdout}`)
  return m ? Number(m[1]) : null
}

function trouverJava() {
  const candidats = []
  if (process.env.JAVA_HOME) candidats.push(process.env.JAVA_HOME)
  const local = join(homedir(), '.local')
  if (existsSync(local)) {
    for (const nom of readdirSync(local).filter((n) => n.startsWith('jdk-21')).sort().reverse()) {
      candidats.push(join(local, nom, 'Contents', 'Home'), join(local, nom))
    }
  }
  return candidats.find((c) => versionJava(c) === 21) ?? null
}

function trouverSdk() {
  const candidats = [process.env.ANDROID_HOME, process.env.ANDROID_SDK_ROOT, join(homedir(), 'Library', 'Android', 'sdk')]
  return candidats.find((c) => c && existsSync(join(c, 'platforms'))) ?? null
}

const javaHome = trouverJava()
const sdk = trouverSdk()
if (!javaHome) {
  console.error("✗ Aucun Java 21 trouvé (JAVA_HOME, ~/.local/jdk-21*). Capacitor 8 l'exige : voir docs/google-play.md § 1.")
  process.exit(2)
}
if (!sdk) {
  console.error('✗ SDK Android introuvable (ANDROID_HOME, ~/Library/Android/sdk) : voir docs/google-play.md § 1.')
  process.exit(2)
}
if (!existsSync(join(sdk, 'platforms', 'android-36'))) {
  console.error(`✗ ${sdk} n'a pas platforms;android-36 (compileSdk 36, exigé par Google Play depuis le 31/08/2026).`)
  process.exit(2)
}

console.log(`Java : ${javaHome}\nSDK  : ${sdk}\n`)
const r = spawnSync('./gradlew', [...taches, '--max-workers=4'], {
  cwd: join(RACINE, 'android'),
  stdio: 'inherit',
  env: { ...process.env, JAVA_HOME: javaHome, ANDROID_HOME: sdk },
})
process.exit(r.status ?? 1)
