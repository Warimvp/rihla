import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const MARQUE_BUILD = /const BUILD = '[^']*'/
const MARQUE_PRECACHE = /const PRECACHE = \[[^\]]*\]/

// Tous les fichiers livrés, chemins relatifs en URL ('assets/index-a1b2.js').
const listerFichiers = (racine, dossier = racine) =>
  readdirSync(dossier, { withFileTypes: true }).flatMap((entree) => {
    const chemin = join(dossier, entree.name)
    return entree.isDirectory()
      ? listerFichiers(racine, chemin)
      : [relative(racine, chemin).split(sep).join('/')]
  })

const empreinte = (donnees) => createHash('sha256').update(donnees).digest('hex')

// Ce qu'un navigateur demande vraiment : './' et non 'index.html'.
const urlPublique = (fichier) =>
  fichier === 'index.html'
    ? './'
    : fichier.endsWith('/index.html')
      ? `./${fichier.slice(0, -'index.html'.length)}`
      : `./${fichier}`

/**
 * Réécrit `dist/sw.js` : identifiant de build + liste de pré-cache.
 *
 * Pourquoi ici et pas dans le fichier source ? `public/sw.js` est copié tel
 * quel par Vite, jamais transformé : ni `define`, ni `import.meta.env` ne
 * l'atteignent. Le hook `closeBundle` passe APRÈS la copie de public/ (Vite
 * la fait dans prepareOutDir, avant même le bundle) : on relit donc le
 * dossier livré, ce qui donne du même coup l'inventaire à pré-cacher.
 *
 * L'identifiant dérive du CONTENU de dist (hash de chaque fichier) : il change
 * dès qu'un octet livré change, et seulement alors. Plus de numéro à bumper
 * à la main — l'oubli devient impossible.
 */
function serviceWorkerRihla() {
  let config
  return {
    name: 'rihla-sw',
    apply: 'build',
    configResolved(c) {
      config = c
    },
    closeBundle() {
      const sortie = resolve(config.root, config.build.outDir)
      const sw = join(sortie, 'sw.js')
      let source
      try {
        source = readFileSync(sw, 'utf8')
      } catch {
        this.error(`sw.js absent de ${sortie} — public/sw.js a-t-il été déplacé ?`)
      }

      // Ni le SW lui-même (il porte le hash), ni ce que l'app ne charge jamais
      // (licence des polices, icône App Store) : chaque octet pré-caché est
      // re-téléchargé à chaque build.
      const HORS_CACHE = new Set(['sw.js', 'polices/LICENCE.txt', 'icons/icon-1024.png'])
      const fichiers = listerFichiers(sortie)
        .filter((f) => !HORS_CACHE.has(f))
        .sort()
      const version = JSON.parse(readFileSync(resolve(config.root, 'package.json'), 'utf8')).version
      const build = `${version}-${empreinte(
        fichiers.map((f) => `${f}:${empreinte(readFileSync(join(sortie, f)))}`).join('\n')
      ).slice(0, 12)}`
      const precache = [...new Set(fichiers.map(urlPublique))]

      if (!MARQUE_BUILD.test(source) || !MARQUE_PRECACHE.test(source))
        this.error(
          "public/sw.js n'expose plus `const BUILD = '…'` et `const PRECACHE = […]` : " +
            "l'identifiant de build ne peut plus être injecté, le cache resterait figé."
        )

      writeFileSync(
        sw,
        source
          .replace(MARQUE_BUILD, `const BUILD = '${build}'`)
          .replace(MARQUE_PRECACHE, `const PRECACHE = ${JSON.stringify(precache)}`)
      )
      config.logger.info(`sw.js  build ${build} · ${precache.length} fichiers pré-cachés`)
    },
  }
}

export default defineConfig({
  // Base relative : l'app se déploie n'importe où (racine, sous-chemin
  // GitHub Pages /rihla/, WebView Capacitor) sans retoucher les chemins.
  base: './',
  plugins: [react(), serviceWorkerRihla()],
  server: { port: 5183, strictPort: true },
})
