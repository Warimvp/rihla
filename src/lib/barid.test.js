import { describe, expect, it } from 'vitest'
import {
  CATALOGUE_COURANT,
  NB_QUESTIONS_BARID,
  ROUTE_ORIGINE,
  TOUTE_LA_ROUTE,
  XP_PAR_BONNE,
  XP_VICTOIRE,
  accuserReponse,
  bilanBarid,
  catalogueDe,
  catalogueDuJeton,
  construireBarid,
  decoderLettre,
  encoderLettre,
  estBonneOption,
  estTouteLaRoute,
  extraireCodes,
  lienLettre,
  nettoyerNom,
  nomPublic,
  nouvelleGraine,
  routeConnue,
  terminerBarid,
  verdict,
  xpBarid,
} from './barid.js'
import { LANGUES } from '../data/langues.js'
import { progresInitial } from './progression.js'
import { importerProgres, exporterProgres } from './sauvegarde.js'

const IDS = LANGUES.map((l) => l.id)
const cle = (q) => `${q.langue.id}:${q.mot.id}`

// Refait ce que fait encoderLettre, mais sans recalculer l'empreinte : c'est
// ce qu'un petit malin ferait pour retoucher son score dans le lien.
const trafiquer = (code, retouche) => {
  const b64 = code.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (code.length % 4)) % 4)
  const lu = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))))
  const texte = JSON.stringify(retouche(lu))
  let binaire = ''
  for (const octet of new TextEncoder().encode(texte)) binaire += String.fromCharCode(octet)
  return btoa(binaire).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

