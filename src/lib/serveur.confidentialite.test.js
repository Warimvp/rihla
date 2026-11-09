import { readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Ce que la page de confidentialité et la fiche « Sécurité des données » de Google Play disent du serveur de
 * duels : « aucune adresse IP conservée ». Deux endroits peuvent la contredire sans qu'aucun test d'écran ne le
 * voie — le CODE du Worker (il lit l'IP ou la journalise) et sa CONFIGURATION (les journaux de Workers gardent les
 * en-têtes de chaque requête, adresse IP comprise, 3 à 7 jours). On les garde ici.
 */

const RACINE = resolve(import.meta.dirname, '..', '..')
const SERVEUR = join(RACINE, 'serveur')

/** `wrangler.jsonc` sans ses commentaires, de ligne et de bloc — hors des chaînes, où `//` peut se trouver dans une URL. */
function lireJsonc(texte) {
  let sortie = ''
  let i = 0
  while (i < texte.length) {
    const c = texte[i]
    if (c === '"') {
      let j = i + 1
      while (j < texte.length && texte[j] !== '"') j += texte[j] === '\\' ? 2 : 1
      sortie += texte.slice(i, j + 1)
      i = j + 1
    } else if (c === '/' && texte[i + 1] === '/') {
      while (i < texte.length && texte[i] !== '\n') i++
    } else if (c === '/' && texte[i + 1] === '*') {
      const fin = texte.indexOf('*/', i + 2)
      i = fin === -1 ? texte.length : fin + 2
    } else {
      sortie += c
      i++
    }
  }
  return JSON.parse(sortie.replace(/,(\s*[}\]])/g, '$1'))
}

/** Les fichiers du Worker, sans les commentaires de ligne (ils ont le droit de parler d'IP, pas le code). */
function sourcesDuWorker() {
  return readdirSync(join(SERVEUR, 'src'))
    .filter((f) => f.endsWith('.js'))
    .map((f) => ({ f, code: readFileSync(join(SERVEUR, 'src', f), 'utf8').replace(/^\s*\/\/.*$/gm, '') }))
}

describe('le serveur de duels et la promesse « aucune adresse IP conservée »', () => {
  it('lit la configuration du Worker (témoin : sans lui, un lecteur cassé ferait tout réussir)', () => {
    const conf = lireJsonc(readFileSync(join(SERVEUR, 'wrangler.jsonc'), 'utf8'))
    expect(conf.name).toBe('rihla-serveur')
    expect(conf.durable_objects.bindings).toHaveLength(3)
  })

  it('le lecteur de commentaires respecte les // des chaînes', () => {
    expect(lireJsonc('{ "u": "https://x.y/z", // note\n "v": 1 /* autre */ }')).toEqual({ u: 'https://x.y/z', v: 1 })
  })

  it('les journaux de Workers sont ÉTEINTS, explicitement (absent = réglage laissé au tableau de bord)', () => {
    const conf = lireJsonc(readFileSync(join(SERVEUR, 'wrangler.jsonc'), 'utf8'))
    expect(conf.observability).toEqual({ enabled: false })
  })

  it('le code du Worker ne lit aucune adresse IP et ne journalise aucune requête', () => {
    // `request.headers.get('upgrade')` (WebSocket) est légitime : on ne vise que les en-têtes qui portent l'IP.
    const lecture = /cf-connecting-ip|true-client-ip|x-forwarded-for|x-real-ip|['"]forwarded['"]|request\.cf\b|\.cf\?\.|console\.(log|info|debug)\b/i
    const fautifs = sourcesDuWorker().filter(({ code }) => lecture.test(code)).map(({ f }) => f)
    expect(fautifs).toEqual([])
  })

  it('le seul journal du code est une erreur sans requête (le classement indisponible)', () => {
    const appels = sourcesDuWorker().flatMap(({ f, code }) => [...code.matchAll(/console\.\w+\(([^)]*)\)/g)].map((m) => `${f}: ${m[0]}`))
    expect(appels).toEqual(["salle.js: console.error('classement des duels indisponible', e)"])
  })
})
