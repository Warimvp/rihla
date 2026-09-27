// Un mot dans la langue CIBLE, affiché dans une interface qui peut être en
// arabe (RTL). Deux attributs, rien d'autre :
//
// - `dir="auto"` : la direction se déduit du texte lui-même et non du
//   paragraphe. Sans lui, la ponctuation neutre qui borde 600 mots latins
//   (« ¿Cómo estás? », « Me llamo… ») suit la direction de la page et le `¿`
//   se retrouve à droite sous interface arabe.
// - `lang` : le code BCP-47 déjà porté par la donnée (`langue.tts`, ex.
//   'es-ES'). Il corrige au passage la voix de VoiceOver et le choix de
//   police du navigateur (Han unifié : zh-CN et ja-JP n'ont pas les mêmes
//   glyphes).
//
// Purement présentationnel : aucun état, aucune logique métier. Le SENS d'un
// mot ne passe pas par <MotCible> — il suit la langue des définitions, pas la
// langue cible — mais par <Sens>, plus bas, qui l'isole de la même façon.

import { langueDuSens, sensPour } from '../i18n.js'

// Le code de langue à poser en `lang`. Accepte l'objet langue ou directement
// un code ; `undefined` (donc pas d'attribut) si rien d'exploitable.
const propre = (valeur) => (typeof valeur === 'string' && valeur.trim() ? valeur.trim() : undefined)

export function codeLangue(langue) {
  if (!langue) return undefined
  if (typeof langue === 'string') return propre(langue)
  return propre(langue.tts) ?? propre(langue.id)
}

// `balise` : 'bdi' (inline, par défaut — isole aussi le mot de ce qui suit
// dans le même conteneur, romanisation comprise) ou 'div' pour un bloc.
export function MotCible({ texte, langue, balise: Balise = 'bdi', ...reste }) {
  return (
    <Balise dir="auto" lang={codeLangue(langue)} {...reste}>
      {texte}
    </Balise>
  )
}

// La romanisation qui accompagne une écriture non latine : toujours en
// alphabet latin, souvent bordée de ponctuation (« kayfa hâluk ? »), donc
// exposée au même renversement en RTL. Pas de `lang` : ce n'est ni la langue
// cible ni celle de l'interface, une voix de synthèse la lirait de travers.
export function Romanisation({ texte, balise: Balise = 'bdi', className = 'romanisation', style, ...reste }) {
  const noyau = (
    <Balise dir="ltr" className={className} {...reste}>
      {texte}
    </Balise>
  )
  // Le style de placement (la marge, typiquement) ne vit PAS sur l'élément
  // dir="ltr" : une propriété logique s'y résout contre SA direction, et sous
  // interface arabe `margin-inline-start` tombait du côté extérieur — plus
  // d'espace entre le mot et sa romanisation. Un enrobage sans `dir` suit la
  // direction de la page.
  if (!style) return noyau
  const Enrobage = Balise === 'div' ? 'div' : 'span'
  return <Enrobage style={style}>{noyau}</Enrobage>
}

// Le SENS d'un mot, écrit dans la langue des définitions — qui n'est pas
// toujours celle de l'interface : à Paris les sens sont en arabe sous interface
// française, au Caire en français sous interface arabe, et le réglage « Langue
// des définitions » les découple partout ailleurs. Posé nu, « اسمي… » prenait
// ses points de suspension à droite et « Où est… ? » son point d'interrogation
// à gauche. Même remède que pour le mot cible : `dir="auto"` + `lang`.
//
// - `mot`, `source`, `langue` (la destination : l'objet ou son id) : le texte
//   ET sa langue sortent de la même règle (`langueDuSens`), ils ne peuvent pas
//   se contredire. Ne jamais poser `sensPour(...)` nu dans le JSX ; la chaîne
//   reste pour ce qui n'est pas affiché (aria-label, `etiquette`, comparaison).
// - Toujours en ligne (<bdi>), jamais un bloc : seul l'ordre des caractères
//   change, le conteneur reste aligné comme l'interface — une option dont le
//   sens est arabe commence toujours au début de la ligne française.
export function Sens({ mot, source, langue, ...reste }) {
  const destination = typeof langue === 'string' ? langue : langue?.id
  return (
    <bdi dir="auto" lang={langueDuSens(source, destination)} {...reste}>
      {sensPour(mot, source, destination)}
    </bdi>
  )
}