describe('construireBarid', () => {
  it('donne le même tirage pour la même graine, un autre pour une autre graine', () => {
    expect(construireBarid(LANGUES, 'tr', 4242).map(cle)).toEqual(construireBarid(LANGUES, 'tr', 4242).map(cle))
    expect(construireBarid(LANGUES, 'tr', 4242).map(cle)).not.toEqual(construireBarid(LANGUES, 'tr', 4243).map(cle))
  })

  it('reste dans la langue demandée, et alterne comprendre / produire', () => {
    const defi = construireBarid(LANGUES, 'es', 7)
    expect(defi).toHaveLength(NB_QUESTIONS_BARID)
    expect(defi.every((q) => q.langue.id === 'es')).toBe(true)
    expect(defi.map((q) => q.type)).toEqual(
      Array.from({ length: NB_QUESTIONS_BARID }, (_, i) => (i % 2 === 0 ? 'comprendre' : 'produire'))
    )
  })

  it('sur toute la route, mêle les langues mais prend ses distracteurs dans celle du mot', () => {
    const defi = construireBarid(LANGUES, TOUTE_LA_ROUTE, 99)
    expect(new Set(defi.map((q) => q.langue.id)).size).toBeGreaterThan(2)
    for (const question of defi) {
      const motsDeLaLangue = question.langue.lecons.flatMap((l) => l.mots)
      expect(question.options).toHaveLength(4)
      expect(new Set(question.options.map((o) => o.id)).size).toBe(4)
      expect(question.options.every((o) => motsDeLaLangue.includes(o))).toBe(true)
      expect(question.options.filter((o) => estBonneOption(question, o))).toHaveLength(1)
    }
  })

  it('sur la route d’ORIGINE, tire toujours les mêmes questions — les lettres déjà parties restent jouables', () => {
    // Relevé avant l'arrivée du français : la graine 99 sur '*' donnait ceci.
    // Si ce test casse, un défi en circulation (et le serveur de la Course,
    // qui juge sur ce tirage) ne pose plus les questions que l'envoyeur a vues.
    expect(construireBarid(LANGUES, ROUTE_ORIGINE, 99).map((q) => `${q.langue.id}:${q.mot.id}`)).toEqual([
      'ko:quandarrive',
      'pt:toilettes',
      'hi:magasin',
      'zh:ouest',
      'ar:porte',
      'ja:amonavis',
      'sw:hiervisite',
      'ja:lit',
      'it:samedi',
      'de:comprendspas',
    ])
    for (let graine = 1; graine <= 200; graine++) {
      for (const question of construireBarid(LANGUES, ROUTE_ORIGINE, graine)) expect(catalogueDe(question.langue)).toBe(1)
    }
  })

  it('sur la route d’aujourd’hui, le français est du voyage', () => {
    const langues = new Set()
    for (let graine = 1; graine <= 200; graine++) {
      for (const question of construireBarid(LANGUES, TOUTE_LA_ROUTE, graine)) langues.add(question.langue.id)
    }
    expect(langues.has('fr')).toBe(true)
    expect(langues.size).toBe(LANGUES.length)
  })

  it('nomme le catalogue dans le jeton de route, et le catalogue courant est celui des données', () => {
    expect(catalogueDuJeton('*')).toBe(1)
    expect(catalogueDuJeton('*2')).toBe(2)
    expect(catalogueDuJeton('*12')).toBe(12)
    for (const faux of ['*1', '*0', '*02', '*x', '**', 'fr', '', null, undefined]) expect(catalogueDuJeton(faux), String(faux)).toBe(null)
    expect(estTouteLaRoute('*')).toBe(true)
    expect(estTouteLaRoute('es')).toBe(false)
    expect(routeConnue(`*${CATALOGUE_COURANT + 1}`)).toBe(false)
    // Le garde-fou : une destination ajoutée avec `catalogue: 3` sans toucher
    // CATALOGUE_COURANT resterait hors de « toute la route ».
    expect(CATALOGUE_COURANT).toBe(Math.max(...LANGUES.map(catalogueDe)))
    expect(catalogueDuJeton(TOUTE_LA_ROUTE)).toBe(CATALOGUE_COURANT)
    expect(LANGUES.filter((l) => catalogueDe(l) === 1).map((l) => l.id)).toEqual([
      'es', 'pt', 'it', 'de', 'en', 'tr', 'ar', 'ru', 'fa', 'sw', 'hi', 'zh', 'ko', 'ja',
    ])
  })

  it('ne connaît pas une langue absente du catalogue', () => {
    expect(construireBarid(LANGUES, 'xx', 1)).toEqual([])
  })

  it('tire des graines entières dans l’intervalle, jamais nulles', () => {
    expect(nouvelleGraine(() => 0)).toBe(1)
    expect(nouvelleGraine(() => 0.999999999)).toBeLessThan(2147483647)
    expect(Number.isInteger(nouvelleGraine())).toBe(true)
  })
})

describe('verdict et XP', () => {
  it('juge au score, puis au temps, sinon égalité', () => {
    expect(verdict({ s: 8, t: 60 }, { s: 7, t: 10 })).toBe('gagne')
    expect(verdict({ s: 7, t: 10 }, { s: 8, t: 60 })).toBe('perdu')
    expect(verdict({ s: 8, t: 30 }, { s: 8, t: 45 })).toBe('gagne')
    expect(verdict({ s: 8, t: 45 }, { s: 8, t: 30 })).toBe('perdu')
    expect(verdict({ s: 8, t: 30 }, { s: 8, t: 30 })).toBe('egal')
    expect(verdict({ s: 8 }, { s: 8, t: 30 })).toBe('egal')
  })

  it('paie chaque bonne réponse, et la victoire en plus — moins qu’une leçon', () => {
    expect(xpBarid(10, 'gagne')).toBe(10 * XP_PAR_BONNE + XP_VICTOIRE)
    expect(xpBarid(10, 'perdu')).toBe(10 * XP_PAR_BONNE)
    expect(xpBarid(4, null)).toBe(4 * XP_PAR_BONNE)
    expect(xpBarid(10, 'gagne')).toBeLessThan(8 * 10 + 20)
  })
})

