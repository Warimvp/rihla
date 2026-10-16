import { useCurrentFrame } from 'remotion'
import { Easing, interpolate } from 'remotion'
import { Capture, Toucher } from './Telephone.jsx'
import manifeste from '../../public/ecrans/manifeste.json'

export { manifeste }

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
const centre = (b) => [b.x + b.w / 2, b.y + b.h / 2]

// Des captures qui se succèdent : `etats` = [{ de, src }] (images locales, ordre croissant). La précédente reste dessous,
// la nouvelle se fond par-dessus — pas de trou, jamais d'écran vide. `touchers` = [{ t, x, y }].
export const Etats = ({ etats, touchers = [], fondu = 4 }) => {
  const frame = useCurrentFrame()
  const i = etats.reduce((k, e, j) => (frame >= e.de ? j : k), 0)
  const courant = etats[i]
  const precedent = i > 0 ? etats[i - 1] : null
  const p = interpolate(frame, [courant.de, courant.de + fondu], [0, 1], { ...clamp, easing: Easing.linear })
  return (
    <>
      {precedent ? <Capture src={precedent.src} /> : null}
      <Capture src={courant.src} opacite={precedent ? p : 1} />
      {touchers.map((tt, k) => (
        <Toucher key={k} x={tt.x} y={tt.y} t={frame - tt.t} />
      ))}
    </>
  )
}

// La carte-mot qui se retourne : on rejoue le geste sur de vraies captures — le décor sans carte,
// puis la carte seule (recto / verso) en rotation 3D.
const DUREE_RETOURNEMENT = 14
export const EcranCartes = ({ id, cartes }) => {
  const frame = useCurrentFrame()
  const m = manifeste[id]
  const i = cartes.reduce((k, c, j) => (frame >= c.debut ? j : k), 0)
  const c = cartes[i]
  const info = m.cartes[i]
  const retourne = frame >= c.retourne
  const p = interpolate(frame, [c.retourne, c.retourne + DUREE_RETOURNEMENT], [0, 1], { ...clamp, easing: Easing.bezier(0.4, 0, 0.2, 1) })
  const angle = p * 180
  const entree = i > 0 ? interpolate(frame, [c.debut, c.debut + 5], [0, 1], { ...clamp, easing: Easing.linear }) : 1
  const [bx, by] = centre(info.boiteBouton)
  const dossier = `lecon-${id}/`

  const couche = (k, opacite) => {
    const n = m.cartes[k]
    const ck = cartes[k]
    const apres = frame >= ck.retourne
    const ang = apres ? interpolate(frame, [ck.retourne, ck.retourne + DUREE_RETOURNEMENT], [0, 180], { ...clamp, easing: Easing.bezier(0.4, 0, 0.2, 1) }) : 0
    const montreVerso = ang > 90
    return (
      <div key={k} style={{ position: 'absolute', inset: 0, opacity: opacite }}>
        <Capture src={`${dossier}c${k}-base-${apres ? 'verso' : 'recto'}.jpg`} />
        <Capture
          src={`${dossier}c${k}-${montreVerso ? 'verso' : 'recto'}.png`}
          boite={n.boiteCarte}
          style={{
            transform: `perspective(1100px) rotateY(${montreVerso ? ang - 180 : ang}deg)`,
            filter: 'drop-shadow(0 8px 14px rgba(43,30,18,0.16))',
          }}
        />
      </div>
    )
  }

  return (
    <>
      {i > 0 && entree < 1 ? couche(i - 1, 1) : null}
      {couche(i, entree)}
      {/* le doigt : « اعرض الجواب » pour retourner, « التالي » pour passer à la suivante */}
      <Toucher x={bx} y={by} t={frame - (c.retourne - 5)} />
      {c.suivante != null ? <Toucher x={bx} y={by} t={frame - c.suivante} /> : null}
    </>
  )
}

// Un quiz joué : pour chaque question, ses états (avant / pendant / après) et les touchers, à partir du manifeste.
// `plan` = { q, debut, repond, suite? } en images locales ; les tuiles se posent au fil de `pose` (images).
export const EcranQuiz = ({ id, plan }) => {
  const m = manifeste[id]
  const etats = []
  const touchers = []
  plan.forEach((p) => {
    const rec = m.questions[p.q]
    const d = `lecon-${id}/q${p.q}-`
    etats.push({ de: p.debut, src: `${d}a.jpg` })
    if (rec.type === 'epeler' || rec.type === 'ordonner') {
      // les tuiles : un toucher par lettre, étalés entre `repond` et `fin`
      const n = rec.taps.length
      const intermediaires = rec.etapes.filter((e) => /^m\d/.test(e))
      rec.taps.forEach((tap, k) => {
        const t = p.repond + k * (p.pasTuile ?? 9)
        touchers.push({ t, ...(() => { const [x, y] = centre(tap); return { x, y } })() })
        const etape = k === 0 ? 'm1' : `m${k + 1}`
        if (intermediaires.includes(etape)) etats.push({ de: t + 5, src: `${d}${etape}.jpg` })
      })
      etats.push({ de: p.repond + (n - 1) * (p.pasTuile ?? 9) + 6, src: `${d}b.jpg` })
    } else {
      const [x, y] = centre(rec.taps[0])
      touchers.push({ t: p.repond, x, y })
      etats.push({ de: p.repond + 4, src: `${d}b.jpg` })
    }
    if (p.suite != null) {
      const [x, y] = centre(rec.boiteContinuer)
      touchers.push({ t: p.suite, x, y })
    }
  })
  etats.sort((a, b) => a.de - b.de)
  return <Etats etats={etats} touchers={touchers} />
}
