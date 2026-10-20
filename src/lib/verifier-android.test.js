import { spawn } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'

/**
 * `scripts/verifier-android.mjs synchro` refuse ce qui ne doit pas partir sur Google Play.
 *
 * Le script lit le projet à côté de lui : on le recopie dans un dossier jetable avec le manifeste, les
 * icônes et la configuration RÉELS d'`android/` (ce sont eux qu'on garde), un faux `dist/` et sa copie dans
 * `assets/public`, et on le LANCE — son code de sortie et son message sont ce qu'on vérifie. Chaque test
 * abîme UNE chose dans cette copie ; le témoin, lui, doit passer : sans lui, un script qui refuserait tout
 * ferait réussir chaque test.
 *
 * Le volet `livrable` (manifeste fusionné de l'APK, signature) a besoin d'un vrai APK signé : il se rejoue
 * à la main avec une clé jetable, docs/google-play.md § 6.
 */

const RACINE = resolve(import.meta.dirname, '..', '..')
const MAIN = 'android/app/src/main'
const dossiers = []

afterAll(() => {
  for (const d of dossiers) rmSync(d, { recursive: true, force: true })
})

/** Remplace `de` par `par` dans un fichier du projet jetable ; échoue si `de` n'y est pas (sabotage vain). */
function remplacer(racine, fichier, de, par) {
  const f = join(racine, fichier)
  const texte = readFileSync(f, 'utf8')
  if (!texte.includes(de)) throw new Error(`${fichier} : « ${de} » introuvable — le test n'abîmerait rien`)
  writeFileSync(f, texte.replace(de, par))
}

/** Un projet Android jetable, sain ; `abimer(racine)` en casse une chose avant le lancement. */
async function verifier(abimer = () => {}, etape = 'synchro') {
  const racine = mkdtempSync(join(tmpdir(), 'rihla-verif-'))
  dossiers.push(racine)
  mkdirSync(join(racine, 'scripts'))
  cpSync(join(RACINE, 'scripts/verifier-android.mjs'), join(racine, 'scripts/verifier-android.mjs'))

  // Ce qu'on garde tel quel : manifeste, icônes et leurs ressources, icône de la fiche Google Play.
  mkdirSync(join(racine, MAIN), { recursive: true })
  cpSync(join(RACINE, MAIN, 'AndroidManifest.xml'), join(racine, MAIN, 'AndroidManifest.xml'))
  cpSync(join(RACINE, MAIN, 'res'), join(racine, MAIN, 'res'), { recursive: true })
  cpSync(join(RACINE, MAIN, 'ic_launcher-playstore.png'), join(racine, MAIN, 'ic_launcher-playstore.png'))
  cpSync(join(RACINE, 'android/version.properties'), join(racine, 'android/version.properties'))

  // Un dist/ factice, et sa copie dans le projet natif (+ les deux fichiers que `cap sync` ajoute lui-même).
  mkdirSync(join(racine, 'dist/assets'), { recursive: true })
  writeFileSync(join(racine, 'dist/index.html'), '<!doctype html><title>Rihla</title>')
  writeFileSync(join(racine, 'dist/assets/app-1.js'), 'console.log("Rihla")')
  cpSync(join(racine, 'dist'), join(racine, MAIN, 'assets/public'), { recursive: true })
  writeFileSync(join(racine, MAIN, 'assets/public/cordova.js'), '// pont Cordova')
  writeFileSync(join(racine, MAIN, 'assets/public/cordova_plugins.js'), '// greffons')
  writeFileSync(join(racine, MAIN, 'assets/capacitor.config.json'), JSON.stringify({ appId: 'ma.rihla.app', appName: 'Rihla', webDir: 'dist' }))

  abimer(racine)
  return new Promise((resolvePromesse, rejeter) => {
    const enfant = spawn(process.execPath, [join(racine, 'scripts/verifier-android.mjs'), etape], { cwd: racine })
    let sortie = ''
    enfant.stdout.on('data', (d) => (sortie += d.toString()))
    enfant.stderr.on('data', (d) => (sortie += d.toString()))
    enfant.on('error', rejeter)
    enfant.on('close', (code) => resolvePromesse({ code, sortie }))
  })
}

/** Le script doit REFUSER (code 1) en nommant `message`. */
async function refuse(abimer, message, etape) {
  const r = await verifier(abimer, etape)
  expect(r.sortie).toContain(message)
  expect(r.code).toBe(1)
}

