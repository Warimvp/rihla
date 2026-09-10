// Vignettes de destination : un dessin par VILLE, jamais par langue ni par
// pays — le monument est la ville. Trois règles, parce que l'app refuse les
// drapeaux et qu'un écusson aux couleurs d'un pays en est un :
//   1. un monument d'avant le 20e siècle (la liberté de panorama varie) ;
//   2. aucun emblème ni couleur nationale — tout est en currentColor ;
//   3. aucun décalque d'un pictogramme existant.
// Saraï, rasée en 1395, n'a laissé aucun monument : la vignette assume la
// steppe qu'Ibn Battuta a vue — une yourte au bord de la Volga.
//
// Grille 64, trait 2, bouts ronds, comme Icones.jsx. Les vignettes servent au
// tampon du passeport (qui les colore avec son encre) et au carnet de route.

const Vignette = ({ taille = 64, trait = 2, titre, className, style, x, y, children }) => (
  <svg
    x={x}
    y={y}
    width={taille}
    height={taille}
    viewBox="0 0 64 64"
    fill="none"
    stroke="currentColor"
    strokeWidth={trait}
    strokeLinecap="round"
    strokeLinejoin="round"
    role={titre ? 'img' : undefined}
    aria-label={titre}
    aria-hidden={titre ? undefined : true}
    className={className}
    style={style}
  >
    {children}
  </svg>
)

// Grenade — l'Alhambra : arc outrepassé, créneaux, deux khatams.
const es = (
  <>
    <path d="M11 24v30M53 24v30" />
    <path d="M9 24h46" />
    <path d="M12.5 24v-3h3v-3h3v3h3v3M22.5 24v-3h3v-3h3v3h3v3M32.5 24v-3h3v-3h3v3h3v3M42.5 24v-3h3v-3h3v3h3v3" />
    <path d="M24.6 46.9a10.5 10.5 0 1 1 14.8 0" />
    <path d="M24.6 46.9V54M39.4 46.9V54" />
    <path d="M7 54h50" />
    <g fill="currentColor" stroke="none">
      <rect x="14" y="31.5" width="5" height="5" />
      <rect x="14" y="31.5" width="5" height="5" transform="rotate(45 16.5 34)" />
      <rect x="45" y="31.5" width="5" height="5" />
      <rect x="45" y="31.5" width="5" height="5" transform="rotate(45 47.5 34)" />
    </g>
  </>
)

// Lisbonne — la tour de Belém, au bord du Tage.
const pt = (
  <>
    <path d="M18 54V26h20v28M22 26v-4h12v4" />
    <path d="M24 21v-3h3v-3h3v3h3v3" />
    <path d="M23 33h10M23 41h10" />
    <path d="M42 54V34h8v20M42 34l4-4 4 4" />
    <path d="M6 54h52" />
    <path d="M8 58h14M32 58h20" opacity=".5" />
  </>
)

// Venise — le campanile et la coupole, sur la lagune.
const it = (
  <>
    <path d="M14 50V18l4-6 4 6v32" />
    <path d="M14 24h8" />
    <path d="M30 50V34a8 8 0 0 1 16 0v16" />
    <path d="M30 34h16M34 50V40h8v10" />
    <path d="M38 26v-4" />
    <path d="M8 50h48" />
    <path d="M10 56c6-3 12 3 18 0s12 3 18 0" opacity=".5" />
  </>
)

// Vienne — la flèche de Stephansdom.
const de = (
  <>
    <path d="M20 54V30l6-16 6 16v24" />
    <path d="M20 38h12" />
    <path d="M26 14V9" />
    <path d="M38 54V34h10v20" />
    <path d="M38 34l5-6 5 6" />
    <path d="M41 44h4" />
    <path d="M8 54h48" />
  </>
)

// Londres — la tour de l'horloge.
const en = (
  <>
    <path d="M22 54V20h12v34" />
    <path d="M22 20l6-8 6 8" />
    <path d="M28 12V8" />
    <path d="M22 30h12M22 38h12" />
    <path d="M26 22h4" />
    <path d="M40 54V40h12v14" />
    <path d="M8 54h48" />
  </>
)

// Istanbul — coupole, semi-coupoles et deux minarets.
const tr = (
  <>
    <path d="M8 54V24l3-6 3 6v30M50 54V24l3-6 3 6v30" />
    <path d="M8 33h6M50 33h6" />
    <path d="M14 46a7 7 0 0 1 14 0M36 46a7 7 0 0 1 14 0" />
    <path d="M20 38a12 12 0 0 1 24 0" />
    <path d="M20 38v8M44 38v8" />
    <path d="M32 26v-3" />
    <path d="M14 46h36" />
    <path d="M6 54h52" />
    <g fill="currentColor" stroke="none">
      <circle cx="32" cy="21" r="1.5" />
    </g>
  </>
)

