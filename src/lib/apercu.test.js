// L'aperçu d'un lien Rihla collé dans un message (WhatsApp, Telegram, iMessage,
// X…) vient des balises Open Graph d'index.html : un crawler lit le HTML tel
// quel, sans exécuter l'app. Ici on lit le même fichier — et on vérifie que
// l'image annoncée existe, avec les dimensions annoncées, à l'adresse même que
// les liens de partage (BASE_LIEN). Ce que ça ne dit pas : à quoi ressemble
// l'aperçu dans WhatsApp — à regarder sur un lien jamais partagé, après un
// déploiement (les messageries gardent l'aperçu en cache).
import { existsSync, readFileSync, statSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { BASE_LIEN } from './barid.js'

const HTML = readFileSync(new URL('../../index.html', import.meta.url), 'utf8')
const PUBLIC = new URL('../../public/', import.meta.url)

// Le HTML sans ses commentaires : un commentaire qui cite « og:image » ne
// compte pas pour une balise.
const SANS_COMMENTAIRES = HTML.replace(/<!--[\s\S]*?-->/g, '')

// Toutes les balises meta à propriété ou à nom : [clé, contenu].
const balises = [...SANS_COMMENTAIRES.matchAll(/<meta\s+(?:property|name)="([^"]+)"\s+content="([^"]*)"\s*\/?>/g)].map((m) => [m[1], m[2]])
const toutes = (cle) => balises.filter(([k]) => k === cle).map(([, v]) => v)
const une = (cle) => {
  const valeurs = toutes(cle)
  expect(valeurs, `${cle} doit apparaître exactement une fois`).toHaveLength(1)
  return valeurs[0]
}

// Largeur et hauteur d'un PNG : l'en-tête IHDR, aux octets 16 à 24.
const dimensionsPng = (chemin) => {
  const octets = readFileSync(chemin)
  expect(octets.subarray(1, 4).toString('ascii'), `${chemin} n'est pas un PNG`).toBe('PNG')
  return { largeur: octets.readUInt32BE(16), hauteur: octets.readUInt32BE(20) }
}

describe('l’aperçu d’un lien partagé (Open Graph)', () => {
  it('annonce un titre, une description, un type et une carte', () => {
    expect(une('og:type')).toBe('website')
    expect(une('og:site_name')).toMatch(/Rihla/)
    expect(une('og:title')).toMatch(/Rihla/)
    expect(une('og:description').length).toBeGreaterThan(40)
    // Une carte « summary » : l'image est un carré (l'icône), pas une bannière.
    expect(une('twitter:card')).toBe('summary')
  })

  it('dit sa description en français ET en arabe, et reste assez courte pour un aperçu', () => {
    const description = une('og:description')
    expect(description).toMatch(/Apprends les langues du monde/)
    expect(description).toMatch(/[؀-ۿ]{3}/)
    expect(description.length).toBeLessThanOrEqual(160)
  })

  it('déclare le français, avec l’arabe en variante', () => {
    expect(une('og:locale')).toBe('fr_FR')
    expect(toutes('og:locale:alternate')).toEqual(['ar_AR'])
  })

  it('pointe l’image à la MÊME adresse que les liens de partage, en https absolu', () => {
    const image = une('og:image')
    // Une adresse relative ne dit rien à un crawler : il n'a pas la page pour base.
    expect(image).toMatch(/^https:\/\//)
    expect(image.startsWith(BASE_LIEN), `${image} doit commencer par ${BASE_LIEN}`).toBe(true)
    expect(une('og:image:alt').length).toBeGreaterThan(10)
  })

  it('l’image existe dans public/, avec le type, les dimensions et le poids annoncés', () => {
    const image = une('og:image')
    const relatif = image.slice(BASE_LIEN.length)
    const fichier = new URL(relatif, PUBLIC)
    expect(existsSync(fichier), `${relatif} absent de public/ : l'aperçu serait sans vignette`).toBe(true)
    expect(une('og:image:type')).toBe('image/png')
    const { largeur, hauteur } = dimensionsPng(fichier)
    expect(String(largeur)).toBe(une('og:image:width'))
    expect(String(hauteur)).toBe(une('og:image:height'))
    // WhatsApp ne montre pas une vignette de plus de ~300 Ko ; au moins 300×300
    // pour être jugée assez grande.
    expect(statSync(fichier).size).toBeLessThan(300 * 1024)
    expect(Math.min(largeur, hauteur)).toBeGreaterThanOrEqual(300)
  })

  it('réutilise une icône déjà livrée par le manifeste : aucun octet de plus à pré-cacher', () => {
    const manifeste = JSON.parse(readFileSync(new URL('manifest.webmanifest', PUBLIC), 'utf8'))
    const relatif = une('og:image').slice(BASE_LIEN.length)
    expect(manifeste.icons.map((i) => i.src)).toContain(relatif)
  })

  it('ne remplace ni le titre ni la description d’origine, que les moteurs de recherche lisent', () => {
    expect(SANS_COMMENTAIRES).toMatch(/<title>Rihla — les langues du monde<\/title>/)
    expect(une('description')).toMatch(/gratuitement, pour toujours/)
  })

  it('n’a aucune balise Open Graph sans contenu, ni doublon', () => {
    const og = balises.filter(([k]) => k.startsWith('og:') || k.startsWith('twitter:'))
    expect(og.length).toBeGreaterThanOrEqual(12)
    for (const [cle, valeur] of og) expect(valeur.trim(), cle).not.toBe('')
    const cles = og.map(([k]) => k).filter((k) => k !== 'og:locale:alternate')
    expect(new Set(cles).size).toBe(cles.length)
  })
})