describe('nettoyerNom', () => {
  it('retire les caractères de contrôle, tasse les espaces, coupe court', () => {
    expect(nettoyerNom('  Amine ‏  El  ')).toBe('Amine El')
    expect(nettoyerNom('a'.repeat(40))).toHaveLength(24)
    expect(nettoyerNom(null)).toBe('')
    expect(nettoyerNom('فاطمة')).toBe('فاطمة')
  })
})

describe('nomPublic', () => {
  it('rend le nom nettoyé quand il est montrable, vide sinon', () => {
    expect(nomPublic('  Amine ‏  El  ')).toBe('Amine El')
    expect(nomPublic('فاطمة')).toBe('فاطمة')
    expect(nomPublic('connard')).toBe('')
    expect(nomPublic('06 12 34 56 78')).toBe('')
    expect(nomPublic(null)).toBe('')
  })

  it('juge le nom tel qu’il partira : coupé à 24 caractères, pas avant', () => {
    // La coupe se fait AVANT le filtre : on juge ce qui sera montré, ni plus
    // (« con » n'est pas une insulte) ni moins.
    expect(nomPublic(`${'a'.repeat(24)} connard`)).toBe('a'.repeat(24))
    expect(nomPublic(`${'a'.repeat(20)} connard`)).toBe(`${'a'.repeat(20)} con`)
    expect(nomPublic(`${'a'.repeat(15)} connard`)).toBe('')
  })
})

