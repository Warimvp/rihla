#!/usr/bin/env node
// Numéros de version iOS ET Android. Apple refuse un build déjà téléversé (ITMS-4238) :
// ce script incrémente CURRENT_PROJECT_VERSION dans les DEUX configurations
// (Debug + Release) — elles doivent rester identiques.
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

const PBX = 'ios/App/App.xcodeproj/project.pbxproj'
// Android : UNE source, lue par android/app/build.gradle. versionName = la version affichée (la MÊME que
// MARKETING_VERSION), versionCode = un entier qui ne fait que monter (Google Play refuse un envoi
// dont le versionCode n'est pas strictement plus grand que tous les précédents).
const ANDROID = 'android/version.properties'
const lireAndroid = () => {
  const t = readFileSync(ANDROID, 'utf8')
  const v = /^versionName=(.+)$/m.exec(t)?.[1]?.trim()
  const c = Number(/^versionCode=(\d+)$/m.exec(t)?.[1])
  if (!v || !Number.isInteger(c) || c < 1) throw new Error(`${ANDROID} illisible (versionName=${v}, versionCode=${c})`)
  return { texte: t, nom: v, code: c }
}
const ecrireAndroid = (a, nom, code) =>
  writeFileSync(ANDROID, a.texte.replace(/^versionName=.+$/m, `versionName=${nom}`).replace(/^versionCode=\d+$/m, `versionCode=${code}`))
const lire = () => readFileSync(PBX, 'utf8')

const valeurs = (texte, cle) => [
  ...new Set([...texte.matchAll(new RegExp(`${cle} = ([^;]+);`, 'g'))].map((m) => m[1].trim())),
]

const remplacer = (texte, cle, valeur) =>
  texte.replace(new RegExp(`${cle} = [^;]+;`, 'g'), `${cle} = ${valeur};`)

const [commande, argument] = process.argv.slice(2)

if (commande === 'android') {
  const a = lireAndroid()
  if (argument !== undefined && !/^\d+(\.\d+){1,2}$/.test(argument)) {
    console.error('Usage : pnpm version:android [1.2]   (sans argument : versionCode + 1 ; avec : change aussi versionName)')
    process.exit(1)
  }
  const nom = argument ?? a.nom
  ecrireAndroid(a, nom, a.code + 1)
  console.log(`Android — versionCode ${a.code} → ${a.code + 1}  ·  versionName ${a.nom}${nom === a.nom ? '' : ` → ${nom}`}`)
  process.exit(0)
}

let texte = lire()

const buildsActuels = valeurs(texte, 'CURRENT_PROJECT_VERSION')
const versionsActuelles = valeurs(texte, 'MARKETING_VERSION')
if (buildsActuels.length !== 1 || versionsActuelles.length !== 1) {
  console.error(
    `Configurations désaccordées — build: ${buildsActuels.join('/')} · version: ${versionsActuelles.join('/')}`
  )
  process.exit(1)
}

if (commande === 'build') {
  const suivant = Number(buildsActuels[0]) + 1
  if (!Number.isFinite(suivant)) {
    console.error(`Build illisible : « ${buildsActuels[0] } »`)
    process.exit(1)
  }
  writeFileSync(PBX, remplacer(texte, 'CURRENT_PROJECT_VERSION', suivant))
  console.log(`Build ${buildsActuels[0]} → ${suivant}  (version ${versionsActuelles[0]})`)
} else if (commande === 'app') {
  if (!/^\d+(\.\d+){0,2}$/.test(argument ?? '')) {
    console.error('Usage : pnpm version:app 1.1   (chiffres et points, ex. 1.1 ou 1.2.3)')
    process.exit(1)
  }
  const suivant = Number(buildsActuels[0]) + 1
  texte = remplacer(texte, 'MARKETING_VERSION', argument)
  writeFileSync(PBX, remplacer(texte, 'CURRENT_PROJECT_VERSION', suivant))
  console.log(`Version ${versionsActuelles[0]} → ${argument}  ·  build ${buildsActuels[0]} → ${suivant}`)
  // La version affichée est la même sur Android : on la change aussi, et le versionCode monte.
  if (existsSync(ANDROID)) {
    const a = lireAndroid()
    ecrireAndroid(a, argument, a.code + 1)
    console.log(`Android — versionName ${a.nom} → ${argument}  ·  versionCode ${a.code} → ${a.code + 1}`)
  }
} else {
  console.log(`Version ${versionsActuelles[0]} (build ${buildsActuels[0]})`)
  console.log('Usage : node scripts/version.mjs build   |   node scripts/version.mjs app 1.1   |   node scripts/version.mjs android')
}
