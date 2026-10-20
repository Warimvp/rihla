// Produit les images de l'application ANDROID — icône adaptative, icônes « héritées », écran de
// lancement, icône de la fiche Google Play — à partir de la MÊME géométrie que l'icône d'iOS et du
// web : `public/icons/icon.svg` (l'étoile à huit pointes et la boussole, sur le bleu Majorelle).
//
//   node scripts/icones-android.mjs
//
// Pourquoi un script plutôt que des PNG déposés à la main : la machine n'a ni rsvg-convert ni
// ImageMagick ; on rend avec le Chromium de Playwright (déjà en cache pour les captures), et la
// marque ne peut pas dériver entre l'iPhone, Android et le site — une seule source, ce SVG.
//
// Règles d'Android que ce script respecte (developer.android.com, « Adaptive icons ») :
//  - l'icône adaptative est une toile de 108 dp dont seul le centre de 72 dp est toujours visible,
//    et 66 dp « sûrs » (le masque rond du lanceur y rogne les coins). L'étoile y est donc réduite à
//    88 % de sa taille d'icône : ses pointes restent à ~30 dp du centre, sous le rayon de 33 dp ;
//  - le fond est une COULEUR unie (`ic_launcher_background`), l'avant-plan un PNG transparent ;
//  - les icônes héritées (API 24-25, sans masque) sont l'icône entière, carrée et ronde ;
//  - l'icône de la fiche Google Play : 512 × 512, PNG 32 bits avec alpha, sans coins arrondis (Google les met).
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { chromium } from '@playwright/test'

const RACINE = resolve(import.meta.dirname, '..')
const RES = join(RACINE, 'android/app/src/main/res')

const SOURCE = readFileSync(join(RACINE, 'public/icons/icon.svg'), 'utf8')
const FOND = /<rect width="120" height="120" fill="(#[0-9A-Fa-f]{6})"/.exec(SOURCE)?.[1]
if (!FOND) throw new Error('public/icons/icon.svg : fond introuvable (rect 120×120)')

/** L'icône sans son fond : tout ce qui est DESSINÉ (le fond est la première ligne <rect>). */
const ART = SOURCE.replace(/<\/?svg[^>]*>/g, '').replace(/<rect width="120" height="120"[^>]*\/>/, '')

/** Un SVG carré `taille` px : le fond (ou rien), l'art réduit autour du centre, un masque éventuel. */
function svg({ taille, fond = true, echelle = 1, rond = false }) {
  const art = `<g transform="translate(60 60) scale(${echelle}) translate(-60 -60)">${ART}</g>`
  const arriere = fond ? `<rect width="120" height="120" fill="${FOND}"/>` : ''
  const clip = rond ? `<clipPath id="c"><circle cx="60" cy="60" r="60"/></clipPath>` : ''
  const contenu = rond ? `<g clip-path="url(#c)">${arriere}${art}</g>` : `${arriere}${art}`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="${taille}" height="${taille}">${clip}${contenu}</svg>`
}

const DENSITES = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 }
const sorties = []
const planifier = (fichier, parametres) => sorties.push({ fichier, ...parametres })

for (const [densite, f] of Object.entries(DENSITES)) {
  // Icône adaptative : toile 108 dp, art à 88 %, transparent.
  planifier(`${RES}/mipmap-${densite}/ic_launcher_foreground.png`, { taille: 108 * f, fond: false, echelle: 0.88 })
  // Icônes héritées : 48 dp, entière (carrée) ou ronde.
  planifier(`${RES}/mipmap-${densite}/ic_launcher.png`, { taille: 48 * f })
  planifier(`${RES}/mipmap-${densite}/ic_launcher_round.png`, { taille: 48 * f, rond: true })
  // Écran de lancement (Android 12+ et rétroportage) : icône de 288 dp, art transparent ; seul le disque
  // central de 192 dp est visible. Dans la toile de 288 dp, 1 unité du SVG (120) = 2,4 dp : l'étoile
  // (76,4 unités de large) y mesure 183 dp ; à 65 % elle en mesure 119 dp, soit 62 % du disque visible.
  planifier(`${RES}/drawable-${densite}/lancement.png`, { taille: 288 * f, fond: false, echelle: 0.65 })
}

const navigateur = await chromium.launch()
try {
  for (const { fichier, ...p } of sorties) {
    const page = await navigateur.newPage({ viewport: { width: Math.round(p.taille), height: Math.round(p.taille) } })
    await page.setContent(`<html><body style="margin:0;background:transparent">${svg(p)}</body></html>`)
    mkdirSync(dirname(fichier), { recursive: true })
    writeFileSync(fichier, await page.screenshot({ omitBackground: true, type: 'png' }))
    await page.close()
  }
} finally {
  await navigateur.close()
}
// Fiche Google Play : l'icône 512 × 512 de la marque, telle quelle — PNG 32 bits AVEC canal alpha, comme
// l'écrit Google, sans coins arrondis (Google les applique) — copiée, pas redessinée : une seule source.
copyFileSync(join(RACINE, 'public/icons/icon-512.png'), join(RACINE, 'android/app/src/main/ic_launcher-playstore.png'))
console.log(`${sorties.length} images écrites (fond ${FOND}) + l'icône de la fiche Google Play.`)
