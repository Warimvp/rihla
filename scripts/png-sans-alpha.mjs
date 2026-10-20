// Retire le canal alpha d'un PNG RGBA 8 bits, SANS PERTE et sans dépendance.
//
//   import { retirerAlpha, aUnAlpha } from './png-sans-alpha.mjs'
//   const png24 = retirerAlpha(readFileSync('capture.png'))
//
// Pourquoi ce fichier existe : Google Play REFUSE une capture ou une image de
// présentation transparente (« PNG 24 bits sans alpha »). L'émulateur et
// Chromium écrivent TOUJOURS du RGBA, même quand chaque pixel est opaque.
// `sips` ne sait pas l'enlever proprement : un aller-retour par BMP garde le
// canal (constaté le 11/10/2026 — un contrôle d'icône y a répondu « conforme »
// à un sabotage qui ne changeait rien), et un aller-retour par JPEG l'enlève
// mais ABÎME le texte d'une capture.
//
// Garde-fou : on REFUSE si un seul pixel n'est pas parfaitement opaque. Jeter
// l'alpha d'une image réellement transparente la déformerait en silence.
import { deflateSync, inflateSync, crc32 } from 'node:zlib'

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

/** Octet 25 d'un PNG : le type de couleur. 6 = RGBA, 4 = gris + alpha. */
export const aUnAlpha = (png) => png[25] === 6 || png[25] === 4

function morceaux(png) {
  if (!png.subarray(0, 8).equals(SIGNATURE)) throw new Error("ce n'est pas un PNG")
  const res = []
  let o = 8
  while (o < png.length) {
    const longueur = png.readUInt32BE(o)
    res.push({ type: png.toString('latin1', o + 4, o + 8), donnees: png.subarray(o + 8, o + 8 + longueur) })
    o += 12 + longueur
  }
  return res
}

function ecrireMorceau(type, donnees) {
  const tete = Buffer.alloc(8)
  tete.writeUInt32BE(donnees.length, 0)
  tete.write(type, 4, 'latin1')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([tete.subarray(4), donnees])) >>> 0, 0)
  return Buffer.concat([tete, donnees, crc])
}

const paeth = (a, b, c) => {
  const p = a + b - c
  const pa = Math.abs(p - a)
  const pb = Math.abs(p - b)
  const pc = Math.abs(p - c)
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c
}

/**
 * @param {Buffer} png  PNG RGBA 8 bits
 * @param {{ hauteur?: number }} [options]  `hauteur` : ne garder que les N lignes du HAUT
 *   (rognage du bas, sans perte) — la hauteur exigée par un magasin n'est pas toujours celle de l'écran.
 */
export function retirerAlpha(png, options = {}) {
  const ms = morceaux(png)
  const ihdr = ms.find((m) => m.type === 'IHDR').donnees
  const largeur = ihdr.readUInt32BE(0)
  const hauteur = ihdr.readUInt32BE(4)
  const [profondeur, couleur, , , entrelace] = [ihdr[8], ihdr[9], ihdr[10], ihdr[11], ihdr[12]]
  if (couleur === 2 && options.hauteur === undefined) return png // déjà RGB, rien à rogner
  if (couleur !== 6 || profondeur !== 8 || entrelace !== 0) {
    throw new Error(`PNG non géré (couleur ${couleur}, ${profondeur} bits, entrelacé ${entrelace}) : RGBA 8 bits attendu`)
  }
  const brut = inflateSync(Buffer.concat(ms.filter((m) => m.type === 'IDAT').map((m) => m.donnees)))
  const ligne = largeur * 4
  if (brut.length !== (ligne + 1) * hauteur) throw new Error('flux PNG de longueur inattendue')

  // Défiltrage (spécification PNG, § 9) : on reconstruit les pixels RGBA.
  const pixels = Buffer.alloc(ligne * hauteur)
  for (let y = 0; y < hauteur; y++) {
    const filtre = brut[y * (ligne + 1)]
    const src = y * (ligne + 1) + 1
    const dst = y * ligne
    for (let x = 0; x < ligne; x++) {
      const a = x >= 4 ? pixels[dst + x - 4] : 0
      const b = y > 0 ? pixels[dst - ligne + x] : 0
      const c = x >= 4 && y > 0 ? pixels[dst - ligne + x - 4] : 0
      const v = brut[src + x]
      pixels[dst + x] =
        filtre === 0 ? v
        : filtre === 1 ? (v + a) & 255
        : filtre === 2 ? (v + b) & 255
        : filtre === 3 ? (v + ((a + b) >> 1)) & 255
        : filtre === 4 ? (v + paeth(a, b, c)) & 255
        : (() => { throw new Error(`filtre PNG inconnu : ${filtre}`) })()
    }
  }

  // RGB, sans filtre, en vérifiant l'opacité de CHAQUE pixel.
  const hauteurSortie = options.hauteur ?? hauteur
  if (hauteurSortie > hauteur || hauteurSortie < 1) throw new Error(`rognage impossible : ${hauteurSortie} lignes demandées sur ${hauteur}`)
  const sortie = Buffer.alloc((largeur * 3 + 1) * hauteurSortie)
  for (let y = 0; y < hauteurSortie; y++) {
    let o = y * (largeur * 3 + 1)
    sortie[o++] = 0
    for (let x = 0; x < largeur; x++) {
      const i = y * ligne + x * 4
      if (pixels[i + 3] !== 255) throw new Error(`pixel (${x}, ${y}) non opaque (alpha ${pixels[i + 3]}) : on ne jette pas un alpha utile`)
      sortie[o++] = pixels[i]
      sortie[o++] = pixels[i + 1]
      sortie[o++] = pixels[i + 2]
    }
  }

  const nouvelEnTete = Buffer.from(ihdr)
  nouvelEnTete[9] = 2
  nouvelEnTete.writeUInt32BE(hauteurSortie, 4)
  const resultat = Buffer.concat([
    SIGNATURE,
    ecrireMorceau('IHDR', nouvelEnTete),
    ecrireMorceau('IDAT', deflateSync(sortie, { level: 9 })),
    ecrireMorceau('IEND', Buffer.alloc(0)),
  ])
  if (aUnAlpha(resultat)) throw new Error("le canal alpha a survécu à l'aplatissement")
  return resultat
}