describe('encoder / décoder une lettre', () => {
  const defi = { n: 'فاطمة', l: 'tr', g: 123456, s: 8, t: 42 }
  const reponse = { n: 'Amine', re: { l: 'tr', g: 123456, s: 9, t: 38, s0: 8, t0: 42 } }
  const riposte = { ...reponse, l: 'ja', g: 777, s: 6, t: 55 }

  it('fait l’aller-retour des trois formes, nom arabe compris', () => {
    for (const lettre of [defi, reponse, riposte]) {
      const resultat = decoderLettre(encoderLettre(lettre), IDS)
      expect(resultat.ok).toBe(true)
      expect(resultat.lettre).toMatchObject({ ...lettre, v: 1 })
    }
  })

  it('produit un code court, sûr dans une URL, et un lien vers l’app', () => {
    const code = encoderLettre(defi)
    expect(code).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(code.length).toBeLessThan(140)
    expect(lienLettre(code)).toBe(`https://warimvp.github.io/rihla/#barid=${code}`)
  })

  it('retrouve le code nu, dans un lien, ou noyé dans tout un message', () => {
    const code = encoderLettre(defi)
    const message = `Défi Rihla · فاطمة a fait 8/10 en 42 s (turc). Peux-tu faire mieux ? ${lienLettre(code)} — à toi !`
    expect(decoderLettre(code, IDS).ok).toBe(true)
    expect(decoderLettre(lienLettre(code), IDS).ok).toBe(true)
    expect(decoderLettre(message, IDS).lettre).toMatchObject(defi)
    expect(decoderLettre(`  ${lienLettre(code)}\n`, IDS).ok).toBe(true)
    expect(extraireCodes(message)[0]).toBe(code)
  })

  it('refuse le vide, le charabia, l’étranger et les autres versions', () => {
    expect(decoderLettre('').erreur).toBe('illisible')
    expect(decoderLettre('bonjour tout le monde').erreur).toBe('illisible')
    expect(decoderLettre('!!!!!!!!!!!!!!!!!!!!!!').erreur).toBe('illisible')
    expect(decoderLettre(btoa('{"marque":"autre-app"}').replace(/=+$/, '')).erreur).toBe('inconnu')
    expect(decoderLettre(trafiquer(encoderLettre(defi), (l) => ({ ...l, v: 2 }))).erreur).toBe('version')
  })

  it('démasque un score retouché dans le lien, mais tolère un autre ordre de clés', () => {
    const code = encoderLettre(defi)
    expect(decoderLettre(trafiquer(code, (l) => ({ ...l, s: 10 })), IDS).erreur).toBe('abime')
    expect(decoderLettre(trafiquer(code, (l) => ({ ...l, t: 1 })), IDS).erreur).toBe('abime')
    expect(decoderLettre(trafiquer(code, (l) => ({ ...l, c: 'zzz' })), IDS).erreur).toBe('abime')
    const inverse = trafiquer(code, ({ c, t, s, g, l, n, v }) => ({ c, t, s, g, l, n, v }))
    expect(decoderLettre(inverse, IDS).ok).toBe(true)
  })

  it('refuse une lettre sans défi ni réponse, ou aux champs hors bornes', () => {
    expect(decoderLettre(encoderLettre({ n: 'x' }), IDS).erreur).toBe('abime')
    expect(decoderLettre(encoderLettre({ n: 'x', l: 'tr', g: 5, s: 11, t: 4 }), IDS).erreur).toBe('abime')
    expect(decoderLettre(encoderLettre({ n: 'x', l: 'tr', g: 0, s: 3, t: 4 }), IDS).erreur).toBe('abime')
    expect(decoderLettre(encoderLettre({ n: 'x', l: 'tr', g: 5.5, s: 3, t: 4 }), IDS).erreur).toBe('abime')
  })

  it('signale une destination que cette version de l’app ne connaît pas', () => {
    expect(decoderLettre(encoderLettre({ n: 'x', l: 'klingon', g: 5, s: 3, t: 4 }), IDS).erreur).toBe('langue')
    expect(decoderLettre(encoderLettre({ n: 'x', l: 'klingon', g: 5, s: 3, t: 4 })).ok).toBe(true)
    expect(decoderLettre(encoderLettre({ n: 'x', l: TOUTE_LA_ROUTE, g: 5, s: 3, t: 4 }), IDS).ok).toBe(true)
    // Une lettre d'avant le français (route d'origine) s'ouvre toujours ; une
    // route d'un catalogue à venir est une destination inconnue, avec ou sans
    // liste de langues — jamais un duel sur d'autres questions.
    expect(decoderLettre(encoderLettre({ n: 'x', l: ROUTE_ORIGINE, g: 5, s: 3, t: 4 }), IDS).ok).toBe(true)
    const demain = `*${CATALOGUE_COURANT + 1}`
    expect(decoderLettre(encoderLettre({ n: 'x', l: demain, g: 5, s: 3, t: 4 }), IDS).erreur).toBe('langue')
    expect(decoderLettre(encoderLettre({ n: 'x', l: demain, g: 5, s: 3, t: 4 })).erreur).toBe('langue')
    expect(decoderLettre(encoderLettre({ n: 'x', re: { l: demain, g: 5, s: 3, t: 4, s0: 2, t0: 9 } }), IDS).erreur).toBe('langue')
  })

  it('ne filtre PAS le nom en route : l’empreinte se calcule sur le nom nettoyé, le filtre vit à l’affichage', () => {
    // Une lettre partie avec un nom que la liste d'aujourd'hui refuse (ou que
    // celle de demain refusera) doit rester lisible — « abîmée » serait faux.
    for (const n of ['connard', '06 12 34 56 78']) {
      const resultat = decoderLettre(encoderLettre({ ...defi, n }), IDS)
      expect(resultat.ok, n).toBe(true)
      expect(resultat.lettre.n).toBe(n)
      expect(nomPublic(resultat.lettre.n)).toBe('')
    }
  })

  it('nettoie le nom en route', () => {
    const lettre = decoderLettre(encoderLettre({ ...defi, n: '  Amine ' + 'x'.repeat(50) })).lettre
    expect(lettre.n).toHaveLength(24)
    expect(lettre.n.startsWith('Amine x')).toBe(true)
  })
})

