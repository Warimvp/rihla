// Compose les VISUELS de la fiche Google Play à partir des captures natives :
//   · les captures « téléphone » : 1080 × 2160, une légende au-dessus d'un téléphone cadré ;
//   · l'image de présentation (« feature graphic ») : 1024 × 500, en français, arabe et anglais.
//
//   node scripts/captures-google-play.mjs        (d'abord : les captures natives de l'émulateur)
//   node scripts/presentation-google-play.mjs    → captures/google-play/<langue>/
//
// Exigences Google Play (support.google.com/googleplay/android-developer/answer/9866151), relues le 20/10/2026 :
//   · captures : PNG ou JPEG 24 bits SANS transparence, côtés entre 320 et 3840 px, le grand côté au plus
//     DEUX fois le petit. Un Pixel natif (1080 × 2400, 2,22:1) serait REFUSÉ : d'où cette composition
//     (jamais `adb shell wm size`, voir captures-google-play.mjs) ;
//   · image de présentation : OBLIGATOIRE, 1024 × 500, JPEG ou PNG 24 bits sans alpha. Google peut rogner
//     les bords ou y poser un bouton de lecture : rien d'important près des bords.
//
// Aux couleurs de la marque (jetons de src/styles.css, bleu Majorelle) et avec SES polices, embarquées dans
// public/polices/ : la même marque que l'icône (scripts/icones-android.mjs) et que l'application. Aucune
// ressource tierce. Les légendes disent ce que fait l'application — ni prix, ni classement, ni promesse.
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { chromium } from '@playwright/test'
import { aUnAlpha, retirerAlpha } from './png-sans-alpha.mjs'

const RACINE = resolve(import.meta.dirname, '..')
const DOSSIER = join(RACINE, 'captures/google-play')
const POLICES = `file://${join(RACINE, 'public/polices/polices.css')}`
const MAJORELLE = '#4e46c8'
const MAJORELLE_FONCE = '#2f2a86'

// Les légendes (arabe : à faire relire par un lecteur natif, comme les autres textes de la fiche).
const LEGENDES = {
  fr: {
    '1-accueil': 'Une étape par jour, une série qui grandit',
    '2-apprendre': 'Des étapes de 8 mots, de ville en ville',
    '3-carte-mot': 'Écoute, retourne la carte, retiens',
    '4-quiz': 'Des questions pour valider chaque étape',
    '5-passeport': 'Un passeport tamponné à chaque visa',
  },
  ar: {
    '1-accueil': 'مرحلة كل يوم، وسلسلة أيام تكبر',
    '2-apprendre': 'مراحل من ٨ كلمات، من مدينة إلى مدينة',
    '3-carte-mot': 'استمع، اقلب البطاقة، واحفظ',
    '4-quiz': 'أسئلة لتثبيت كل مرحلة',
    '5-passeport': 'جواز سفر يُختم مع كل تأشيرة',
  },
}

const PRESENTATION = {
  fr: { dir: 'ltr', titre: 'Rihla', ligne: 'Apprends les langues sur la route d’Ibn Battuta', sous: 'Étapes de 8 mots · hors ligne · sans compte' },
  en: { dir: 'ltr', titre: 'Rihla', ligne: 'Learn languages along Ibn Battuta’s road', sous: '8-word steps · works offline · no account' },
  ar: { dir: 'rtl', titre: 'رحلة', ligne: 'تعلّم اللغات على طريق ابن بطوطة', sous: 'مراحل من ٨ كلمات · بلا اتصال · بلا حساب' },
}

const image = (f) => `data:image/png;base64,${readFileSync(f).toString('base64')}`
const icone = readFileSync(join(RACINE, 'public/icons/icon.svg'), 'utf8').replace(/<\?xml[^>]*>/, '')
const BASE = `
  html, body { margin: 0; overflow: hidden; }
  body { font-family: 'Readex Pro', sans-serif; color: #fff; position: relative; }
  .titre { font-family: 'Young Serif', 'Amiri', serif; font-weight: 400; }
`

/** La capture native SANS la barre d'état (heure et réseau de l'émulateur) ni la barre de gestes. */
const COUPE_HAUT = 132
const COUPE_BAS = 66

async function enregistrer(page, fichier, { largeur, hauteur }) {
  const brut = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: largeur, height: hauteur } })
  const plat = retirerAlpha(brut)
  if (aUnAlpha(plat)) throw new Error(`${fichier} : alpha encore présent`)
  mkdirSync(join(fichier, '..'), { recursive: true })
  writeFileSync(fichier, plat)
  console.log(`  ✓ ${fichier.replace(`${RACINE}/`, '')} (${largeur} × ${hauteur}, ${(plat.length / 1024).toFixed(0)} Ko)`)
}

async function rendre(navigateur, html, taille, fichier) {
  const temporaire = join(tmpdir(), `rihla-visuel-${process.pid}-${Math.random().toString(36).slice(2)}.html`)
  writeFileSync(temporaire, html)
  const page = await navigateur.newPage({ viewport: taille, deviceScaleFactor: 1 })
  try {
    await page.goto(`file://${temporaire}`)
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(300)
    await enregistrer(page, fichier, { largeur: taille.width, hauteur: taille.height })
  } finally {
    await page.close()
    rmSync(temporaire, { force: true })
  }
}

