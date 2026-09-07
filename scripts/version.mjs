#!/usr/bin/env node
// Numéros de version iOS. Apple refuse un build déjà téléversé (ITMS-4238) :
// ce script incrémente CURRENT_PROJECT_VERSION dans les DEUX configurations
// (Debug + Release) — elles doivent rester identiques.
import { readFileSync, writeFileSync } from 'node:fs'

const PBX = 'ios/App/App.xcodeproj/project.pbxproj'
const lire = () => readFileSync(PBX, 'utf8')

const valeurs = (texte, cle) => [
  ...new Set([...texte.matchAll(new RegExp(`${cle} = ([^;]+);`, 'g'))].map((m) => m[1].trim())),
]

const remplacer = (texte, cle, valeur) =>
  texte.replace(new RegExp(`${cle} = [^;]+;`, 'g'), `${cle} = ${valeur};`)

const [commande, argument] = process.argv.slice(2)
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
} else {
  console.log(`Version ${versionsActuelles[0]} (build ${buildsActuels[0]})`)
  console.log('Usage : node scripts/version.mjs build   |   node scripts/version.mjs app 1.1')
}
