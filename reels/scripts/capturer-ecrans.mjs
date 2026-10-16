// Capture les écrans RÉELS de l'app (interface arabe, iPhone 390×844 @3x) qui habillent les téléphones des pubs.
// Prérequis : l'app tourne sur RIHLA_URL (par défaut `pnpm dev`, port 5183). Sortie : public/ecrans/ + manifeste.json.
//   node scripts/capturer-ecrans.mjs            tout
//   node scripts/capturer-ecrans.mjs accueil    une seule partie : accueil | destinations | ja | en
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { LANGUES } from '../../src/data/langues.js'
import { mulberry32 } from '../../src/lib/quiz.js'
import { ciblePhrase } from '../../src/lib/phrase.js'
import { cibleEpellation } from '../../src/lib/epellation.js'
import { lancer, ouvrir, progresDePub } from './app.mjs'

const SORTIE = fileURLToPath(new URL('../public/ecrans/', import.meta.url))
mkdirSync(SORTIE, { recursive: true })
const FICHIER_MANIFESTE = SORTIE + 'manifeste.json'
const manifeste = existsSync(FICHIER_MANIFESTE) ? JSON.parse(readFileSync(FICHIER_MANIFESTE, 'utf8')) : {}
const enregistrer = () => writeFileSync(FICHIER_MANIFESTE, JSON.stringify(manifeste, null, 1))
const pause = (ms) => new Promise((r) => setTimeout(r, ms))
const norm = (s) => String(s ?? '').replace(/\s+/g, ' ').trim()

const BASE = {
  'rihla.langue': 'ar',
  'rihla.cap': 'route',
  'rihla.bienvenue': 'vu',
  'rihla.theme': 'clair',
  'rihla.progres.v1': JSON.stringify(progresDePub()),
}

const jpg = (page, chemin) => page.screenshot({ path: SORTIE + chemin, type: 'jpeg', quality: 93 })
const boite = async (loc) => {
  const b = await loc.boundingBox()
  return b && { x: b.x, y: b.y, w: b.width, h: b.height }
}
const imagesChargees = (page) =>
  page.waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0), null, { timeout: 8000 }).catch(() => {})

// ———— Accueil + destinations ————
async function accueil(nav) {
  const { contexte, page } = await ouvrir(nav, { valeurs: BASE })
  await imagesChargees(page)
  await pause(300)
  await jpg(page, 'accueil.jpg')
  manifeste.accueil = { carte: await boite(page.locator('text=واصل').first()) }
  await contexte.close()
}

async function destinations(nav) {
  for (const id of ['ja', 'es', 'it', 'tr', 'ar', 'hi', 'en']) {
    const { contexte, page } = await ouvrir(nav, { valeurs: { ...BASE, 'rihla.destination': id } })
    await page.getByRole('button', { name: 'تعلّم' }).click()
    await imagesChargees(page)
    await pause(500)
    await jpg(page, `dest-${id}.jpg`)
    await contexte.close()
  }
}

// ———— Une leçon : cartes (recto / verso séparés) puis quiz joué juste ————
const CSS_FACES = `
.carte-mot__interieur{transform:none!important;transition:none!important}
.carte-mot__face{backface-visibility:visible!important;transform:none!important}`

async function photoFace(page, quelle) {
  const autre = quelle === 'recto' ? 'verso' : 'recto'
  const style = await page.addStyleTag({ content: `${CSS_FACES}\n.carte-mot__face--${autre}{visibility:hidden!important}` })
  const carte = page.locator('.carte-mot')
  const buf = await carte.screenshot({ type: 'png', omitBackground: true })
  await style.evaluate((n) => n.remove())
  return buf
}

async function sansCarte(page, chemin) {
  await page.addStyleTag({ content: '.carte-mot{visibility:hidden!important}' }).then(async (n) => {
    await jpg(page, chemin)
    await n.evaluate((x) => x.remove())
  })
}

