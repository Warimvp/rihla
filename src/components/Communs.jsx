import { Boussole, Etoile8, Livre, PasseportIcone, Rouages } from './Icones.jsx'

export function Pastille({ langue, taille = 42, estompee = false }) {
  return (
    <span
      className="pastille"
      style={{
        width: taille,
        height: taille,
        fontSize: taille * 0.33,
        background: estompee ? 'var(--desactive)' : langue.couleur,
        color: estompee ? 'var(--encre-3)' : langue.couleurTexte,
      }}
    >
      {langue.code}
    </span>
  )
}

export function AnneauProgres({ fraction, taille = 40, epaisseur = 4.5, etiquette }) {
  const rayon = (taille - epaisseur) / 2 - 1
  const tour = 2 * Math.PI * rayon
  const plein = Math.max(0.001, Math.min(1, fraction)) * tour
  const centre = taille / 2
  return (
    <svg width={taille} height={taille} viewBox={`0 0 ${taille} ${taille}`} aria-hidden="true">
      <circle cx={centre} cy={centre} r={rayon} fill="none" stroke="var(--piste)" strokeWidth={epaisseur} />
      <circle
        cx={centre}
        cy={centre}
        r={rayon}
        fill="none"
        stroke="var(--majorelle)"
        strokeWidth={epaisseur}
        strokeLinecap="round"
        strokeDasharray={`${plein} ${tour - plein}`}
        transform={`rotate(-90 ${centre} ${centre})`}
      />
      {etiquette ? (
        <text
          x={centre}
          y={centre + 3.5}
          textAnchor="middle"
          fontSize={taille * 0.26}
          fontWeight="700"
          fill="var(--majorelle-fonce)"
          fontFamily="Readex Pro, sans-serif"
        >
          {etiquette}
        </text>
      ) : null}
    </svg>
  )
}

export function ChipSerie({ compte, t }) {
  if (!compte) return null
  return (
    <span className="chip chip--menthe">
      <Etoile8 taille={13} />
      {t.serieCourte(compte)}
    </span>
  )
}

const ONGLETS = [
  { id: 'carte', Icone: Boussole },
  { id: 'apprendre', Icone: Livre },
  { id: 'passeport', Icone: PasseportIcone },
  { id: 'reglages', Icone: Rouages },
]

export function BarreOnglets({ actif, sur, t }) {
  return (
    <nav className="barre-onglets" aria-label="Navigation">
      {ONGLETS.map(({ id, Icone }) => {
        const estActif = id === actif
        return (
          <button
            key={id}
            type="button"
            className={`onglet ${estActif ? 'onglet--actif' : ''}`}
            onClick={() => sur(id)}
            aria-current={estActif ? 'page' : undefined}
          >
            <Icone taille={20} />
            <span>{t.onglets[id]}</span>
          </button>
        )
      })}
    </nav>
  )
}
