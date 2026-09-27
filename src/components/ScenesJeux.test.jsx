// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LANGUES } from '../data/langues.js'
import { getDictionary } from '../i18n.js'
import { CreditPhoto, CreditsPhotos, ImageVille } from './ImageVille.jsx'
import { FinDeJeu } from './FinDeJeu.jsx'
import { DELAI_ENVOL, DELAI_FIN, DELAI_PAIRE, JeuZellige } from './JeuZellige.jsx'
import { JeuCaravane } from './JeuCaravane.jsx'
import { JeuSouk } from './JeuSouk.jsx'
import { courseAstre } from './Paysages.jsx'
import { CielDuSouk, DosZellige, PisteCaravane, TEINTES_ZELLIGE, avanceeCaravane, momentDuSouk, teinteZellige } from './ScenesJeux.jsx'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const t = getDictionary('fr')
const es = LANGUES.find((l) => l.id === 'es')
// Sous jsdom, import.meta.url n'est pas une adresse de fichier : on part du dossier du projet.
const CSS = readFileSync(resolve(process.cwd(), 'src/styles.css'), 'utf8')
const PHOTO = {
  url: '/assets/es-abc12345.webp',
  auteur: 'Diego Delso',
  licence: 'CC BY-SA 4.0',
  licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
  source: 'https://commons.wikimedia.org/wiki/File:Granada.jpg',
  cadrage: '50% 30%',
  fr: 'L’Alhambra',
  ar: 'قصر الحمراء',
}

const montes = []
function monter(element) {
  const conteneur = document.createElement('div')
  document.body.appendChild(conteneur)
  const racine = createRoot(conteneur)
  act(() => racine.render(element))
  montes.push({ conteneur, racine })
  return conteneur
}
const clic = (element) => act(() => element.click())