describe('le progrès du Barid', () => {
  const JOUR = '2026-09-19'

  it('une partie lancée inscrit mon score, paie les bonnes réponses, sans verdict', () => {
    const { progres, verdict: v, xpGagne } = terminerBarid(
      progresInitial(),
      { graine: 42, langueId: 'tr', score: 7, temps: 51 },
      JOUR
    )
    expect(v).toBeNull()
    expect(xpGagne).toBe(7 * XP_PAR_BONNE)
    expect(progres.xp).toBe(7 * XP_PAR_BONNE)
    expect(progres.barid[42]).toEqual({ l: 'tr', s: 7, t: 51, jour: JOUR })
    expect(bilanBarid(progres)).toEqual({ gagnes: 0, perdus: 0, egalites: 0, joues: 1 })
  })

  it('relever un défi tranche tout de suite, et paie la victoire', () => {
    const adversaire = { n: 'Sara', s: 8, t: 40 }
    const gagnee = terminerBarid(progresInitial(), { graine: 9, langueId: 'es', score: 9, temps: 60, adversaire }, JOUR)
    expect(gagnee.verdict).toBe('gagne')
    expect(gagnee.xpGagne).toBe(9 * XP_PAR_BONNE + XP_VICTOIRE)
    expect(gagnee.progres.barid[9].adv).toEqual(adversaire)
    const perdue = terminerBarid(progresInitial(), { graine: 9, langueId: 'es', score: 7, temps: 20, adversaire }, JOUR)
    expect(perdue.verdict).toBe('perdu')
    expect(perdue.xpGagne).toBe(7 * XP_PAR_BONNE)
  })

  it('une réponse reçue inscrit le verdict sans XP, même deux fois, même sur un autre appareil', () => {
    const re = { l: 'tr', g: 42, s: 9, t: 38, s0: 7, t0: 51 }
    // Sur l'appareil qui a lancé le défi : la partie locale fait foi.
    const chezMoi = terminerBarid(progresInitial(), { graine: 42, langueId: 'tr', score: 7, temps: 51 }, JOUR).progres
    const une = accuserReponse(chezMoi, re, 'Amine', JOUR)
    const deux = accuserReponse(une, re, 'Amine', JOUR)
    expect(une.barid[42].verdict).toBe('perdu')
    expect(une.barid[42].adv).toEqual({ n: 'Amine', s: 9, t: 38 })
    expect(une.xp).toBe(chezMoi.xp)
    expect(deux).toEqual(une)
    expect(bilanBarid(deux)).toEqual({ gagnes: 0, perdus: 1, egalites: 0, joues: 1 })
    // Sur un appareil vierge : le score répété dans la lettre prend le relais.
    const ailleurs = accuserReponse(progresInitial(), re, 'Amine', JOUR)
    expect(ailleurs.barid[42]).toMatchObject({ l: 'tr', s: 7, t: 51, verdict: 'perdu' })
  })

  it('le bilan compte victoires, défaites, égalités et parties sans réponse', () => {
    let p = progresInitial()
    p = terminerBarid(p, { graine: 1, langueId: 'tr', score: 9, temps: 10, adversaire: { n: 'a', s: 8, t: 10 } }, JOUR).progres
    p = terminerBarid(p, { graine: 2, langueId: 'tr', score: 8, temps: 10, adversaire: { n: 'b', s: 8, t: 10 } }, JOUR).progres
    p = terminerBarid(p, { graine: 3, langueId: 'tr', score: 5, temps: 10, adversaire: { n: 'c', s: 8, t: 10 } }, JOUR).progres
    p = terminerBarid(p, { graine: 4, langueId: 'tr', score: 5, temps: 10 }, JOUR).progres
    expect(bilanBarid(p)).toEqual({ gagnes: 1, perdus: 1, egalites: 1, joues: 4 })
  })

  it('voyage dans la sauvegarde', () => {
    const p = terminerBarid(progresInitial(), { graine: 5, langueId: 'ja', score: 3, temps: 9 }, JOUR).progres
    const relu = importerProgres(exporterProgres(p, JOUR))
    expect(relu.ok).toBe(true)
    expect(relu.progres.barid).toEqual(p.barid)
    expect(importerProgres(exporterProgres({ ...p, barid: 'n’importe quoi' }, JOUR)).progres.barid).toEqual({})
  })
})