// Le Caire — les pyramides et un minaret.
const ar = (
  <>
    <path d="M6 52l16-24 16 24" />
    <path d="M22 52l12-18 12 18" opacity=".5" />
    <path d="M48 52V26l3-5 3 5v26" />
    <path d="M48 34h6" />
    <path d="M4 52h56" />
    <path d="M14 44h8" opacity=".5" />
  </>
)

// Saraï — une yourte sur la steppe, la Volga devant.
const ru = (
  <>
    <path d="M12 44a20 14 0 0 1 40 0" />
    <path d="M12 44h40" />
    <path d="M12 44v8h40v-8" />
    <path d="M28 52v-8h8v8" />
    <path d="M32 30v-5" />
    <path d="M18 38h28" opacity=".5" />
    <path d="M6 52h52" />
    <path d="M8 58c6-3 12 3 18 0s12 3 18 0" opacity=".5" />
  </>
)

// Ispahan — le pont aux trente-trois arches sur le Zayandeh.
const fa = (
  <>
    <path d="M4 28h56" />
    <path d="M8 28v-4h48v4" opacity=".5" />
    <path d="M4 34h56" />
    <path d="M6 46v-7a5 5 0 0 1 10 0v7M16 46v-7a5 5 0 0 1 10 0v7M26 46v-7a5 5 0 0 1 10 0v7M36 46v-7a5 5 0 0 1 10 0v7M46 46v-7a5 5 0 0 1 10 0v7" />
    <path d="M4 46h56" />
    <path d="M8 52c6-3 12 3 18 0s12 3 18 0 12 3 16 0" opacity=".5" />
  </>
)

// Mombasa — un boutre à voile latine.
const sw = (
  <>
    <path d="M32 46V12l16 22H32" />
    <path d="M32 46L18 30h14" opacity=".5" />
    <path d="M12 46h40l-6 8H18z" />
    <path d="M6 56c6-3 12 3 18 0s12 3 18 0 12 3 16 0" opacity=".5" />
  </>
)

// Delhi — le Qutub Minar.
const hi = (
  <>
    <path d="M24 54l3-38h10l3 38" />
    <path d="M26 44h12M27 34h10M28 24h8" />
    <path d="M27 16l5-6 5 6" />
    <path d="M12 54V44h8v10M44 54V44h8v10" opacity=".5" />
    <path d="M8 54h48" />
  </>
)

// Pékin — le temple du Ciel, trois toits.
const zh = (
  <>
    <path d="M8 26q24-8 48 0" />
    <path d="M14 26v6h36v-6" />
    <path d="M12 38q20-6 40 0" />
    <path d="M18 38v6h28v-6" />
    <path d="M14 44v10h36V44" />
    <path d="M27 54V46a5 5 0 0 1 10 0v8" />
    <path d="M6 54h52" />
  </>
)

// Séoul — une porte au toit relevé.
const ko = (
  <>
    <path d="M6 28q26-10 52 0" />
    <path d="M12 28l3 6h34l3-6" />
    <path d="M15 34v20M49 34v20" />
    <path d="M15 40h34" />
    <path d="M26 54V44a6 6 0 0 1 12 0v10" />
    <path d="M8 54h48" />
    <path d="M20 20h24" opacity=".5" />
  </>
)

// Tokyo — un torii, le Fuji dans l'encadrement.
const ja = (
  <>
    <path d="M22 54l9-16h2l9 16" opacity=".5" />
    <path d="M28 45l2 1.5 2-1.5 2 1.5 2-1.5" opacity=".5" />
    <path d="M9 21q23 5 46 0" />
    <path d="M12 27h40" />
    <path d="M32 27v8" />
    <path d="M17 35h30" />
    <path d="M21 27l-2 27M43 27l2 27" />
    <path d="M9 54h46" />
  </>
)

export const VIGNETTES = { es, pt, it, de, en, tr, ar, ru, fa, sw, hi, zh, ko, ja }

export const aUneVignette = (langueId) => Boolean(VIGNETTES[langueId])

// La vignette d'une destination. `titre` : le nom de la ville, pour les
// lecteurs d'écran — sans titre le dessin est décoratif.
export function VignetteVille({ langue, langueId = langue?.id, ...reste }) {
  const dessin = VIGNETTES[langueId]
  if (!dessin) return null
  return <Vignette {...reste}>{dessin}</Vignette>
}