const lireQuestion = (page) =>
  page.evaluate(() => {
    const ids = (sel) => [...document.querySelectorAll(sel)]
    const carte = document.querySelector('.carte')
    const cibleEl = carte?.querySelector('[lang]:not(bdi)')
    return {
      invite: document.querySelector('p[tabindex="-1"]')?.innerText.trim() ?? '',
      carte: carte?.innerText.replace(/\s+/g, ' ').trim() ?? '',
      cible: cibleEl?.className.includes('mot-cible') ? cibleEl.innerText.trim() : null,
      sensCarte: carte?.querySelector('bdi')?.innerText.trim() ?? null,
      options: ids('.option').map((o) => o.innerText.replace(/\s+/g, ' ').trim()),
      lettres: ids('.lettre:not(.lettre--mot)').length,
      jetons: ids('.lettre--mot').length,
      dit: window.__dit ?? null,
    }
  })

async function jouerLecon(nav, { id, langueId, leconId, graine, nCartes, nQuestions, valeurs = {} }) {
  const langue = LANGUES.find((l) => l.id === langueId)
  const lecon = langue.lecons.find((l) => l.id === leconId)
  const dossier = `lecon-${id}/`
  mkdirSync(SORTIE + dossier, { recursive: true })
  const { contexte, page } = await ouvrir(nav, { valeurs: { ...BASE, 'rihla.destination': langueId, ...valeurs } })
  const m = (manifeste[id] = { langueId, leconId, graine, cartes: [], questions: [] })

  await page.getByRole('button', { name: 'تعلّم' }).click()
  await page.evaluate(({ src, g }) => { Math.random = (0, eval)(`(${src})`)(g) }, { src: mulberry32.toString(), g: graine })
  await page.getByRole('button', { name: new RegExp(lecon.titreAr) }).first().click()
  await pause(300)

  // — cartes —
  for (let i = 0; i < nCartes; i++) {
    const carte = page.locator('.carte-mot')
    const c = { texte: lecon.mots[i].t, sens: lecon.mots[i].ar }
    c.boiteCarte = await boite(carte)
    c.boiteBouton = await boite(page.locator('button.bouton--primaire'))
    await sansCarte(page, `${dossier}c${i}-base-recto.jpg`)
    writeFileSync(SORTIE + `${dossier}c${i}-recto.png`, await photoFace(page, 'recto'))
    await page.locator('button.bouton--primaire').click()
    await pause(150)
    await sansCarte(page, `${dossier}c${i}-base-verso.jpg`)
    writeFileSync(SORTIE + `${dossier}c${i}-verso.png`, await photoFace(page, 'verso'))
    m.cartes.push(c)
    if (i < nCartes - 1) {
      await page.locator('button.bouton--primaire').click() // « التالي »
      await pause(150)
    }
  }
  await page.getByRole('button', { name: 'انتقل إلى الاختبار' }).click()
  await pause(300)

  // — quiz —
  for (let q = 0; q < nQuestions; q++) {
    await pause(250)
    const etat = await lireQuestion(page)
    const rec = { invite: etat.invite, carte: etat.carte, taps: [], etapes: ['a'] }
    await jpg(page, `${dossier}q${q}-a.jpg`)
    rec.boiteContinuer = null

    if (etat.options.length) {
      let mot
      let attendu
      if (/استمع/.test(etat.invite) || (!etat.cible && !etat.sensCarte)) {
        mot = langue.lecons.flatMap((l) => l.mots).find((x) => x.t === etat.dit)
        attendu = mot?.ar
        rec.type = 'ecouter'
      } else if (etat.cible) {
        mot = lecon.mots.find((x) => x.t === etat.cible)
        const lire = /تُقرأ/.test(etat.invite)
        attendu = lire ? mot?.r : mot?.ar
        rec.type = lire ? 'lire' : 'comprendre'
      } else {
        mot = lecon.mots.find((x) => x.ar === etat.sensCarte)
        attendu = mot?.t
        rec.type = 'produire'
      }
      rec.mot = mot?.t
      const options = page.locator('.option')
      const n = await options.count()
      let cible = -1
      for (let k = 0; k < n; k++) {
        const t = norm(await options.nth(k).innerText())
        if (t === norm(attendu) || (rec.type === 'produire' && t.startsWith(norm(attendu)))) cible = k
      }
      if (cible < 0) throw new Error(`Réponse introuvable pour Q${q} (${rec.type}) : ${JSON.stringify({ attendu, etat })}`)
      rec.options = []
      for (let k = 0; k < n; k++) rec.options.push({ texte: norm(await options.nth(k).innerText()), ...(await boite(options.nth(k))), juste: k === cible })
      rec.taps.push({ ...(await boite(options.nth(cible))), apres: 'a' })
      await options.nth(cible).click()
      await pause(200)
      await jpg(page, `${dossier}q${q}-b.jpg`)
      rec.etapes.push('b')
    } else {
      // tuiles : lettres (épeler / dictée) ou mots (phrase à remettre dans l'ordre)
      const mots = langue.lecons.flatMap((l) => l.mots)
      const mot = lecon.mots.find((x) => x.ar === etat.sensCarte) ?? mots.find((x) => x.t === etat.dit)
      const aLettres = etat.lettres > 0
      const sequence = aLettres ? cibleEpellation(mot).split('').filter((c) => c !== ' ') : ciblePhrase(mot)
      rec.type = aLettres ? 'epeler' : 'ordonner'
      rec.mot = mot.t
      const classe = aLettres ? '.lettre:not(.lettre--mot)' : '.lettre--mot'
      const milieu = Math.max(1, Math.floor(sequence.length / 2))
      for (let k = 0; k < sequence.length; k++) {
        const candidates = page.locator(`${classe}:not([aria-disabled="true"]):not([disabled])`)
        const nb = await candidates.count()
        let choisi = null
        for (let j = 0; j < nb; j++) if (norm(await candidates.nth(j).innerText()) === sequence[k]) { choisi = candidates.nth(j); break }
        if (!choisi) throw new Error(`Tuile « ${sequence[k]} » introuvable (Q${q})`)
        rec.taps.push({ ...(await boite(choisi)), apres: k === 0 ? 'a' : `m${k}` })
        await choisi.click()
        await pause(120)
        if (k === 0 && sequence.length > 2) { await jpg(page, `${dossier}q${q}-m1.jpg`); rec.etapes.push('m1') }
        else if (k + 1 === milieu && milieu > 1 && k + 1 < sequence.length) { await jpg(page, `${dossier}q${q}-m${k + 1}.jpg`); rec.etapes.push(`m${k + 1}`) }
      }
      await pause(200)
      await jpg(page, `${dossier}q${q}-b.jpg`)
      rec.etapes.push('b')
    }
    const suite = page.getByRole('button', { name: /^واصل$/ })
    rec.boiteContinuer = await boite(suite)
    m.questions.push(rec)
    console.log(id, 'Q' + q, rec.type, rec.mot, rec.etapes.join(','))
    await suite.click()
  }
  await contexte.close()
}

const partie = process.argv[2]
const nav = await lancer()
try {
  if (!partie || partie === 'accueil') await accueil(nav)
  if (!partie || partie === 'destinations') await destinations(nav)
  if (!partie || partie === 'ja')
    await jouerLecon(nav, { id: 'ja', langueId: 'ja', leconId: 'atable', graine: 110, nCartes: 4, nQuestions: 2 })
  if (!partie || partie === 'en')
    await jouerLecon(nav, { id: 'en', langueId: 'en', leconId: 'salutations', graine: 552, nCartes: 3, nQuestions: 4 })
  enregistrer()
} finally {
  await nav.close()
}