describe('verifier-android synchro : ce qui ne doit pas partir sur Google Play', () => {
  it('témoin : le manifeste, les icônes et la configuration réels, avec un dist/ copié, passent', async () => {
    const r = await verifier()
    expect(r.sortie).toContain('rien à refuser')
    expect(r.code).toBe(0)
  })

  it('refuse sans étape (le script ne devine pas ce qu’on lui demande de juger)', async () => {
    const r = await verifier(() => {}, '')
    expect(r.code).toBe(2)
  })

  describe('manifeste', () => {
    it('allowBackup="true" : le progrès partirait dans une sauvegarde Google Drive', async () => {
      await refuse((d) => remplacer(d, `${MAIN}/AndroidManifest.xml`, 'android:allowBackup="false"', 'android:allowBackup="true"'), 'allowBackup="false" attendu')
    })

    it('plus de dataExtractionRules : le transfert d’appareil à appareil (Android 12+) copierait le progrès', async () => {
      await refuse((d) => remplacer(d, `${MAIN}/AndroidManifest.xml`, 'android:dataExtractionRules="@xml/data_extraction_rules"', ''), 'dataExtractionRules attendu')
    })

    it('usesCleartextTraffic="true" : du HTTP en clair', async () => {
      await refuse((d) => remplacer(d, `${MAIN}/AndroidManifest.xml`, 'android:allowBackup="false"', 'android:allowBackup="false" android:usesCleartextTraffic="true"'), 'usesCleartextTraffic="true" interdit')
    })

    it('INTERNET n’est plus retirée : le greffon ou le modèle la reposerait dans le manifeste fusionné', async () => {
      await refuse(
        (d) => remplacer(d, `${MAIN}/AndroidManifest.xml`, '<uses-permission android:name="android.permission.INTERNET" tools:node="remove" />', ''),
        'android.permission.INTERNET doit être RETIRÉE',
      )
    })

    it('SCHEDULE_EXACT_ALARM n’est plus retirée : Google Play la réserve aux applications d’alarme', async () => {
      await refuse(
        (d) => remplacer(d, `${MAIN}/AndroidManifest.xml`, '<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" tools:node="remove" />', ''),
        'android.permission.SCHEDULE_EXACT_ALARM doit être RETIRÉE',
      )
    })

    it('une autorisation nouvelle, non justifiée dans le script', async () => {
      await refuse(
        (d) => remplacer(d, `${MAIN}/AndroidManifest.xml`, '</manifest>', '<uses-permission android:name="android.permission.CAMERA" /></manifest>'),
        'autorisation android.permission.CAMERA non justifiée',
      )
    })

    it('une autorisation commentée n’est pas une autorisation (les commentaires du manifeste la citent)', async () => {
      const r = await verifier((d) => remplacer(d, `${MAIN}/AndroidManifest.xml`, '</manifest>', '<!-- <uses-permission android:name="android.permission.CAMERA" /> --></manifest>'))
      expect(r.code).toBe(0)
    })
  })

  describe('aucun serveur embarqué', () => {
    it('l’adresse du serveur de duels dans un bundle copié (VITE_RIHLA_SERVEUR laissée dans .env)', async () => {
      await refuse(
        (d) => writeFileSync(join(d, MAIN, 'assets/public/assets/app-1.js'), 'fetch("https://rihla-serveur.exemple.workers.dev")'),
        'embarque l\'adresse du serveur de duels',
      )
    })

    it('server.url dans la configuration Capacitor : l’application chargerait un site distant', async () => {
      await refuse(
        (d) => writeFileSync(join(d, MAIN, 'assets/capacitor.config.json'), JSON.stringify({ appId: 'ma.rihla.app', server: { url: 'http://192.168.1.5:5183' } })),
        'server.url (http://192.168.1.5:5183)',
      )
    })

    it('un autre identifiant d’application dans la configuration', async () => {
      await refuse((d) => writeFileSync(join(d, MAIN, 'assets/capacitor.config.json'), JSON.stringify({ appId: 'com.exemple.autre' })), 'appId « com.exemple.autre » ≠ ma.rihla.app')
    })
  })

  describe('c’est bien dist/ qui est parti dans le projet natif', () => {
    it('un fichier de dist/ que la synchro n’a pas copié', async () => {
      await refuse((d) => writeFileSync(join(d, 'dist/assets/nouveau-2.js'), 'console.log("neuf")'), 'assets/public ne contient pas assets/nouveau-2.js')
    })

    it('un fichier copié qui diffère de dist/ (dist/ reconstruit, synchro oubliée)', async () => {
      await refuse((d) => writeFileSync(join(d, 'dist/assets/app-1.js'), 'console.log("Rihla v2")'), 'assets/public/assets/app-1.js diffère de dist/assets/app-1.js')
    })

    it('un reste d’ancienne synchro dans le projet natif', async () => {
      await refuse((d) => writeFileSync(join(d, MAIN, 'assets/public/assets/ancien-0.js'), 'console.log("vieux")'), 'assets/public/assets/ancien-0.js n\'existe pas dans dist/')
    })

    it('un projet natif jamais synchronisé (assets/public absent)', async () => {
      await refuse((d) => rmSync(join(d, MAIN, 'assets'), { recursive: true }), 'assets/public est vide')
    })
  })

  describe('versions', () => {
    it('versionName Android ≠ MARKETING_VERSION d’iOS : deux numéros différents pour la même app', async () => {
      await refuse((d) => {
        mkdirSync(join(d, 'ios/App/App.xcodeproj'), { recursive: true })
        writeFileSync(join(d, 'ios/App/App.xcodeproj/project.pbxproj'), 'MARKETING_VERSION = 9.9;\n')
      }, 'MARKETING_VERSION iOS « 9.9 »')
    })

    it('même version des deux côtés : rien à dire', async () => {
      const version = /^versionName=(.+)$/m.exec(readFileSync(join(RACINE, 'android/version.properties'), 'utf8'))[1].trim()
      const r = await verifier((d) => {
        mkdirSync(join(d, 'ios/App/App.xcodeproj'), { recursive: true })
        writeFileSync(join(d, 'ios/App/App.xcodeproj/project.pbxproj'), `MARKETING_VERSION = ${version};\n`)
      })
      expect(r.code).toBe(0)
    })

    it('versionCode illisible', async () => {
      await refuse((d) => remplacer(d, 'android/version.properties', 'versionCode=1', 'versionCode=zéro'), 'versionCode « NaN » illisible')
    })
  })

  describe('images', () => {
    it('une icône à la mauvaise taille', async () => {
      await refuse(
        (d) => cpSync(join(d, MAIN, 'res/mipmap-mdpi/ic_launcher.png'), join(d, MAIN, 'res/mipmap-xhdpi/ic_launcher.png')),
        'res/mipmap-xhdpi/ic_launcher.png : 48×48, attendu 96×96',
      )
    })

    it('une icône manquante', async () => {
      await refuse((d) => rmSync(join(d, MAIN, 'res/drawable-xxhdpi/lancement.png')), 'res/drawable-xxhdpi/lancement.png manquant ou illisible')
    })

    it('un avant-plan adaptatif sans canal alpha : son carré plein masquerait le fond de l’icône', async () => {
      await refuse((d) => {
        const f = join(d, MAIN, 'res/mipmap-hdpi/ic_launcher_foreground.png')
        const png = readFileSync(f)
        png[25] = 2 // type de couleur de l'IHDR : RVB, sans alpha
        writeFileSync(f, png)
      }, 'res/mipmap-hdpi/ic_launcher_foreground.png : PNG sans canal alpha')
    })

    it('l’icône de la fiche Google Play sans canal alpha : Google exige un PNG 32 bits', async () => {
      await refuse((d) => {
        const f = join(d, MAIN, 'ic_launcher-playstore.png')
        const png = readFileSync(f)
        png[25] = 2
        writeFileSync(f, png)
      }, 'canal alpha absent')
    })

    it('l’icône de la fiche Google Play à la mauvaise taille', async () => {
      await refuse((d) => cpSync(join(d, MAIN, 'res/mipmap-xxxhdpi/ic_launcher_foreground.png'), join(d, MAIN, 'ic_launcher-playstore.png')), '512 × 512 attendu')
    })
  })

  describe('livrable', () => {
    it('sans APK ni bundle construits, il le dit au lieu d’affirmer qu’il n’y a rien à refuser', async () => {
      const r = await verifier(() => {}, 'livrable')
      expect(r.sortie).toContain('introuvable : pnpm android:release')
      expect(r.code).toBe(1)
    })
  })
})

describe('le projet réel', () => {
  it('versionName et versionCode lisibles, comme build.gradle les lit', () => {
    const t = readFileSync(join(RACINE, 'android/version.properties'), 'utf8')
    expect(t).toMatch(/^versionName=\d+\.\d+(\.\d+)?$/m)
    expect(t).toMatch(/^versionCode=[1-9]\d*$/m)
  })

  it('la clé d’importation du propriétaire est ignorée de git, et aucun mot de passe n’est écrit dans build.gradle', () => {
    // Le fichier lui-même existe sur la machine du propriétaire : c'est son .gitignore qu'on contrôle.
    const ignores = readFileSync(join(RACINE, '.gitignore'), 'utf8').split('\n').map((l) => l.trim())
    for (const motif of ['android/keystore.properties', '*.jks', '*.keystore']) expect(ignores).toContain(motif)
    const gradle = readFileSync(join(RACINE, 'android/app/build.gradle'), 'utf8')
    expect(gradle).not.toMatch(/storePassword\s*[= ]\s*["'][^"']+["']/)
    expect(gradle).not.toMatch(/keyPassword\s*[= ]\s*["'][^"']+["']/)
  })
})