afterEach(() => {
  for (const { racine, conteneur } of montes.splice(0)) {
    act(() => racine.unmount())
    conteneur.remove()
  }
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('l’image d’une ville', () => {
  it('pose la photo sur le paysage, et ne la montre qu’une fois chargée', () => {
    const vue = monter(<ImageVille langue={es} photo={PHOTO} />)
    // Le paysage est là tout de suite : il donne la hauteur, il fait patienter.
    expect(vue.querySelector('.image-ville .paysage')).not.toBeNull()
    const img = vue.querySelector('img.image-ville__photo')
    expect(img.getAttribute('src')).toBe(PHOTO.url)
    expect(img.getAttribute('alt')).toBe('')
    expect(img.style.objectPosition).toBe('50% 30%')
    expect(img.classList.contains('image-ville__photo--prete')).toBe(false)
    act(() => img.dispatchEvent(new Event('load')))
    expect(vue.querySelector('img').classList.contains('image-ville__photo--prete')).toBe(true)
    expect(vue.querySelector('.paysage')).not.toBeNull()
  })

  it('retombe sur le paysage dessiné si la photo ne se charge pas — jamais un cadre vide', () => {
    const vue = monter(<ImageVille langue={es} photo={PHOTO} format="bandeau" />)
    act(() => vue.querySelector('img').dispatchEvent(new Event('error')))
    expect(vue.querySelector('img')).toBeNull()
    expect(vue.querySelector('.paysage').getAttribute('viewBox')).toBe('0 0 320 112')
  })

  it('sans photo, c’est le paysage seul', () => {
    const vue = monter(<ImageVille langue={es} photo={null} />)
    expect(vue.querySelector('img')).toBeNull()
    expect(vue.querySelector('.paysage')).not.toBeNull()
  })

  it('crédite l’auteur et la licence, avec leurs liens — et rien sans photo', () => {
    const html = renderToStaticMarkup(<CreditPhoto t={t} photo={PHOTO} />)
    expect(html).toContain('Photo :')
    expect(html).toContain(`href="${PHOTO.source}"`)
    expect(html).toContain('Diego Delso')
    expect(html).toContain(`href="${PHOTO.licenceUrl}"`)
    expect(html).toContain('rel="license noopener noreferrer"')
    expect(html).toContain('CC BY-SA 4.0')
    expect(html).toContain('(recadrée)')
    expect(renderToStaticMarkup(<CreditPhoto t={t} photo={null} />)).toBe('')
    expect(renderToStaticMarkup(<CreditPhoto t={t} photo={{ ...PHOTO, licence: 'Domaine public' }} />)).toContain('domaine public')
    // La liste des Réglages : une ligne par photo livrée, aucune carte sans photo.
    expect(renderToStaticMarkup(<CreditsPhotos t={t} locale="fr" photos={[]} />)).toBe('')
    const liste = renderToStaticMarkup(<CreditsPhotos t={t} locale="fr" photos={[{ langue: es, photo: PHOTO }]} />)
    expect(liste).toContain('Grenade')
    expect(liste).toContain('L’Alhambra')
    expect(liste).toContain('<details')
  })

  it('se voile la nuit, dans les DEUX modes nuit (choisi et automatique)', () => {
    expect(CSS).toMatch(/\[data-theme='sombre'\] \.image-ville__photo\s*\{\s*filter:/)
    expect(CSS).toMatch(/:root:not\(\[data-theme='clair'\]\) \.image-ville__photo\s*\{\s*filter:/)
  })
})

describe('les décors des jeux', () => {
  it('le Souk : le jour passe avec le chrono, et le soleil va d’un horizon à l’autre', () => {
    expect(momentDuSouk(45, 45)).toBe('aube')
    expect(momentDuSouk(25, 45)).toBe('jour')
    expect(momentDuSouk(5, 45)).toBe('crepuscule')
    expect(momentDuSouk(0, 45)).toBe('crepuscule')
    const debut = courseAstre('bandeau', 0)
    const zenith = courseAstre('bandeau', 0.5)
    const fin = courseAstre('bandeau', 1)
    // Au plus haut à mi-course ; aux deux bouts, à la même hauteur (l'horizon).
    expect(zenith.dy).toBeLessThan(debut.dy)
    expect(debut.dy).toBe(fin.dy)
    expect(debut.dx).toBeLessThan(zenith.dx)
    expect(zenith.dx).toBeLessThan(fin.dx)
    // Hors bornes, la course s'arrête aux horizons.
    expect(courseAstre('bandeau', 2)).toEqual(fin)
    const html = renderToStaticMarkup(<CielDuSouk langue={es} reste={5} duree={45} />)
    expect(html).toContain('paysage--crepuscule')
    expect(html).toContain('paysage__course')
    expect(html).toContain('aria-hidden="true"')
  })

  it('la Caravane : elle avance d’un mot à l’autre, jusqu’aux portes de la ville', () => {
    expect(avanceeCaravane(0, 8)).toBe(0)
    expect(avanceeCaravane(4, 8)).toBe(0.5)
    expect(avanceeCaravane(8, 8)).toBe(1)
    expect(avanceeCaravane(9, 8)).toBe(1)
    expect(avanceeCaravane(1, 0)).toBe(0)
    const position = (etape) => Number(renderToStaticMarkup(<PisteCaravane langue={es} etape={etape} total={8} />).match(/translateX\((\d+)px\)/)[1])
    expect(position(0)).toBeLessThan(position(4))
    expect(position(4)).toBeLessThan(position(8))
    const html = renderToStaticMarkup(<PisteCaravane langue={es} etape={8} total={8} />)
    // Trois bêtes, le monument de la ville au bout, et aucune couleur en dur.
    expect(html.match(/caravane__bete/g)).toHaveLength(4)
    expect(html).toContain('viewBox="0 0 64 64"')
    expect(html).toContain('paysage--crepuscule')
    expect(html).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })

  it('le Zellige : quatre teintes en diagonale, deux voisines jamais pareilles', () => {
    for (let i = 0; i < 12; i++) {
      expect(teinteZellige(i)).toBeGreaterThanOrEqual(0)
      expect(teinteZellige(i)).toBeLessThan(TEINTES_ZELLIGE)
      if (i % 3 < 2) expect(teinteZellige(i), `${i} et sa voisine de droite`).not.toBe(teinteZellige(i + 1))
      if (i + 3 < 12) expect(teinteZellige(i), `${i} et sa voisine du dessous`).not.toBe(teinteZellige(i + 3))
    }
    for (let teinte = 0; teinte < TEINTES_ZELLIGE; teinte++) {
      const html = renderToStaticMarkup(<DosZellige teinte={teinte} />)
      expect(html).toContain(`dos-zellige--${teinte}`)
      expect(html).not.toMatch(/#[0-9a-f]{3,8}\b/i)
    }
  })

  it('la fin d’un jeu est une carte postale de la ville, tamponnée', () => {
    const surQuitter = vi.fn()
    const surRejouer = vi.fn()
    const vue = monter(
      <FinDeJeu t={t} locale="fr" langue={es} titre="Bien joué" detail="6/6 paires" xp={40} surQuitter={surQuitter} surRejouer={surRejouer} />
    )
    expect(vue.querySelector('.carte-postale .image-ville')).not.toBeNull()
    expect(vue.querySelector('.carte-postale__legende').textContent).toBe('Grenade')
    expect(vue.querySelector('.eclat')).not.toBeNull()
    expect(vue.textContent).toContain(t.plusXp(40))
    clic(vue.querySelector('.bouton--primaire'))
    clic(vue.querySelector('.bouton--secondaire'))
    expect(surQuitter).toHaveBeenCalledTimes(1)
    expect(surRejouer).toHaveBeenCalledTimes(1)
    // Sans succès, pas d'éclat : un Souk sans une bonne réponse ne se fête pas.
    const triste = monter(<FinDeJeu t={t} locale="fr" langue={es} titre="x" detail="y" xp={0} succes={false} surQuitter={() => {}} surRejouer={() => {}} />)
    expect(triste.querySelector('.eclat')).toBeNull()
  })
})

describe('le Zellige des paires, joué', () => {
  beforeEach(() => vi.useFakeTimers())

  it('chaque paire trouvée s’envole et découvre l’image ; la dernière partie, la carte postale arrive et les XP tombent', () => {
    const surXp = vi.fn()
    const vue = monter(<JeuZellige t={t} locale="fr" source="fr" langue={es} surXp={surXp} surQuitter={() => {}} />)
    const tuiles = () => [...vue.querySelectorAll('.tuile')]
    expect(tuiles()).toHaveLength(12)
    expect(vue.querySelectorAll('.dos-zellige')).toHaveLength(12)
    expect(vue.querySelector('.zellige-plateau__image .image-ville')).not.toBeNull()

    // On retrouve les paires par les données : chaque mot a sa tuile « mot » et sa tuile « sens ».
    const mots = es.lecons.flatMap((l) => l.mots)
    const lire = () => {
      // Retourner deux tuiles les nomme (aria-label) ; on les laisse se refermer.
      const textes = []
      for (let i = 0; i < 12; i += 2) {
        clic(tuiles()[i])
        clic(tuiles()[i + 1])
        textes[i] = tuiles()[i].getAttribute('aria-label')
        textes[i + 1] = tuiles()[i + 1].getAttribute('aria-label')
        act(() => vi.advanceTimersByTime(3000))
      }
      return textes
    }
    const textes = lire()
    const parMot = {}
    textes.forEach((texte, i) => {
      const mot = mots.find((m) => m.t === texte || m.fr === texte)
      expect(mot, texte).toBeTruthy()
      ;(parMot[mot.id] ??= []).push(i)
    })
    const paires = Object.values(parMot).filter((p) => p.length === 2)

    // Une paire déjà trouvée pendant la lecture compte aussi : on joue les autres.
    for (const [a, b] of paires) {
      if (tuiles()[a].classList.contains('tuile--gagnee')) continue
      clic(tuiles()[a])
      clic(tuiles()[b])
      act(() => vi.advanceTimersByTime(DELAI_PAIRE))
      expect(tuiles()[a].classList.contains('tuile--gagnee')).toBe(true)
      // Pas encore envolée : on a le temps de relire la paire.
      expect(tuiles()[a].classList.contains('tuile--envolee')).toBe(false)
      act(() => vi.advanceTimersByTime(DELAI_ENVOL - DELAI_PAIRE))
      if (vue.querySelector('.tuile')) {
        expect(tuiles()[a].classList.contains('tuile--envolee')).toBe(true)
        expect(tuiles()[a].closest('.zellige-case').classList.contains('zellige-case--ouverte')).toBe(true)
        expect(tuiles()[a].getAttribute('aria-hidden')).toBe('true')
      }
    }
    // Tout est trouvé : l'image entière se regarde, puis la carte postale.
    expect(surXp).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(DELAI_FIN))
    expect(surXp).toHaveBeenCalledTimes(1)
    expect(surXp.mock.calls[0][0]).toBeGreaterThanOrEqual(30)
    expect(vue.querySelector('.carte-postale')).not.toBeNull()
    expect(vue.textContent).toContain(t.jeux.bienJoue)
  })
})

describe('le Souk et la Caravane, à l’écran', () => {
  it('le Souk montre le ciel de la ville, et trois étals', () => {
    const vue = monter(<JeuSouk t={t} locale="fr" source="fr" langue={es} surXp={() => {}} surQuitter={() => {}} />)
    expect(vue.querySelector('.scene-jeu .paysage--aube')).not.toBeNull()
    expect(vue.querySelectorAll('.etal')).toHaveLength(3)
    // Le décor n'entre pas dans la carte de l'énoncé (le test de la tortue s'y fie).
    expect(vue.querySelector('.carte .paysage')).toBeNull()
  })

  it('la Caravane part du bord de la piste', () => {
    const vue = monter(<JeuCaravane t={t} locale="fr" source="fr" langue={es} surXp={() => {}} surQuitter={() => {}} />)
    expect(vue.querySelector('.scene-caravane')).not.toBeNull()
    expect(vue.querySelector('.caravane').style.transform).toBe('translateX(6px)')
    expect(vue.textContent).toContain(t.jeux.motSur(1, 8))
  })
})
