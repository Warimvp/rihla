// Fabrique les photos des villes : src/assets/photos/<id>.webp
//
//   node scripts/photos.mjs            # toutes les photos créditées
//   node scripts/photos.mjs es fr      # seulement celles-là
//
// Pour chaque crédit de src/data/credits-photos.js : télécharge la vignette
// 1280 px du fichier sur Wikimedia Commons, la recadre au format du paysage
// (320:150) autour de son `cadrage`, la réduit à 720×338 et l'écrit en WebP.
// Les originaux ne sont pas gardés dans le dépôt : ce script les retrouve.
// Pour régler un cadrage sans retélécharger à chaque essai, garder les
// originaux le temps du réglage : RIHLA_ORIGINAUX=/un/dossier node scripts/photos.mjs
//
// ⚠️ Ce script TÉLÉCHARGE des fichiers. Il exige `cwebp` et `sips` (macOS).
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { CREDITS } from '../src/data/credits-photos.js'

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SORTIE = join(RACINE, 'src/assets/photos')
const LARGEUR = 720
const HAUTEUR = 338
const QUALITE = 70
const SOURCE = 1280
// Wikimedia demande un User-Agent qui dise qui l'on est.
const AGENT = { 'user-agent': 'rihla-photos/1.0 (https://github.com/Warimvp/rihla)' }

const urlVignette = (fichier) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fichier)}?width=${SOURCE}`

const dimensions = (chemin) => {
  const texte = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', chemin], { encoding: 'utf8' })
  return { l: Number(texte.match(/pixelWidth: (\d+)/)[1]), h: Number(texte.match(/pixelHeight: (\d+)/)[1]) }
}

// Le plus grand rectangle au bon format, glissé vers le point de cadrage.
export function recadrage({ l, h }, cadrage = '50% 50%') {
  const [cx, cy] = cadrage.split(/\s+/).map((v) => Number.parseFloat(v) / 100)
  const format = LARGEUR / HAUTEUR
  const largeur = l / h > format ? Math.round(h * format) : l
  const hauteur = l / h > format ? h : Math.round(l / format)
  return { x: Math.round((l - largeur) * cx), y: Math.round((h - hauteur) * cy), largeur, hauteur }
}

async function telecharger(id, credit, original) {
  const reponse = await fetch(urlVignette(credit.fichier), { headers: AGENT })
  if (!reponse.ok) throw new Error(`${id} : HTTP ${reponse.status} pour ${credit.fichier}`)
  const type = reponse.headers.get('content-type') ?? ''
  if (!type.startsWith('image/jpeg')) throw new Error(`${id} : ${type} reçu, image/jpeg attendu`)
  writeFileSync(original, Buffer.from(await reponse.arrayBuffer()))
  // Un fichier à la fois, sans presser le serveur.
  await new Promise((r) => setTimeout(r, 1500))
}

async function fabriquer(id, credit, atelier) {
  const original = join(atelier, `${id}.jpg`)
  if (!existsSync(original)) await telecharger(id, credit, original)
  const cadre = recadrage(dimensions(original), credit.cadrage)
  const sortie = join(SORTIE, `${id}.webp`)
  execFileSync('cwebp', [
    '-quiet', '-q', String(QUALITE), '-m', '6', '-sharp_yuv',
    '-crop', String(cadre.x), String(cadre.y), String(cadre.largeur), String(cadre.hauteur),
    '-resize', String(LARGEUR), String(HAUTEUR),
    '-metadata', 'none',
    original, '-o', sortie,
  ])
  return { id, octets: statSync(sortie).size, source: statSync(original).size }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const voulues = process.argv.slice(2)
  const ids = Object.keys(CREDITS).filter((id) => !voulues.length || voulues.includes(id))
  mkdirSync(SORTIE, { recursive: true })
  const garde = process.env.RIHLA_ORIGINAUX
  const atelier = garde ? resolve(garde) : mkdtempSync(join(tmpdir(), 'rihla-photos-'))
  mkdirSync(atelier, { recursive: true })
  let total = 0
  try {
    for (const id of ids) {
      const { octets, source } = await fabriquer(id, CREDITS[id], atelier)
      total += octets
      console.log(`${id}  ${String(Math.round(source / 1024)).padStart(4)} Ko  →  ${String(Math.round(octets / 1024)).padStart(3)} Ko   ${CREDITS[id].fichier}`)
    }
  } finally {
    if (!garde) rmSync(atelier, { recursive: true, force: true })
  }
  console.log(`${ids.length} photos · ${Math.round(total / 1024)} Ko`)
}
