// La boussole-zellige : étoile à 8 branches (khatam), aiguille vers le nord-est.

export function MarqueRihla({ taille = 48, surMajorelle = false }) {
  const etoile = surMajorelle ? '#F7F0E3' : '#4E46C8'
  const centre = surMajorelle ? '#4E46C8' : '#F7F0E3'
  const aiguilleNord = surMajorelle ? '#E9A319' : '#C8552F'
  const aiguilleSud = surMajorelle ? '#F7F0E3' : '#2B1E12'
  return (
    <svg width={taille} height={taille} viewBox="0 0 100 100" aria-hidden="true">
      <g fill={etoile}>
        <rect x="20" y="20" width="60" height="60" rx="6" />
        <rect x="20" y="20" width="60" height="60" rx="6" transform="rotate(45 50 50)" />
      </g>
      <circle cx="50" cy="50" r="20.5" fill={centre} />
      <polygon points="63.5,36.5 54.2,54.2 45.8,45.8" fill={aiguilleNord} />
      <polygon points="36.5,63.5 45.8,45.8 54.2,54.2" fill={aiguilleSud} />
      <circle cx="50" cy="50" r="3.2" fill={aiguilleSud} />
    </svg>
  )
}