const navigateur = await chromium.launch()
try {
  // ————— Les captures cadrées —————
  for (const [langue, legendes] of Object.entries(LEGENDES)) {
    const rtl = langue === 'ar'
    for (const [nom, legende] of Object.entries(legendes)) {
      const brut = join(DOSSIER, 'brut', langue, `${nom}.png`)
      if (!existsSync(brut)) {
        console.error(`${brut} absente : lancer d'abord node scripts/captures-google-play.mjs`)
        process.exit(2)
      }
      // La capture, rognée EN CSS (haut et bas) dans un cadre arrondi : 900 px de large, 1080 → 900 = × 0,8333.
      const echelle = 900 / 1080
      const hauteurCadre = Math.round((2400 - COUPE_HAUT - COUPE_BAS) * echelle)
      const html = `<!doctype html><html lang="${langue}" dir="${rtl ? 'rtl' : 'ltr'}"><meta charset="utf-8">
        <link rel="stylesheet" href="${POLICES}"><style>${BASE}
          body { width: 1080px; height: 2160px;
            background: radial-gradient(130% 80% at 50% 0%, #5a52d8 0%, ${MAJORELLE} 38%, ${MAJORELLE_FONCE} 100%); }
          .etoile { position: absolute; width: 640px; height: 640px; top: -190px; ${rtl ? 'left' : 'right'}: -170px; opacity: .09; }
          .etoile svg { width: 100%; height: 100%; }
          .legende { position: absolute; top: 118px; left: 90px; right: 90px; height: 210px; display: flex; align-items: center;
            font-size: ${rtl ? 74 : 70}px; line-height: ${rtl ? 1.5 : 1.14}; letter-spacing: ${rtl ? 0 : '-0.01em'}; text-wrap: balance; }
          .cadre { position: absolute; top: 372px; left: 90px; width: 900px; height: ${hauteurCadre}px;
            border-radius: 64px 64px 0 0; background: #14122e; padding: 14px 14px 0; box-sizing: border-box;
            box-shadow: 0 -4px 0 rgba(255,255,255,.14) inset, 0 40px 90px rgba(10, 8, 44, .5); }
          .ecran { width: 100%; height: 100%; border-radius: 52px 52px 0 0; overflow: hidden; position: relative; background: #f7f0e3; }
          .ecran img { position: absolute; left: 0; top: ${-COUPE_HAUT * echelle * (872 / 900)}px; width: 872px; display: block; }
        </style><body>
          <div class="etoile">${icone}</div>
          <div class="legende titre">${legende}</div>
          <div class="cadre"><div class="ecran"><img src="${image(brut)}"></div></div>
        </body></html>`
      await rendre(navigateur, html, { width: 1080, height: 2160 }, join(DOSSIER, langue, `${nom}.png`))
    }
  }

  // ————— L'image de présentation —————
  for (const [langue, t] of Object.entries(PRESENTATION)) {
    const rtl = t.dir === 'rtl'
    const source = join(DOSSIER, 'brut', langue === 'ar' ? 'ar' : 'fr', '1-accueil.png')
    if (!existsSync(source)) {
      console.error(`${source} absente : lancer d'abord node scripts/captures-google-play.mjs`)
      process.exit(2)
    }
    const html = `<!doctype html><html lang="${langue}" dir="${t.dir}"><meta charset="utf-8">
      <link rel="stylesheet" href="${POLICES}"><style>${BASE}
        body { width: 1024px; height: 500px;
          background: radial-gradient(120% 140% at ${rtl ? '100%' : '0%'} 0%, #5a52d8 0%, ${MAJORELLE} 42%, ${MAJORELLE_FONCE} 100%); }
        .texte { position: absolute; top: 0; bottom: 0; inset-inline-start: 72px; width: 560px;
          display: flex; flex-direction: column; justify-content: center; gap: 20px; }
        .marque { display: flex; align-items: center; gap: 22px; }
        .marque svg { width: 92px; height: 92px; flex: none; border-radius: 22px; box-shadow: 0 8px 24px rgba(10,8,44,.35); }
        h1 { margin: 0; font-size: 88px; line-height: 1; ${rtl ? '' : 'letter-spacing: -0.01em;'} }
        .ligne { margin: 0; font-weight: 600; font-size: ${rtl ? 36 : 33}px; line-height: ${rtl ? 1.5 : 1.25}; text-wrap: balance; }
        .sous { margin: 0; font-weight: 400; font-size: ${rtl ? 25 : 22}px; opacity: .85; }
        .telephone { position: absolute; top: 52px; inset-inline-end: 86px; width: 244px; height: 480px;
          border-radius: 36px 36px 0 0; background: #14122e; padding: 9px 9px 0; box-sizing: border-box;
          box-shadow: 0 30px 60px rgba(10, 8, 44, .5); transform: rotate(${rtl ? '-4deg' : '4deg'}); }
        .telephone .ecran { width: 100%; height: 100%; border-radius: 28px 28px 0 0; overflow: hidden; background: #f7f0e3; }
        .telephone img { width: 100%; display: block; margin-top: -${Math.round(COUPE_HAUT * (226 / 1080))}px; }
      </style><body>
        <div class="texte">
          <div class="marque">${icone}<h1 class="titre">${t.titre}</h1></div>
          <p class="ligne">${t.ligne}</p>
          <p class="sous">${t.sous}</p>
        </div>
        <div class="telephone"><div class="ecran"><img src="${image(source)}"></div></div>
      </body></html>`
    await rendre(navigateur, html, { width: 1024, height: 500 }, join(DOSSIER, langue, 'presentation-1024x500.png'))
  }
} finally {
  await navigateur.close()
}
