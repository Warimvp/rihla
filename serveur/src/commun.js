// Partagé par le routeur et les Durable Objects. Séparé d'index.js parce que
// le module d'entrée d'un Worker ne peut exporter que le gestionnaire par
// défaut et des classes : workerd refuse toute autre valeur nommée.
import { LANGUES } from '../../src/data/langues.js'
import { TOUTE_LA_ROUTE } from '../../src/lib/barid.js'
import { genererCode } from '../../src/lib/salle.js'

export const VERSION = '1'

const TYPES_CLASSEMENT = { jour: /^\d{4}-\d{2}-\d{2}$/, semaine: /^\d{4}-W\d{2}$/ }

export const langueConnue = (langue) => langue === TOUTE_LA_ROUTE || LANGUES.some((l) => l.id === langue)

export const cleClassementValide = (type, cle) => Boolean(TYPES_CLASSEMENT[type]?.test(String(cle ?? '')))

// Un hasard cryptographique : Math.random n'est pas garanti dans un Worker
// au moment de la construction du module.
export const alea = () => {
  const t = new Uint32Array(1)
  crypto.getRandomValues(t)
  return t[0] / 4294967296
}

// Un code libre : on tire jusqu'à tomber sur une salle vierge (la collision
// est rarissime, mais une salle en cours ne doit jamais être écrasée).
export async function ouvrirSalle(env, langue) {
  for (let essai = 0; essai < 8; essai++) {
    const code = genererCode(alea)
    const ok = await env.SALLE.getByName(code).initialiser(langue)
    if (ok) return code
  }
  return null
}
