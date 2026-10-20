import { afterEach, describe, expect, it, vi } from 'vitest'

const setStyle = vi.hoisted(() => vi.fn(() => Promise.resolve()))
vi.mock('@capacitor/core', () => ({ SystemBars: { setStyle } }))

import { styleBarres, suivreBarres } from './barres.js'

describe('style des barres système d’Android', () => {
  it('« sombre » impose des icônes claires, même sur un téléphone en mode clair', () => {
    expect(styleBarres('sombre', false)).toBe('DARK')
    expect(styleBarres('sombre', true)).toBe('DARK')
  })

  it('« clair » impose des icônes sombres, même sur un téléphone en mode nuit', () => {
    expect(styleBarres('clair', true)).toBe('LIGHT')
    expect(styleBarres('clair', false)).toBe('LIGHT')
  })

  it('« auto » suit le système', () => {
    expect(styleBarres('auto', true)).toBe('DARK')
    expect(styleBarres('auto', false)).toBe('LIGHT')
  })
})

/** Un `window` minimal : la plateforme de Capacitor et un media query de thème qu'on peut basculer. */
function fenetre(plateforme, nuit = false) {
  const ecouteurs = new Set()
  const systeme = {
    matches: nuit,
    addEventListener: vi.fn((_, f) => ecouteurs.add(f)),
    removeEventListener: vi.fn((_, f) => ecouteurs.delete(f)),
  }
  vi.stubGlobal('window', {
    Capacitor: { getPlatform: () => plateforme },
    matchMedia: () => systeme,
  })
  return {
    systeme,
    basculer(valeur) {
      systeme.matches = valeur
      for (const f of ecouteurs) f()
    },
  }
}
// Le style est posé après un `import()` dynamique : le délai dépend de la charge de la machine. Pour ce qui DOIT
// arriver, on attend l'appel (vi.waitFor) ; pour ce qui ne doit PAS arriver, on laisse largement le temps.
const laisserPasser = () => new Promise((r) => setTimeout(r, 80))

describe('suivreBarres', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    setStyle.mockClear()
  })

  it('ne fait rien hors d’Android : ni sans fenêtre, ni sur le web, ni sur l’iPhone', async () => {
    expect(suivreBarres('sombre')).toBeUndefined()
    for (const plateforme of ['web', 'ios']) {
      fenetre(plateforme, true)
      expect(suivreBarres('auto')).toBeUndefined()
    }
    await laisserPasser()
    expect(setStyle).not.toHaveBeenCalled()
  })

  it('Android, thème explicite : pose le style tout de suite et n’écoute pas le système', async () => {
    const f = fenetre('android', false)
    expect(suivreBarres('sombre')).toBeUndefined()
    await vi.waitFor(() => expect(setStyle).toHaveBeenCalledWith({ style: 'DARK' }))
    await laisserPasser()
    expect(setStyle).toHaveBeenCalledTimes(1)
    expect(f.systeme.addEventListener).not.toHaveBeenCalled()
  })

  it('Android, « auto » : suit le système en direct, puis s’arrête quand on le demande', async () => {
    const f = fenetre('android', false)
    const arreter = suivreBarres('auto')
    await vi.waitFor(() => expect(setStyle).toHaveBeenLastCalledWith({ style: 'LIGHT' }))

    f.basculer(true)
    await vi.waitFor(() => expect(setStyle).toHaveBeenLastCalledWith({ style: 'DARK' }))

    arreter()
    expect(f.systeme.removeEventListener).toHaveBeenCalledTimes(1)
    const appels = setStyle.mock.calls.length
    f.basculer(false)
    await laisserPasser()
    expect(setStyle.mock.calls.length).toBe(appels)
  })
})
